// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");
const { ethers } = require("hardhat");
// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// `describe` is a Mocha function that allows you to organize your tests.
// Having your tests organized makes debugging them easier. All Mocha
// functions are available in the global scope.
//
// `describe` receives the name of a section of your test suite, and a
// callback. The callback must define the tests of that section. This callback
// can't be an async function.
describe("Oracle contract", function () {
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployFixture() {
    // Get the ContractFactory and Signers here.
    const [deployer, addr1, addr2] = await ethers.getSigners();
    console.log(
      "Deploying the contracts with the account:",
      await deployer.getAddress()
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy oracle
    const Oracle = await ethers.getContractFactory("FixedPriceOracle");
    const decimals = 8;
    const fixedPrice = 339854000000;
    const desc = "ETH/USD";
    const oracle = await Oracle.deploy(desc, fixedPrice, decimals);
    await oracle.deployed();
    // Proxy oracle
    const OracleProxy = await ethers.getContractFactory("ProxyOracle");
    const oracleProxy = await OracleProxy.deploy();
    await oracleProxy.deployed();
    // Set oracle
    console.log(
      "Oracle Implementation address before set:",
      await oracleProxy.oracleImplementation()
    );
    await oracleProxy.changeOracleImplementation(oracle.address);
    console.log(
      "Oracle Implementation address:",
      await oracleProxy.oracleImplementation()
    );
    const data = "0x";
    // Fetch the price using the ProxyOracle
    const [success, price] = await oracleProxy.callStatic.get(data);
    // Fixtures can return anything you consider useful for your tests
    return { oracle, oracleProxy, success, price };
  }

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.
    //
    // If the callback function is async, Mocha will `await` it.
    it("Deploy success", async function () {
      // We use loadFixture to setup our environment, and then assert that
      // things went well
      const { oracle, oracleProxy, success, price } = await loadFixture(
        deployFixture
      );
      console.log("Oracle address: ", oracle.address);
      console.log("OracleProxy address: ", oracleProxy.address);

      if (success) {
        console.log("Price fetched:", price.toString());
      } else {
        console.log("Failed to fetch price");
      }
    });
  });
});
