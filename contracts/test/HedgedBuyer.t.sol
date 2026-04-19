// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {HedgedBuyer} from "../src/HedgedBuyer.sol";
import {ILevelOrderManager} from "../src/interfaces/ILevelOrderManager.sol";
import {IERC20} from "../src/interfaces/IERC20.sol";

contract HedgedBuyerTest is Test {
    // ── BSC mainnet constants ────────────────────────────────────────────────
    address constant USDT_BSC  = 0x55d398326f99059fF775485246999027B3197955;
    address constant FOUR_MEME = 0x5c952063c7fc8610FFDB798152D69F0B9550762b;
    address constant WBNB      = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;

    // ── Actors ───────────────────────────────────────────────────────────────
    address agent;
    address user;
    address userB;
    address mockLevel; // stub for Level Finance OrderManager

    HedgedBuyer hedger;

    // ── Re-declare events for vm.expectEmit ──────────────────────────────────
    event HedgedBuy(address indexed user, address indexed token, uint256 bnbSpent, uint256 usdtHedged, uint256 orderId);
    event PositionClosed(address indexed user, uint256 orderId);
    event CapSet(address indexed user, uint256 cap);

    // ── Setup ────────────────────────────────────────────────────────────────
    function setUp() public {
        vm.createSelectFork(vm.rpcUrl("bsc"));

        agent      = makeAddr("agent");
        user       = makeAddr("user");
        userB      = makeAddr("userB");
        mockLevel  = makeAddr("mockLevel");

        hedger = new HedgedBuyer(agent, FOUR_MEME, USDT_BSC, mockLevel);

        deal(USDT_BSC, user, 10_000 ether);
        vm.deal(user,  10 ether);
        vm.deal(agent, 10 ether);
    }

    // ── 1. OnlyAgent guard ───────────────────────────────────────────────────
    function test_RevertIf_NotAgent() public {
        vm.prank(user);
        vm.expectRevert(HedgedBuyer.OnlyAgent.selector);
        hedger.hedgedBuy{value: 1 ether}(user, address(0xBEEF), 0, 100 ether, 100 ether, 500 ether);
    }

    // ── 2. setCap resets epoch state ─────────────────────────────────────────
    function test_SetCap_ResetsEpoch() public {
        vm.prank(user);
        hedger.setCap(100 ether);

        (uint256 cap, uint256 spent, uint256 resetAt) = hedger.userCaps(user);
        assertEq(cap,   100 ether, "cap");
        assertEq(spent, 0,         "spentToday");
        assertGt(resetAt, block.timestamp, "capResetAt > now");
    }

    // ── 3. OverCap revert ────────────────────────────────────────────────────
    function test_RevertIf_OverCap() public {
        vm.prank(user);
        hedger.setCap(100 ether);

        vm.prank(agent);
        vm.expectRevert(HedgedBuyer.OverCap.selector);
        hedger.hedgedBuy{value: 1 ether}(user, address(0xBEEF), 0, 200 ether, 200 ether, 500 ether);
    }

    // ── 4. Epoch rollover zeros the cap ──────────────────────────────────────
    function test_EpochRollover() public {
        address token    = address(0xBEEF);
        uint256 hedgeAmt = 50 ether;

        vm.prank(user);
        hedger.setCap(100 ether);

        vm.prank(user);
        IERC20(USDT_BSC).approve(address(hedger), type(uint256).max);

        _mockFourMeme(token, user, 1 ether, 0);
        _mockLevelPlaceOrder();

        vm.prank(agent);
        hedger.hedgedBuy{value: 1 ether}(user, token, 0, hedgeAmt, 50 ether, 500 ether);

        // Warp past epoch boundary — cap rolls to 0
        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(agent);
        vm.expectRevert(HedgedBuyer.OverCap.selector);
        hedger.hedgedBuy{value: 1 ether}(user, token, 0, 60 ether, 60 ether, 500 ether);
    }

    // ── 5. Happy path: open then close ───────────────────────────────────────
    function test_UserCloseHappyPath() public {
        address token    = address(0xBEEF);
        uint256 hedgeAmt = 4 ether;

        vm.prank(user);
        hedger.setCap(100 ether);

        vm.prank(user);
        IERC20(USDT_BSC).approve(address(hedger), type(uint256).max);

        _mockFourMeme(token, user, 1 ether, 0);
        _mockLevelPlaceOrder();

        vm.prank(agent);
        hedger.hedgedBuy{value: 1 ether}(user, token, 0, hedgeAmt, 4 ether, 500 ether);

        // orderId assigned internally starts at 1
        uint256 orderId = hedger.userPositions(user, 0);
        assertEq(orderId, 1, "orderId should be 1");

        _mockLevelPlaceOrder();

        vm.expectEmit(true, false, false, true);
        emit PositionClosed(user, orderId);

        vm.prank(user);
        hedger.userClose(orderId, 0);

        // Position removed from registry
        vm.expectRevert();
        hedger.userPositions(user, 0);
    }

    // ── 6. Cannot close another user's position ──────────────────────────────
    function test_RevertIf_CloseOthersPosition() public {
        address token    = address(0xBEEF);
        uint256 hedgeAmt = 4 ether;

        vm.prank(user);
        hedger.setCap(100 ether);

        vm.prank(user);
        IERC20(USDT_BSC).approve(address(hedger), type(uint256).max);

        _mockFourMeme(token, user, 1 ether, 0);
        _mockLevelPlaceOrder();

        vm.prank(agent);
        hedger.hedgedBuy{value: 1 ether}(user, token, 0, hedgeAmt, 4 ether, 500 ether);

        vm.prank(userB);
        vm.expectRevert(HedgedBuyer.NotYourPosition.selector);
        hedger.userClose(1, 0);
    }

    // ── 7. Recover dust ──────────────────────────────────────────────────────
    function test_Recover() public {
        uint256 dust = 5 ether;
        deal(USDT_BSC, address(hedger), dust);

        uint256 balBefore = IERC20(USDT_BSC).balanceOf(user);

        vm.prank(user);
        hedger.recover(USDT_BSC);

        assertEq(IERC20(USDT_BSC).balanceOf(user) - balBefore, dust);
        assertEq(IERC20(USDT_BSC).balanceOf(address(hedger)), 0);
    }

    // ── 8. Integration: verify all side-effects ──────────────────────────────
    function test_HedgedBuy_Integration() public {
        address token     = address(0xCAFE);
        uint256 bnbIn     = 1 ether;
        uint256 hedgeAmt  = 50 ether;
        uint256 sizeDelta = 50 ether;
        uint256 maxPrice  = 500 ether;

        vm.prank(user);
        hedger.setCap(100 ether);

        vm.prank(user);
        IERC20(USDT_BSC).approve(address(hedger), type(uint256).max);

        uint256 usdtBefore = IERC20(USDT_BSC).balanceOf(user);

        // Assert Four.meme buyTokenAMAP called with correct args
        vm.expectCall(
            FOUR_MEME,
            bnbIn,
            abi.encodeWithSelector(
                bytes4(keccak256("buyTokenAMAP(address,address,uint256,uint256)")),
                token, user, bnbIn, uint256(0)
            )
        );

        // Assert Level placeOrder called
        vm.expectCall(
            mockLevel,
            abi.encodeWithSelector(ILevelOrderManager.placeOrder.selector)
        );

        _mockFourMeme(token, user, bnbIn, 0);
        _mockLevelPlaceOrder();

        vm.expectEmit(true, true, false, true);
        emit HedgedBuy(user, token, bnbIn, hedgeAmt, 1);

        vm.prank(agent);
        hedger.hedgedBuy{value: bnbIn}(user, token, 0, hedgeAmt, sizeDelta, maxPrice);

        // USDT pulled from user
        assertEq(usdtBefore - IERC20(USDT_BSC).balanceOf(user), hedgeAmt, "usdt pulled");

        // Position recorded
        assertEq(hedger.userPositions(user, 0), 1, "orderId stored");

        // Epoch spent updated
        (, uint256 spent,) = hedger.userCaps(user);
        assertEq(spent, hedgeAmt, "epoch spent updated");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    function _mockFourMeme(address token, address to, uint256 funds, uint256 minAmount) internal {
        vm.mockCall(
            FOUR_MEME,
            abi.encodeWithSelector(
                bytes4(keccak256("buyTokenAMAP(address,address,uint256,uint256)")),
                token, to, funds, minAmount
            ),
            abi.encode()
        );
    }

    function _mockLevelPlaceOrder() internal {
        vm.mockCall(
            mockLevel,
            abi.encodeWithSelector(ILevelOrderManager.placeOrder.selector),
            abi.encode()
        );
    }
}
