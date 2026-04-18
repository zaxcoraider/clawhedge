// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// TokenManagerHelper3 @ 0xF251F83e40a78868FcfA3FA4599Dad6494E46034 (BSC mainnet)
// Read-only quote/info contract. Signatures sourced from @pieverseio/purr-cli production code.
interface IFourMemeHelper3 {
    // Returns full token state from the bonding curve.
    function getTokenInfo(address token)
        external
        view
        returns (
            uint256 version,
            address tokenManager,
            address quote,
            uint256 lastPrice,
            uint256 tradingFeeRate,
            uint256 minTradingFee,
            uint256 launchTime,
            uint256 offers,
            uint256 maxOffers,
            uint256 funds,
            uint256 maxFunds,
            bool liquidityAdded
        );

    // Simulate a buy: returns estimated cost, output amount, and fee.
    function tryBuy(address token, uint256 amount, uint256 funds)
        external
        view
        returns (
            address tokenManager,
            address quote,
            uint256 estimatedAmount,
            uint256 estimatedCost,
            uint256 estimatedFee,
            uint256 amountMsgValue,
            uint256 amountApproval,
            uint256 amountFunds
        );

    // Simulate a sell: returns estimated proceeds and fee.
    function trySell(address token, uint256 amount)
        external
        view
        returns (
            address tokenManager,
            address quote,
            uint256 funds,
            uint256 fee
        );
}
