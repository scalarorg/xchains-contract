// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import {Script} from "forge-std/src/Script.sol";
import {console2} from "forge-std/src/console2.sol";

abstract contract BaseScript is Script {
    address internal broadcaster;

    constructor() {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        console2.log("Deployer private key:", deployerPrivateKey);
        broadcaster = vm.addr(deployerPrivateKey);
        console2.log("Broadcaster address:", broadcaster);
    }

    modifier broadcast() {
        vm.startBroadcast(broadcaster);
        _;
        vm.stopBroadcast();
    }
}
