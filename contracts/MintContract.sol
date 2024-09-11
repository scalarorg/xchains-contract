// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import {BoringOwnable} from "../lib/BoringSolidity/contracts/BoringOwnable.sol";
import {sBTC} from "./sBTC.sol";
/**
 * @title CallContract
 * @notice Send a message from chain A to chain B and stores gmp message
 */
contract MintContract is AxelarExecutable, BoringOwnable {
    sBTC public sbtc;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;

    event Executed(string _from, address _to, uint256 _amount);

    /**
     *
     * @param _gateway address of axl gateway on deployed chain
     * @param _gasReceiver address of axl gas service on deployed chain
     */
    constructor(address _gateway, address _gasReceiver, address _sBTC) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
        sbtc = sBTC(_sBTC);
    }

    /**
     * @notice Send payload from chain A to chain B
     * @dev payload param is passed in as gmp message
     * @param destinationChain name of the dest chain (ex. "Fantom")
     * @param destinationAddress address on dest chain this tx is going to
     * @param _to address of the recipient
     * @param _amount amount to mint
     */
    function callMint(
        string calldata destinationChain,
        string calldata destinationAddress,
        address _to,
        uint256 _amount
    ) external payable {
        require(msg.value > 0, 'Gas payment is required');
        
        bytes memory payload = abi.encode(_to, _amount);
        gasService.payNativeGasForContractCall{ value: msg.value }(
            address(this),
            destinationChain,
            destinationAddress,
            payload,
            msg.sender
        );
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    /**
     * @notice logic to be executed on dest chain
     * @dev this is triggered automatically by relayer
     * @param _sourceChain blockchain where tx is originating from
     * @param _sourceAddress address on src chain where tx is originating from
     * @param _payload encoded gmp message sent from src chain
     */
    function _execute(string calldata _sourceChain, string calldata _sourceAddress, bytes calldata _payload) internal override {
        address to;
        uint256 amount;
        (to, amount,) = abi.decode(_payload, (address, uint256,uint256));
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;
        sbtc.mint(to, amount);
        emit Executed(sourceAddress, to, amount);
    }

    function transferMintOwnership(address newOwner) public onlyOwner {
        sbtc.transferOwnership(newOwner, true, false);
    }
}