// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {BaseScript} from "./Base.s.sol";
import {sBTC} from "../contracts/sBTC.sol";
import {Protocol} from "../contracts/Protocol.sol";
import {TokenDeployer} from "../contracts/axelar/TokenDeployer.sol";
import {AxelarGasService} from "../contracts/axelar/AxelarGasService.sol";
import {AxelarAuthWeighted} from "../contracts/axelar/AxelarAuthWeighted.sol";
import {AxelarGateway} from "../contracts/axelar/AxelarGateway.sol";
import {console2} from "forge-std/src/console2.sol";

contract Deploy is BaseScript {
    function run() public broadcast {
        sBTC token = new sBTC();
        TokenDeployer tokenDeployer = new TokenDeployer();
        AxelarGasService gasService = new AxelarGasService(broadcaster);

        bytes[] memory operators = new bytes[](0);
        AxelarAuthWeighted authWeighted = new AxelarAuthWeighted(operators);

        // console2.log("Auth weighted address:", address(authWeighted));

        // address authWeightedAddress = address(authWeighted);
        // console2.log("Auth weighted length:", authWeightedAddress.code.length);

        // AxelarGateway axelarGateway = new AxelarGateway(
        //     address(authWeighted),
        //     address(tokenDeployer)
        // );

        // Protocol protocol = new Protocol(
        //     address(axelarGateway),
        //     address(gasService),
        //     address(token)
        // );

        // token.setProtocolContract(address(protocol));
    }
}

// forge script scripts2/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --etherscan-api-key $ETHERSCAN_API_KEY --verify -vvvv
