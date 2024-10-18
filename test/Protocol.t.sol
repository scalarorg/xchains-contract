// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import { IAxelarGasService } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import { IAxelarGateway } from "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import { AxelarGateway } from "../contracts/axelar/AxelarGateway.sol";

import { Test } from "forge-std/src/Test.sol";
import { sBTC } from "../contracts/sBTC.sol";
import { Protocol } from "../contracts/Protocol.sol";
import { console2 } from "forge-std/src/console2.sol";

contract ProtocolTest is Test {
    sBTC token;
    Protocol protocol;
    address owner;
    address user;
    IAxelarGasService mockGasService;
    AxelarGateway gateway;

    function setUp() public {
        token = new sBTC();

        owner = token.owner();

        user = address(1);

        // Mock Axelar contracts
        mockGasService = IAxelarGasService(address(0xCAFE));
        gateway = new AxelarGateway(address(0xBEEF), address(0x1234));

        // Deploy the Protocol contract
        protocol = new Protocol(address(gateway), address(mockGasService), address(token));

        // Mint initial tokens for the user
        token.mint(user, 1000 ether);

        // Ensure user has balance and approval is granted
        vm.startPrank(user);
        token.approve(address(protocol), 1000 ether);
        vm.stopPrank();
    }

    function testUnstake() public {
        // log balance of user and allowance of protocol
        console2.log("user balance: ", token.balanceOf(user));
        console2.log("protocol allowance: ", token.allowance(user, address(protocol)));

        // Initial checks
        uint256 userInitialBalance = token.balanceOf(user);
        assertEq(userInitialBalance, 1000 ether);

        // assert total supply
        assertEq(token.totalSupply(), 1000 ether);

             // Call unstake function as the user
        vm.startPrank(user);
        protocol.unstake("WBitcoin", "0x123", 100, "dummyBtcTxHex");
        vm.stopPrank();

        // Verify balances after unstaking
        uint256 userFinalBalance = token.balanceOf(user);
        uint256 protocolBalance = token.balanceOf(address(protocol));
        uint256 protocolAllowance = token.allowance(user, address(protocol));
        uint256 totalSupply = token.totalSupply();

        console2.log("user balance after unstake: ", userFinalBalance);
        console2.log("protocol balance after unstake: ", protocolBalance);
        console2.log("protocol allowance after unstake: ", protocolAllowance);
        console2.log("total supply after unstake: ", totalSupply);

        assertEq(userFinalBalance, 900 ether);
        assertEq(protocolBalance, 0); // All tokens burnt
        assertEq(protocolAllowance, 0);
        assertEq(totalSupply, 900 ether);
    }

    // function testUnstake() public {
    //     // Initial checks
    //     uint256 userInitialBalance = token.balanceOf(user);
    //     assertEq(userInitialBalance, 1000 ether);

    //     // Call unstake function as the user
    //     vm.startPrank(user);
    //     protocol.unstake("WBitcoin", "0x123", 100, "dummyBtcTxHex");
    //     vm.stopPrank();

    //     // Verify balances after unstaking
    //     uint256 userFinalBalance = token.balanceOf(user);
    //     uint256 protocolBalance = token.balanceOf(address(protocol));

    //     // The user's balance should decrease by 100 tokens and protocol should hold them before burning
    //     assertEq(userFinalBalance, 900 ether);
    //     assertEq(protocolBalance, 0); // All tokens burnt

    //     // Check that the protocol emitted the correct events
    //     vm.expectEmit(true, true, false, true);
    // }

    // function testFail_UnstakeWithoutApproval() public {
    //     // Revoke approval and attempt unstake
    //     vm.startPrank(user);
    //     token.approve(address(protocol), 0); // Remove approval
    //     protocol.unstake("btc", "0x123", 100, "cYm9tZUJ0Y1R4SGV4");
    //     vm.stopPrank();
    // }

    // function testExecute() public {
    //     // Simulate execution from another chain
    //     bytes memory payload = abi.encode(user, 100 ether);

    //     vm.prank(address(mockGateway)); // Simulate Axelar gateway call
    //     protocol.execute("WBitcoin", "0x123", payload);

    //     // Verify that the user received minted tokens
    //     uint256 userBalance = token.balanceOf(user);
    //     assertEq(userBalance, 1100 ether); // User balance after minting
    // }
}
