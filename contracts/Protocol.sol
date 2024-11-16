// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {AxelarExecutable} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import {IAxelarGateway} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import {ICustomToken} from "./interface/ICustomToken.sol";

/**
 * @title Protocol
 * @notice Sends a message from chain A to chain B and handles GMP messages.
 */
contract Protocol is AxelarExecutable {
    ICustomToken public immutable token;
    IAxelarGasService public immutable gasService;

    event Executed(string _from, string _to, uint256 _amount);
    event Unstaked(address _from, uint256 _amount);

    /**
     * @param _gateway address of Axelar gateway on the deployed chain.
     * @param _gasReceiver address of Axelar gas service on the deployed chain.
     * @param _token address of the ERC20 token.
     */
    constructor(
        address _gateway,
        address _gasReceiver,
        address _token
    ) AxelarExecutable(_gateway) {
        gasService = IAxelarGasService(_gasReceiver);
        token = ICustomToken(_token);
    }

    /**
     * @notice Send payload from chain A to chain B
     * @dev Payload param is passed as GMP message.
     * @param _destinationChain Name of the destination chain (e.g., "WBitcoin").
     * @param _destinationAddress Address on destination chain to send payload to.
     * @param _amount Amount to burn (unstake).
     * @param _psbtBase64 Base64 encoded PSBT.
     */
    function unstake(
        string calldata _destinationChain,
        string calldata _destinationAddress,
        uint256 _amount,
        string calldata _psbtBase64
    ) external {
        // TODO: Check the amount is equivalent to the amount in the PSBT?
        require(_amount > 0, "Protocol: amount must be greater than 0");

        // Transfer tokens from user to the protocol contract.
        token.transferFrom(msg.sender, address(this), _amount);

        // Burn the tokens from the protocol contract.
        token.burn(_amount); // The protocol contract is now authorized to burn.

        emit Unstaked(msg.sender, _amount);

        // Prepare the payload and call the destination contract via Axelar gateway.
        bytes memory payload = abi.encode(_psbtBase64);

        gateway.callContract(_destinationChain, _destinationAddress, payload);
    }

    /**
     * @notice Handle the incoming message from another chain.
     * @param _sourceChain The chain from which the message originated.
     * @param _sourceAddress The address from which the message was sent.
     * @param _payload Encoded payload sent from the source chain.
     */
    function _execute(
        string calldata _sourceChain,
        string calldata _sourceAddress,
        bytes calldata _payload
    ) internal override {
        address to;
        uint256 amount;

        // payload was relayed from the gateway, so we need to decode it
        // payload = abi.encode(
        //     ['address', 'uint256', 'bytes32'],
        //     [destination_recipient_address, staking_amount, bitcoin_tx_hash]
        // );

        (to, amount) = abi.decode(_payload, (address, uint256));

        // Assuming mint is a function in the token contract.
        token.mint(to, amount); // Update here

        emit Executed(_sourceChain, _sourceAddress, amount);
    }
}
