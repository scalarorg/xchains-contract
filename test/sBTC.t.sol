// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0 <0.9.0;

import { sBTC } from "contracts/sBTC.sol";
import { Test } from "forge-std/src/Test.sol";
import { console2 } from "forge-std/src/console2.sol";

contract sBTCTest is Test {
    sBTC public token;
    address public owner;
    address public user;
    address public spender;

    function setUp() public {
        token = new sBTC();
        owner = token.owner();
        user = address(1);
        spender = address(2);
    }

    function testMint() public {
        token.mint(owner, 100);
        assertEq(token.balanceOf(owner), 100);
    }

    function testBurn() public {
        token.mint(owner, 100);
        token.burn(50);
        assertEq(token.balanceOf(owner), 50);
    }

    function testApprove() public {
        token.mint(owner, 1000);
        token.approve(spender, 100);
        assertEq(token.allowance(owner, spender), 100);
    }

    function testOnlyOwnerMint() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        token.mint(user, 100);
    }

    function testOnlyOwnerBurn() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        token.burn(100);
    }
}
