// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "./interfaces/IERC20.sol";
import {IFourMemeTokenManager} from "./interfaces/IFourMemeTokenManager.sol";
import {ILevelOrderManager} from "./interfaces/ILevelOrderManager.sol";

contract HedgedBuyer is ReentrancyGuard {
    // WBNB — index token passed to Level Finance as the short market
    address public constant WBNB  = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    uint256 public constant EPOCH = 1 days;

    // ── Immutables ────────────────────────────────────────────────────────────
    address public immutable FOUR_MEME;
    address public immutable USDT;
    address public immutable agent;
    address public immutable LEVEL_ORDER_MANAGER;

    // ── State ─────────────────────────────────────────────────────────────────
    struct UserCap {
        uint256 cap;
        uint256 spent;
        uint256 resetAt;
    }

    mapping(address => UserCap)   public userCaps;
    mapping(address => uint256[]) public userPositions;

    uint256 private _nextOrderId;  // local order counter for position tracking

    // ── Errors ────────────────────────────────────────────────────────────────
    error OnlyAgent();
    error OverCap();
    error NotYourPosition();

    // ── Events ────────────────────────────────────────────────────────────────
    event HedgedBuy(address indexed user, address indexed token, uint256 bnbSpent, uint256 usdtHedged, uint256 orderId);
    event CapSet(address indexed user, uint256 cap);
    event PositionClosed(address indexed user, uint256 orderId);

    modifier onlyAgent() {
        if (msg.sender != agent) revert OnlyAgent();
        _;
    }

    /// @param _agent        TEE agent wallet.
    /// @param _fourMeme     Four.meme TokenManager2 (placeholder on testnet).
    /// @param _usdt         USDT address for this chain.
    /// @param _levelManager Level Finance OrderManager (0xf584A17...on mainnet, mock on testnet).
    constructor(address _agent, address _fourMeme, address _usdt, address _levelManager) {
        agent                = _agent;
        FOUR_MEME            = _fourMeme;
        USDT                 = _usdt;
        LEVEL_ORDER_MANAGER  = _levelManager;
    }

    // ── User ops ──────────────────────────────────────────────────────────────

    function setCap(uint256 cap) external {
        userCaps[msg.sender] = UserCap({cap: cap, spent: 0, resetAt: block.timestamp + EPOCH});
        emit CapSet(msg.sender, cap);
    }

    // ── Agent ops ─────────────────────────────────────────────────────────────

    /// @param user          Wallet whose cap is debited.
    /// @param token         Four.meme bonding-curve token to buy.
    /// @param minAmount     Minimum meme tokens to receive (slippage guard).
    /// @param hedgeUsdt     USDT collateral for the BNB short (pre-approved by user).
    /// @param sizeDelta     Notional short size in USDT 18-dec.
    /// @param maxIndexPrice Worst acceptable BNB price for the short (18-dec). 0 = market.
    function hedgedBuy(
        address user,
        address token,
        uint256 minAmount,
        uint256 hedgeUsdt,
        uint256 sizeDelta,
        uint256 maxIndexPrice
    ) external payable onlyAgent nonReentrant {
        UserCap storage uc = userCaps[user];

        if (block.timestamp >= uc.resetAt) { uc.cap = 0; uc.spent = 0; }
        if (uc.spent + hedgeUsdt > uc.cap) revert OverCap();
        uc.spent += hedgeUsdt;

        // Buy meme tokens via Four.meme — tokens delivered directly to user
        IFourMemeTokenManager(FOUR_MEME).buyTokenAMAP{value: msg.value}(
            token, user, msg.value, minAmount
        );

        // Pull USDT from user, approve Level OrderManager
        IERC20(USDT).transferFrom(user, address(this), hedgeUsdt);
        IERC20(USDT).approve(LEVEL_ORDER_MANAGER, hedgeUsdt);

        // Place BNB short via Level Finance
        // data = abi.encode(price, payToken, purchaseAmount, sizeChange, collateral, extradata)
        bytes memory orderData = abi.encode(
            maxIndexPrice,  // price (0 = market order)
            USDT,           // payToken
            hedgeUsdt,      // purchaseAmount
            sizeDelta,      // sizeChange
            hedgeUsdt,      // collateral
            bytes("")       // extradata
        );

        ILevelOrderManager(LEVEL_ORDER_MANAGER).placeOrder(
            ILevelOrderManager.UpdatePositionType.INCREASE,
            ILevelOrderManager.Side.SHORT,
            WBNB,
            USDT,
            ILevelOrderManager.OrderType.MARKET,
            orderData
        );

        uint256 orderId = ++_nextOrderId;
        userPositions[user].push(orderId);
        emit HedgedBuy(user, token, msg.value, hedgeUsdt, orderId);
    }

    // ── User close ────────────────────────────────────────────────────────────

    /// @param orderId       ID returned by hedgedBuy.
    /// @param minIndexPrice Worst acceptable BNB price (18-dec). 0 = market.
    function userClose(uint256 orderId, uint256 minIndexPrice) external nonReentrant {
        uint256[] storage positions = userPositions[msg.sender];
        uint256 len = positions.length;
        bool found;
        for (uint256 i; i < len; ++i) {
            if (positions[i] == orderId) {
                positions[i] = positions[len - 1];
                positions.pop();
                found = true;
                break;
            }
        }
        if (!found) revert NotYourPosition();

        // Place DECREASE order on Level Finance
        bytes memory orderData = abi.encode(
            minIndexPrice,  // price (0 = market)
            0,              // collateral to remove
            0,              // sizeChange (0 = close full)
            msg.sender,     // receiver of payout
            bytes("")       // extradata
        );

        ILevelOrderManager(LEVEL_ORDER_MANAGER).placeOrder(
            ILevelOrderManager.UpdatePositionType.DECREASE,
            ILevelOrderManager.Side.SHORT,
            WBNB,
            USDT,
            ILevelOrderManager.OrderType.MARKET,
            orderData
        );

        emit PositionClosed(msg.sender, orderId);
    }

    // ── Escape hatch ──────────────────────────────────────────────────────────

    function recover(address token) external {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }
}
