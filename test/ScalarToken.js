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
describe("Token contract", function () {
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

    // Deploy the ScalarToken contract
    const Token = await ethers.getContractFactory("ScalarToken");
    const initialOwner = await deployer.getAddress();
    const token = await Token.deploy(initialOwner);
    await token.deployed();
    //console.log("ScalarToken address:", token.address);

    // Deploy the WETH contract
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.deployed();
    //console.log("WETH address:", weth.address);

    // Deploy the DegenBox contract
    const DegenBox = await ethers.getContractFactory("DegenBox");
    const degenBox = await DegenBox.deploy(weth.address);
    await degenBox.deployed();
    //console.log("DegenBox address:", degenBox.address);

    // Deploy the CauldronV4 contract
    const CauldronV4 = await ethers.getContractFactory("CauldronV4");
    const cauldronV4 = await CauldronV4.deploy(degenBox.address, token.address);
    await cauldronV4.deployed();

    //console.log("CauldronV4 address:", cauldronV4.address);
    // Fixtures can return anything you consider useful for your tests
    return { token, weth, degenBox, cauldronV4, deployer, addr1, addr2 };
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
      const { token, weth, degenBox, cauldronV4, deployer, addr1, addr2 } =
        await loadFixture(deployFixture);
      expect(await token.owner()).to.equal(deployer.address);
      console.log("Deployer address: ", deployer.address);
      console.log("Addr1 address: ", addr1.address);
      console.log("Addr2 address: ", addr2.address);
      console.log("Token address: ", token.address);
      console.log("Total supply: ", await token.totalSupply());
      console.log("WETH address: ", weth.address);
      console.log("DegenBox address: ", degenBox.address);
      console.log("CauldronV4 address: ", cauldronV4.address);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, deployer, addr1, addr2 } = await loadFixture(
        deployFixture
      );
      // Transfer 50 tokens from owner to addr1
      await expect(token.transfer(addr1.address, 50)).to.changeTokenBalances(
        token,
        [deployer, addr1],
        [-50, 50]
      );

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await expect(
        token.connect(addr1).transfer(addr2.address, 50)
      ).to.changeTokenBalances(token, [addr1, addr2], [-50, 50]);
    });

    // it("should emit Transfer events", async function () {
    //   const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
    //     deployFixture
    //   );

    //   // Transfer 50 tokens from owner to addr1
    //   await expect(hardhatToken.transfer(addr1.address, 50))
    //     .to.emit(hardhatToken, "Transfer")
    //     .withArgs(owner.address, addr1.address, 50);

    //   // Transfer 50 tokens from addr1 to addr2
    //   // We use .connect(signer) to send a transaction from another account
    //   await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
    //     .to.emit(hardhatToken, "Transfer")
    //     .withArgs(addr1.address, addr2.address, 50);
    // });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { token, deployer, addr1 } = await loadFixture(deployFixture);
      const initialOwnerBalance = await token.balanceOf(deployer.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        token.connect(addr1).transfer(deployer.address, 1)
      ).to.be.revertedWith("ERC20InsufficientBalance");

      // Owner balance shouldn't have changed.
      expect(await token.balanceOf(deployer.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Deposit", function () {
    it("Should deposit STK to DegenBox", async function () {
      const { token, degenBox, addr1 } = await loadFixture(deployFixture);
      await token.transfer(degenBox.address, 100);
      // degenBox should have 100 STK
      expect(await token.balanceOf(degenBox.address)).to.equal(100);
      // addr1 should have 0 STK
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });
  });
});
