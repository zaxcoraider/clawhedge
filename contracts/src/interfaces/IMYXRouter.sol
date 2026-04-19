// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Our adapter interface for a BNB perp DEX hedge leg.
// Real MYX Finance uses createIncreaseOrder/createDecreaseOrder (async, keeper-executed).
// When the BSC router address is confirmed we will wire this to MYX or a thin proxy.
// All tests mock this interface with vm.mockCall — no live MYX calls are made.
interface IMYXRouter {
    /// Open a BNB short. Collateral (USDT) must be pre-approved.
    /// @return positionId  Non-zero on success.
    function openShort(
        address indexToken,
        address collateralToken,
        uint256 collateralAmount,
        uint256 sizeDelta,
        uint256 acceptablePrice
    ) external returns (uint256 positionId);

    /// Close a position and return collateral ± PnL to caller.
    /// @return payout  USDT amount sent back.
    function closePosition(
        uint256 positionId,
        uint256 minPrice
    ) external returns (uint256 payout);
}
