// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HedgedBuyer} from "../src/HedgedBuyer.sol";

contract Deploy is Script {
    function run() external {
        // All addresses read from environment — no hardcoding.
        // Testnet values (set in .env or shell):
        //   FOURMEME_ADDR = 0x0000000000000000000000000000000000000001
        //   MYX_ADDR      = 0x0000000000000000000000000000000000000002
        //   USDT_ADDR     = 0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
        //   TEE_AGENT_ADDR = <your agent wallet>
        address fourMeme     = vm.envAddress("FOURMEME_ADDR");
        address levelManager = vm.envOr("LEVEL_ORDER_MANAGER", address(0xf584A17dF21Afd9de84F47842ECEAF6042b1Bb5b));
        address usdtAddr     = vm.envAddress("USDT_ADDR");
        address teeAgent     = vm.envAddress("TEE_AGENT_ADDR");

        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        HedgedBuyer buyer = new HedgedBuyer(teeAgent, fourMeme, usdtAddr, levelManager);
        vm.stopBroadcast();

        console.log("HedgedBuyer deployed at:", address(buyer));
        console.log("  agent        :", teeAgent);
        console.log("  fourMeme     :", fourMeme);
        console.log("  usdt         :", usdtAddr);
        console.log("  levelManager :", levelManager);
    }
}
