// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "boring-solidity/contracts/BoringOwnable.sol";

import { console2 } from "forge-std/src/console2.sol";

pragma solidity ^0.8.0;

contract sBTC is ERC20, BoringOwnable {
    constructor() ERC20("Scalar BTC", "sBTC") {
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        _mint(to, amount);
    }

    function burn(uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= balanceOf(msg.sender), "Insufficient balance");
        _burn(msg.sender, amount);
    }

    function approve(address spender, uint256 value) public override returns (bool) {
        require(balanceOf(msg.sender) >= value, "Not enough balance");
        return super.approve(spender, value);
    }
}
