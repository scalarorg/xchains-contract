// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import {IAxelarGasService} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import {IAxelarGateway} from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";


import {sBTC} from "contracts/sBTC.sol";
import {Test} from "forge-std/src/Test.sol";
import {Protocol} from "../contracts/Protocol.sol";

contract ProtocolTest is Test {
    sBTC token;
    Protocol protocol;
    address owner;
    address user;
    IAxelarGasService mockGasService;
    IAxelarGateway mockGateway;

    function setUp() public {
        // Set test accounts
        owner = address(1); // Use the test contract as the owner
        user = address(2);

        // Deploy sBTC contract
        token = new sBTC();

        // Mock Axelar contracts
        mockGasService = IAxelarGasService(address(0xCAFE));
        mockGateway = IAxelarGateway(address(0xBABE));

        // Deploy the Protocol contract
        protocol = new Protocol(address(mockGateway), address(mockGasService), address(token));

        // Mint initial tokens for the user
        token.mint(user, 1000 ether);

        // Ensure user has balance and approval is granted
        vm.startPrank(user);
        token.approve(address(protocol), 1000 ether);
        vm.stopPrank();
    }

    function testUnstake() public {
        // Initial checks
        uint256 userInitialBalance = token.balanceOf(user);
        assertEq(userInitialBalance, 1000 ether);

        // Call unstake function as the user
        vm.startPrank(user);
        protocol.unstake("WBitcoin", "0x123", 100 ether, "dummyBtcTxHex");
        vm.stopPrank();

        // Verify balances after unstaking
        uint256 userFinalBalance = token.balanceOf(user);
        uint256 protocolBalance = token.balanceOf(address(protocol));

        // The user's balance should decrease by 100 tokens and protocol should hold them before burning
        assertEq(userFinalBalance, 900 ether);
        assertEq(protocolBalance, 0); // All tokens burnt

        // Check that the protocol emitted the correct events
        vm.expectEmit(true, true, false, true);
        emit Unstaked(user, 100 ether);
    }

    function testFail_UnstakeWithoutApproval() public {
        // Revoke approval and attempt unstake
        vm.startPrank(user);
        token.approve(address(protocol), 0); // Remove approval
        protocol.unstake("WBitcoin", "0x123", 100 ether, "dummyBtcTxHex");
        vm.stopPrank();
    }

    function testExecute() public {
        // Simulate execution from another chain
        bytes memory payload = abi.encode(user, 100 ether);

        vm.prank(address(mockGateway)); // Simulate Axelar gateway call
        protocol._execute("WBitcoin", "0x123", payload);

        // Verify that the user received minted tokens
        uint256 userBalance = token.balanceOf(user);
        assertEq(userBalance, 1100 ether); // User balance after minting
    }
}
