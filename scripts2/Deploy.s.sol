// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import {BaseScript} from "./Base.s.sol";
import {sBTC} from "../contracts/sBTC.sol";
import {Protocol} from "../contracts/Protocol.sol";
import {Predeploys} from "./Predeploys.s.sol";

contract Deploy is BaseScript {
    function run() public broadcast returns (sBTC, Protocol) {
        sBTC token = new sBTC();
        Protocol protocol = new Protocol(Predeploys.GATEWAY_ADDRESS, Predeploys.GAS_SERVICES, address(token));

        token.setProtocolContract(address(protocol));

        return (token, protocol);
    }
}


// forge script scripts2/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --etherscan-api-key $ETHERSCAN_API_KEY --verify -vvvv
