// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {IFourMemeTokenManager} from "./interfaces/IFourMemeTokenManager.sol";
import {IMYXRouter} from "./interfaces/IMYXRouter.sol";

contract HedgedBuyer is ReentrancyGuard {
    // ── Chain-invariant constant ─────────────────────────────────────────────
    // WBNB is the index token passed to openShort. Same concept on testnet;
    // testnet value: 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    uint256 public constant EPOCH = 1 days;

    // ── Immutables (set per-chain via constructor) ────────────────────────────
    address    public immutable FOUR_MEME;  // Four.meme TokenManager2 (or placeholder)
    address    public immutable USDT;       // collateral token (18-dec on BSC)
    address    public immutable agent;      // TEE agent wallet
    IMYXRouter public immutable MYX_ROUTER; // perp DEX router (or placeholder)

    // ── State ────────────────────────────────────────────────────────────────

    struct UserCap {
        uint256 cap;      // max USDT per epoch (set by user)
        uint256 spent;    // USDT spent this epoch
        uint256 resetAt;  // epoch expiry timestamp
    }

    mapping(address => UserCap)   public userCaps;
    mapping(address => uint256[]) public userPositions;

    // ── Errors ───────────────────────────────────────────────────────────────
    error OnlyAgent();
    error OverCap();
    error ShortFailed();
    error NotYourPosition();

    // ── Events ───────────────────────────────────────────────────────────────
    event HedgedBuy(
        address indexed user,
        address indexed token,
        uint256 bnbSpent,
        uint256 usdtHedged,
        uint256 positionId
    );
    event CapSet(address indexed user, uint256 cap);
    event PositionClosed(address indexed user, uint256 positionId, uint256 payout);

    modifier onlyAgent() {
        if (msg.sender != agent) revert OnlyAgent();
        _;
    }

    /// @param _agent     TEE agent wallet (only address that can call hedgedBuy).
    /// @param _fourMeme  Four.meme TokenManager2 — use placeholder on testnet.
    /// @param _usdt      USDT / collateral token address for this chain.
    /// @param _myxRouter Perp DEX router — use placeholder on testnet.
    constructor(
        address _agent,
        address _fourMeme,
        address _usdt,
        address _myxRouter
    ) {
        agent      = _agent;
        FOUR_MEME  = _fourMeme;
        USDT       = _usdt;
        MYX_ROUTER = IMYXRouter(_myxRouter);
    }

    // ── User ops ─────────────────────────────────────────────────────────────

    /// User self-authorises a daily USDT hedge budget and starts a fresh epoch.
    function setCap(uint256 cap) external {
        userCaps[msg.sender] = UserCap({cap: cap, spent: 0, resetAt: block.timestamp + EPOCH});
        emit CapSet(msg.sender, cap);
    }

    // ── Agent ops ────────────────────────────────────────────────────────────

    /// @param user          Wallet whose cap is debited.
    /// @param token         Four.meme bonding-curve token to buy.
    /// @param minAmount     Minimum meme tokens to receive (slippage guard).
    /// @param hedgeUsdt     USDT collateral for the BNB short (pre-approved by user).
    /// @param sizeDelta     Notional short size in USDT 18-dec.
    /// @param maxIndexPrice Worst acceptable BNB price for opening the short (18-dec).
    function hedgedBuy(
        address user,
        address token,
        uint256 minAmount,
        uint256 hedgeUsdt,
        uint256 sizeDelta,
        uint256 maxIndexPrice
    ) external payable onlyAgent nonReentrant {
        UserCap storage uc = userCaps[user];

        // Epoch rollover: cap resets to 0, user must top up via setCap.
        if (block.timestamp >= uc.resetAt) {
            uc.cap   = 0;
            uc.spent = 0;
        }

        if (uc.spent + hedgeUsdt > uc.cap) revert OverCap();
        uc.spent += hedgeUsdt;

        // Buy meme tokens; Four.meme delivers them directly to user.
        IFourMemeTokenManager(FOUR_MEME).buyTokenAMAP{value: msg.value}(
            token, user, msg.value, minAmount
        );

        // Pull USDT collateral from user and approve router.
        IERC20(USDT).transferFrom(user, address(this), hedgeUsdt);
        IERC20(USDT).approve(address(MYX_ROUTER), hedgeUsdt);

        // Open BNB short; index = WBNB, margin = USDT.
        uint256 positionId = MYX_ROUTER.openShort(
            WBNB, USDT, hedgeUsdt, sizeDelta, maxIndexPrice
        );
        if (positionId == 0) revert ShortFailed();

        userPositions[user].push(positionId);
        emit HedgedBuy(user, token, msg.value, hedgeUsdt, positionId);
    }

    // ── User close ───────────────────────────────────────────────────────────

    /// @param positionId    ID returned by a prior hedgedBuy call.
    /// @param minIndexPrice Worst acceptable BNB price for closing (18-dec).
    function userClose(uint256 positionId, uint256 minIndexPrice) external nonReentrant {
        uint256[] storage positions = userPositions[msg.sender];
        uint256 len = positions.length;
        bool found;
        for (uint256 i; i < len; ++i) {
            if (positions[i] == positionId) {
                positions[i] = positions[len - 1];
                positions.pop();
                found = true;
                break;
            }
        }
        if (!found) revert NotYourPosition();

        uint256 payout = MYX_ROUTER.closePosition(positionId, minIndexPrice);
        IERC20(USDT).transfer(msg.sender, payout);
        emit PositionClosed(msg.sender, positionId, payout);
    }

    // ── Escape hatch ─────────────────────────────────────────────────────────

    /// Sends entire contract balance of `token` to msg.sender.
    function recover(address token) external {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(msg.sender, bal);
    }
}
