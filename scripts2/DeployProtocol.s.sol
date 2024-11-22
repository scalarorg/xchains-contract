// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript} from "./Base.s.sol";
import {ProtocolToken} from "../contracts/ProtocolToken.sol";
import {Protocol} from "../contracts/Protocol.sol";
import {Predeploys} from "./Predeploys.s.sol";
import {console2} from "forge-std/src/console2.sol";

contract DeployProtocol is BaseScript {
    function run() public broadcast returns (ProtocolToken, Protocol) {
        ProtocolToken token = new ProtocolToken("pBTC", "pBTC");

        Protocol protocol = new Protocol(
            address(Predeploys.GATEWAY_ADDRESS),
            address(Predeploys.GAS_SERVICES),
            address(token)
        );

        token.setProtocolContract(address(protocol));

        return (token, protocol);
    }
}

// forge script scripts2/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --etherscan-api-key $ETHERSCAN_API_KEY --verify -vvvv
