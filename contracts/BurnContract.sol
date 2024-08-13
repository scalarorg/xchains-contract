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
contract BurnContract is AxelarExecutable, BoringOwnable {
    sBTC public sbtc;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;

    event Executed(string _from, string _to);
    event Burned(address _from, uint256 _amount);

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
     * @param destinationChain name of the dest chain (ex. "WBitcoin")
     * @param destinationAddress address on dest chain to send payload to (actually do not need this)
     * @param _amount amount to burn
     * @param btcTxHex Bitcoin transaction hex to unlock
     */
    // add modifier later
    function callBurn(
        string calldata destinationChain,
        string calldata destinationAddress,
        uint256 _amount,
        string calldata btcTxHex
    ) external {
        require(_amount > 0, "BurnContract: amount must be greater than 0");
        require(_amount <= sbtc.balanceOf(msg.sender), "BurnContract: insufficient balance");
        sbtc.transferFrom(msg.sender, address(this), _amount);
        sbtc.burn(_amount);
        emit Burned(msg.sender, _amount);
        bytes memory payload = abi.encode(btcTxHex);
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
        string memory stakerAddress = abi.decode(_payload, (string));
        sourceChain = _sourceChain;
        sourceAddress = _sourceAddress;
        emit Executed(sourceAddress, stakerAddress);
    }

}