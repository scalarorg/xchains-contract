// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICustomToken } from "./interface/ICustomToken.sol";
/**
 * @title sBTC (Scalar BTC)
 * @notice A custom ERC20 token with minting and burning functionalities restricted to the owner.
 */

contract sBTC is ERC20, ICustomToken {
    address public owner;

    /**
     * @notice Sets the initial owner and token details (Scalar BTC).
     */
    constructor() ERC20("Scalar BTC", "sBTC") {
        owner = msg.sender;
    }

    /**
     * @notice Modifier to restrict access to only the contract owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    /**
     * @notice Mint tokens to the specified address. Only callable by the owner.
     * @param to The address to mint tokens to.
     * @param amount The number of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        _mint(to, amount);
    }

    /**
     * @notice Burn a specific amount of tokens from the owner's account. Only callable by the owner.
     * @param amount The amount of tokens to burn.
     */
    function burn(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= balanceOf(msg.sender), "Insufficient balance");
        _burn(msg.sender, amount);
    }
}
