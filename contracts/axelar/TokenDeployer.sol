// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ITokenDeployer } from "./interfaces/ITokenDeployer.sol";

import { BurnableMintableCappedERC20 } from
    "@axelar-network/axelar-cgp-solidity/contracts/BurnableMintableCappedERC20.sol";

contract TokenDeployer is ITokenDeployer {
    function deployToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        bytes32 salt
    )
        external
        returns (address tokenAddress)
    {
        tokenAddress = address(new BurnableMintableCappedERC20{ salt: salt }(name, symbol, decimals, cap));
    }
}
