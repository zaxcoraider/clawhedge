// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// TokenManager2 (V2) @ 0x5c952063c7fc8610FFDB798152D69F0B9550762b (BSC mainnet)
// ABI source: four-meme.gitbook.io/four.meme/brand/protocol-integration.md → TokenManager2.lite.abi
// Docs source: API-Documents.03-03-2026.md (official Four.meme protocol docs)
interface IFourMemeTokenManager {
    // Emitted on every buy.
    event TokenPurchase(
        address token,
        address account,
        uint256 tokenAmount,
        uint256 etherAmount
    );

    // Buy up to `funds` BNB worth of `token`, send to msg.sender.
    function buyTokenAMAP(
        address token,
        uint256 funds,
        uint256 minAmount
    ) external payable;

    // Buy up to `funds` BNB worth of `token`, send to `to`.
    function buyTokenAMAP(
        address token,
        address to,
        uint256 funds,
        uint256 minAmount
    ) external payable;

    // Sell `amount` tokens back to the bonding curve.
    function sellToken(address token, uint256 amount) external;

    // Sell with a third-party router fee (feeRate: 100 = 1%, max 5%).
    function sellToken(
        uint256 origin,
        address token,
        uint256 amount,
        uint256 minFunds,
        uint256 feeRate,
        address feeRecipient
    ) external;

    // Create a new bonding-curve token (off-chain signed payload).
    function createToken(bytes calldata createArg, bytes calldata signature) external payable;
}
