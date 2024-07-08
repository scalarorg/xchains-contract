// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import {ERC20} from "../lib/BoringSolidity/contracts/ERC20.sol";
import {BoringOwnable} from "../lib/BoringSolidity/contracts/BoringOwnable.sol";
import {BoringMath} from "../lib/BoringSolidity/contracts/libraries/BoringMath.sol";    

// contract ScalarToken is ERC20WithSupply, Ownable {
//     constructor(address initialOwner)
//         ERC20("ScalarToken", "STK")
//         Ownable(initialOwner)
//     {
//         _mint(msg.sender, 100000 * 10 ** 18);
//     }

//     function mint(address to, uint256 amount) public onlyOwner {
//         _mint(to, amount);
//     }
// }
/// @title Cauldron
/// @dev This contract allows contract calls to any contract (except BentoBox)
/// from arbitrary callers thus, don't trust calls from this contract in any circumstances.
contract ScalarToken is ERC20, BoringOwnable {
    using BoringMath for uint256;
    // ERC20 'variables'
    string public constant symbol = "STK";
    string public constant name = "Scalar Token";
    uint8 public constant decimals = 18;
    uint256 public override totalSupply;

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "MIM: no mint to zero address");
        totalSupply = totalSupply + amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        require(amount <= balanceOf[msg.sender], "MIM: not enough");

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}