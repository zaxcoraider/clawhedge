// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// Superseded by script/Deploy.s.sol which reads all addresses from env.
// Kept for reference; use Deploy.s.sol for actual deployments.

import {Script, console} from "forge-std/Script.sol";
import {HedgedBuyer} from "../src/HedgedBuyer.sol";

contract HedgedBuyerScript is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address teeAgent     = vm.envAddress("TEE_AGENT_ADDR");
        address fourMeme     = vm.envAddress("FOURMEME_ADDR");
        address usdtAddr     = vm.envAddress("USDT_ADDR");
        address levelManager = vm.envOr("LEVEL_ORDER_MANAGER", address(0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b));

        vm.startBroadcast(deployerKey);
        HedgedBuyer buyer = new HedgedBuyer(teeAgent, fourMeme, usdtAddr, levelManager);
        vm.stopBroadcast();

        console.log("HedgedBuyer deployed at:", address(buyer));
    }
}
