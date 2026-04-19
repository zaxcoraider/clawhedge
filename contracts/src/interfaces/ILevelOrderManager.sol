// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Level Finance OrderManager — BSC mainnet: 0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b
// Real ABI sourced from: github.com/level-fi/level-trading-contracts

interface ILevelOrderManager {
    enum UpdatePositionType { INCREASE, DECREASE }
    enum Side               { LONG, SHORT }
    enum OrderType          { MARKET, LIMIT }

    // data for INCREASE orders: abi.encode(price, payToken, purchaseAmount, sizeChange, collateral, extradata)
    // data for DECREASE orders: abi.encode(price, collateral, sizeChange, receiver, extradata)
    function placeOrder(
        UpdatePositionType _updateType,
        Side               _side,
        address            _indexToken,
        address            _collateralToken,
        OrderType          _orderType,
        bytes calldata     data
    ) external payable;

    function cancelOrder(uint256 _orderId) external;
}
