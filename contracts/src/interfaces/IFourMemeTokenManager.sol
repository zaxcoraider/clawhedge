// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// TokenManager2 @ 0x5c952063c7fc8610FFDB798152D69F0B9550762b (BSC mainnet)
// TokenManager V1 @ 0xEC4549caDcE5DA21Df6E6422d448034B5233bFbC (BSC mainnet)
// Signatures verified: keccak256("TokenPurchase(address,address,uint256,uint256,uint256,uint256,uint256,uint256)")
//   = 0x7db52723a3b2cdd6164364b3b766e65e540d7be48ffa89582956d8eaebe62942 (confirmed from live BSC logs)
// Function signatures sourced from @pieverseio/purr-cli production code (not invented).
interface IFourMemeTokenManager {
    // Emitted on every buy. No indexed params beyond topic0.
    event TokenPurchase(
        address buyer,
        address token,
        uint256 funds,
        uint256 amount,
        uint256 fee,
        uint256 newPrice,
        uint256 totalOffers,
        uint256 totalFunds
    );

    // Buy up to `funds` worth, receive at least `minAmount` tokens.
    function buyTokenAMAP(
        uint256 origin,
        address token,
        address to,
        uint256 funds,
        uint256 minAmount
    ) external payable;

    // Sell `amount` tokens, receive at least `minFunds`.
    function sellToken(
        uint256 origin,
        address token,
        uint256 amount,
        uint256 minFunds
    ) external;

    // Create a new bonding-curve token (off-chain signed payload).
    function createToken(bytes calldata createArg, bytes calldata signature) external payable;
}
