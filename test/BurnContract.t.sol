// pragma solidity ^0.8.0;

// import { Test } from "forge-std/src/Test.sol";
// import "contracts/BurnContract.sol";
// import "contracts/sBTC.sol";

// contract BurnContractTest is Test {
//     BurnContract public burnContract;
//     sBTC public sbtc;
//     address public owner;
//     address public user;

//     function setUp() public {
//         // Deploy the BurnContract and sBTC contracts
//         burnContract = new BurnContract();
//         sbtc = new sBTC();

//         // Set up the owner and user accounts
//         owner = msg.sender;
//         user = address(1);

//         // Mint some sBTC tokens to the user
//         sbtc.mint(user, 1000);
//     }

//     function testCallBurn() public {
//         // Set up the burn parameters
//         string memory destinationChain = "chain1";
//         string memory destinationAddress = "address1";
//         uint256 amount = 100;
//         string memory btcTxHex = "txhex1";

//         // Call the callBurn function
//         burnContract.callBurn(destinationChain, destinationAddress, amount, btcTxHex);

//         // Check that the sBTC tokens were burned
//         assert(sbtc.balanceOf(user), 900);

//         // Check that the Burned event was emitted
//         assert(burnContract.getBurnedEvents().length, 1);
//         assert(burnContract.getBurnedEvents()[0].user, user);
//         assert(burnContract.getBurnedEvents()[0].amount, amount);
//     }

//     function testCallBurnInsufficientBalance() public {
//         // Set up the burn parameters
//         string memory destinationChain = "chain1";
//         string memory destinationAddress = "address1";
//         uint256 amount = 1001;
//         string memory btcTxHex = "txhex1";

//         // Call the callBurn function
//         vm.expectRevert("BurnContract: insufficient balance");
//         burnContract.callBurn(destinationChain, destinationAddress, amount, btcTxHex);
//     }

//     function testCallBurnInvalidAmount() public {
//         // Set up the burn parameters
//         string memory destinationChain = "chain1";
//         string memory destinationAddress = "address1";
//         uint256 amount = 0;
//         string memory btcTxHex = "txhex1";

//         // Call the callBurn function
//         vm.expectRevert("BurnContract: amount must be greater than 0");
//         burnContract.callBurn(destinationChain, destinationAddress, amount, btcTxHex);
//     }
// }
