// SPDX-License-Identifier: MIT

// Magic Internet Money

// ███╗   ███╗██╗███╗   ███╗
// ████╗ ████║██║████╗ ████║
// ██╔████╔██║██║██╔████╔██║
// ██║╚██╔╝██║██║██║╚██╔╝██║
// ██║ ╚═╝ ██║██║██║ ╚═╝ ██║
// ╚═╝     ╚═╝╚═╝╚═╝     ╚═╝

// BoringCrypto, 0xMerlin

pragma solidity ^0.8.0;
import {IERC20,IBentoBoxV1} from "./interfaces/IBentoBoxV1.sol";
import {ERC20} from "../lib/BoringSolidity/contracts/ERC20.sol";
import {BoringOwnable} from "../lib/BoringSolidity/contracts/BoringOwnable.sol";
import {BoringMath} from "../lib/BoringSolidity/contracts/libraries/BoringMath.sol"; 
/// @title Cauldron
/// @dev This contract allows contract calls to any contract (except BentoBox)
/// from arbitrary callers thus, don't trust calls from this contract in any circumstances.
contract ScalarCoin is ERC20, BoringOwnable {
    using BoringMath for uint256;
    // ERC20 'variables'
    string public constant symbol = "SCL";
    string public constant name = "Scalar Coin";
    uint8 public constant decimals = 18;
    uint256 public override totalSupply;

    // struct Minting {
    //     uint128 time;
    //     uint128 amount;
    // }

    // Minting public lastMint;
    // uint256 private constant MINTING_PERIOD = 24 hours;
    // uint256 private constant MINTING_INCREASE = 15000;
    // uint256 private constant MINTING_PRECISION = 1e5;

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "SCL: no mint to zero address");

        // // Limits the amount minted per period to a convergence function, with the period duration restarting on every mint
        // uint256 totalMintedAmount = uint256(lastMint.time < block.timestamp - MINTING_PERIOD ? 0 : lastMint.amount).add(amount);
        // require(totalSupply == 0 || totalSupply.mul(MINTING_INCREASE) / MINTING_PRECISION >= totalMintedAmount);

        // lastMint.time = block.timestamp.to128();
        // lastMint.amount = totalMintedAmount.to128();

        totalSupply = totalSupply + amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function mintToBentoBox(address clone, uint256 amount, IBentoBoxV1 bentoBox) public onlyOwner {
        mint(address(bentoBox), amount);
        bentoBox.deposit(IERC20(address(this)), address(bentoBox), clone, amount, 0);
    }

    function burn(uint256 amount) public {
        require(amount <= balanceOf[msg.sender], "SCL: not enough");

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}