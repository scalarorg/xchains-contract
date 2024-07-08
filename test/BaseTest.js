const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Base test", function () {
  async function deployFixture() {
    const [deployer, user1, user2] = await ethers.getSigners();
    console.log(
      "Deploying the contracts with the account:",
      await deployer.getAddress()
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy the ScalarToken contract
    const Token = await ethers.getContractFactory("ScalarToken");
    const token = await Token.deploy();
    await token.deployed();
    // Deploy the WETH contract
    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.deployed();
    // Deploy the DegenBox contract
    const DegenBox = await ethers.getContractFactory("DegenBox");
    const degenBox = await DegenBox.deploy(weth.address);
    await degenBox.deployed();

    // Deploy the CauldronV4 contract
    const CauldronV4 = await ethers.getContractFactory("CauldronV4");
    const cauldronV4 = await CauldronV4.deploy(degenBox.address, token.address);
    await cauldronV4.deployed();
    await degenBox.whitelistMasterContract(cauldronV4.address, true);

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

    // Clone CauldronV4
    const CauldronFactory = await ethers.getContractFactory("CauldronFactory");
    const cauldronFactory = await CauldronFactory.deploy(cauldronV4.address);
    await cauldronFactory.deployed();

    // Setting variables for wETH market
    const collateralAddress = weth.address; // Address of the collateral token
    const oracleAddress = oracleProxy.address; // Address of the oracle
    const oracleData = "0x"; // Data required by the oracle
    const INTEREST_PER_SECOND = (ethers.BigNumber.from(600) * 316880878) / 100; // Example value
    const LIQUIDATION_MULTIPLIER = ethers.BigNumber.from(600) * 1e1 + 1e5; // Example value
    const COLLATERIZATION_RATE = ethers.BigNumber.from(8000) * 1e1; // Example value
    const BORROW_OPENING_FEE = ethers.BigNumber.from(50) * 1e1; // Example value

    // ABI encode the values
    const initData = ethers.utils.defaultAbiCoder.encode(
      [
        "address",
        "address",
        "bytes",
        "uint64",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        collateralAddress,
        oracleAddress,
        oracleData,
        INTEREST_PER_SECOND,
        LIQUIDATION_MULTIPLIER,
        COLLATERIZATION_RATE,
        BORROW_OPENING_FEE,
      ]
    );

    // Clone CauldronV4 for WETH
    const tx = await cauldronFactory.createCauldron(initData);
    const receipt = await tx.wait();
    const event = receipt.events.find(
      (event) => event.event === "CauldronCloned"
    );
    const wETHMarketAddress = event.args[0];
    console.log("Clone address:", wETHMarketAddress);

    const contractName = "CauldronV4";
    const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    const contractABI = contractArtifact.abi;
    const wETHMarketContract = new ethers.Contract(
      wETHMarketAddress,
      contractABI,
      deployer
    );

    console.log(
      "Master contract whitelisted",
      await degenBox.whitelistedMasterContracts(cauldronV4.address)
    );
    const maxUint256 = ethers.constants.MaxUint256;

    // Approve degenBox to spend STK tokens
    const txApproveSTK = await token.approve(degenBox.address, maxUint256);
    await txApproveSTK.wait();

    // Approve degenBox to spend WETH tokens
    const txApproveWETH = await weth.approve(degenBox.address, maxUint256);
    await txApproveWETH.wait();

    // mint WETH to deployer
    const ethAmount = ethers.utils.parseEther("100.0");
    const tx1 = {
      to: weth.address,
      value: ethAmount,
    };
    await deployer.sendTransaction(tx1);

    // Deposit STK tokens to the market
    // amount = 100000 token
    const txMint = await token.mint(
      deployer.address,
      ethers.utils.parseUnits("999999", 18)
    );
    await txMint.wait();
    const amountSTK = ethers.utils.parseUnits("100000", 18);
    const txSTKDeposit = await degenBox.deposit(
      token.address,
      deployer.address,
      wETHMarketContract.address,
      amountSTK,
      0
    );
    await txSTKDeposit.wait();
    return {
      deployer,
      user1,
      user2,
      token,
      weth,
      degenBox,
      cauldronV4,
      oracle,
      oracleProxy,
      wETHMarketContract,
    };
  }
  describe("Deposit and borrow", function () {
    it("Should deposit, borrow and repay", async function () {
      const {
        deployer,
        user1,
        user2,
        token,
        weth,
        degenBox,
        cauldronV4,
        oracle,
        oracleProxy,
        wETHMarketContract,
      } = await loadFixture(deployFixture);
      // Set master contract approval
      const txApproval = await degenBox
        .connect(user1)
        .setMasterContractApproval(
          user1.address,
          cauldronV4.address,
          true,
          0,
          ethers.constants.HashZero,
          ethers.constants.HashZero
        );
      await txApproval.wait();
      expect(
        await degenBox.masterContractApproved(cauldronV4.address, user1.address)
      ).to.equal(true);

      // User deposit
      const etherAddress = ethers.constants.AddressZero;
      const depositAmount = ethers.utils.parseEther("1.0");
      const txWETHDeposit = await degenBox
        .connect(user1)
        .deposit(etherAddress, user1.address, user1.address, depositAmount, 0, {
          value: depositAmount,
        });
      const receipt4 = await txWETHDeposit.wait();
      const event2 = receipt4.events.find(
        (event) => event.event === "LogDeposit"
      );
      const shareAmount = event2.args[3];
      expect(shareAmount).to.equal(depositAmount);
      // Add collateral
      const txAddCollateral = await wETHMarketContract
        .connect(user1)
        .addCollateral(user1.address, false, shareAmount);
      await txAddCollateral.wait();
      // Calculate borrow amount
      const oracleDataTemp = await wETHMarketContract.oracleData();
      const [_, oracleRate] = await oracleProxy.callStatic.get(oracleDataTemp);
      const amountOut = (depositAmount * oracleRate) / 1e18;
      // const amountOut = (1e8 * depositAmount) / oracleRate;
      const borrowAmount = Math.floor((amountOut * 50) / 100);
      // Borrow
      const txBorrow = await wETHMarketContract
        .connect(user1)
        .borrow(user1.address, borrowAmount);
      await txBorrow.wait();

      // Withdraw
      const txWithdraw = await degenBox
        .connect(user1)
        .withdraw(token.address, user1.address, user1.address, borrowAmount, 0);
      const receiptWithdraw = await txWithdraw.wait();
      const eventWithdraw = receiptWithdraw.events.find(
        (event) => event.event === "LogWithdraw"
      );
      const withdrawAmount = eventWithdraw.args[3];
      console.log("withdrawAmount", withdrawAmount);

      // *********************************************************************
      console.log("User 1 balance:", await user1.getBalance());
      // Deposit stk
      const depositAmountSTK = withdrawAmount;
      console.log("depositAmountSTK", depositAmountSTK);
      console.log("User 1 balance:", await token.balanceOf(user1.address));

      const txSTKDeposit = await degenBox
        .connect(user1)
        .deposit(
          token.address,
          user1.address,
          user1.address,
          depositAmountSTK,
          0
        );
      const receipt5 = await txSTKDeposit.wait();
      const event3 = receipt5.events.find(
        (event) => event.event === "LogDeposit"
      );
      const collateralAmount = ethers.utils.parseEther("1.0");
      // Remove collateral
      const txRemoveCollateral = await wETHMarketContract
        .connect(user1)
        .removeCollateral(user1.address, collateralAmount);
      await txRemoveCollateral.wait();
      // Repay
      const txRepay = await wETHMarketContract
        .connect(user1)
        .repay(user1.address, false, depositAmountSTK);
      await txRepay.wait();
      // Withdraw ETH
      const txWithdrawETH = await degenBox
        .connect(user1)
        .withdraw(
          etherAddress,
          user1.address,
          user1.address,
          collateralAmount,
          0
        );
      const receiptWithdraw1 = await txWithdrawETH.wait();
      const eventWithdraw1 = receiptWithdraw1.events.find(
        (event) => event.event === "LogWithdraw"
      );
      const withdrawAmount1 = eventWithdraw1.args[3];
      console.log("withdrawAmount1", withdrawAmount1);
    });
  });
});
