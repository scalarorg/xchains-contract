const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Cauldron contract", function () {
  async function deployFixture() {
    // Get the ContractFactory and Signers here.
    const [deployer, user1, addr2] = await ethers.getSigners();
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
    const fixedPrice = 3500.18 * 1e8;
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
    console.log("Borrow opening fee: ", await cauldronV4.BORROW_OPENING_FEE());
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
      "Borrow opening fee after: ",
      await wETHMarketContract.BORROW_OPENING_FEE()
    );
    console.log("Colatteral", await wETHMarketContract.collateral());
    return {
      token,
      weth,
      degenBox,
      cauldronV4,
      deployer,
      user1,
      addr2,
      oracle,
      oracleProxy,
      success,
      price,
      wETHMarketContract,
      deployer,
      cauldronV4,
    };
  }
  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    it("Dependecied deploy success", async function () {
      const {
        token,
        weth,
        degenBox,
        cauldronV4,
        deployer,
        user1,
        addr2,
        oracle,
        oracleProxy,
        success,
        price,
        wETHMarketContract,
      } = await loadFixture(deployFixture);
      expect(await token.owner()).to.equal(deployer.address);
      console.log("Deployer address: ", deployer.address);
      console.log("user1 address: ", user1.address);
      console.log("Addr2 address: ", addr2.address);
      console.log("Token address: ", token.address);
      console.log("Total supply: ", await token.totalSupply());
      console.log("WETH address: ", weth.address);
      console.log("DegenBox address: ", degenBox.address);
      console.log("CauldronV4 address: ", cauldronV4.address);
      console.log("Oracle address: ", oracle.address);
      console.log("OracleProxy address: ", oracleProxy.address);

      if (success) {
        console.log("Price fetched:", price.toString());
      } else {
        console.log("Failed to fetch price");
      }
    });

    it("Should initialize a new Cauldron for WETH", async function () {
      const { wETHMarketContract } = await loadFixture(deployFixture);
      expect(wETHMarketContract.address).to.not.equal(
        ethers.constants.AddressZero
      );
    });

    it("Test Cauldron functionality", async function () {
      const { wETHMarketContract, degenBox } = await loadFixture(deployFixture);
      expect(await wETHMarketContract.bentoBox()).to.equal(degenBox.address);
      expect(
        await wETHMarketContract.blacklistedCallees(wETHMarketContract.address)
      ).to.equal(true);
    });

    it("Should deposit STK to Market", async function () {
      const { wETHMarketContract, token, user1, degenBox, deployer } =
        await loadFixture(deployFixture);
      const maxUint256 = ethers.constants.MaxUint256;

      // Approve degenBox to spend STK tokens
      const tx = await token.approve(degenBox.address, maxUint256);
      await tx.wait();

      // Check the allowance
      const allowance = await token.allowance(
        deployer.address,
        degenBox.address
      );
      expect(allowance).to.equal(maxUint256);
      expect(
        await degenBox.balanceOf(token.address, wETHMarketContract.address)
      ).to.equal(0);

      // Deposit STK tokens to the market
      // amount = 100 token
      const amount = ethers.utils.parseUnits("100", 18);
      const tx2 = await degenBox.deposit(
        token.address,
        deployer.address,
        wETHMarketContract.address,
        amount,
        0
      );
      await tx2.wait();
      expect(
        await degenBox.balanceOf(token.address, wETHMarketContract.address)
      ).to.equal(amount);
    });

    it("Should deposit WETH to Market", async function () {
      const { wETHMarketContract, weth, user1, degenBox, deployer } =
        await loadFixture(deployFixture);
      const maxUint256 = ethers.constants.MaxUint256;

      // Approve degenBox to spend WETH tokens
      const txWETH = await weth.approve(degenBox.address, maxUint256);
      await txWETH.wait();

      // mint WETH
      expect(await weth.balanceOf(deployer.address)).to.equal(0);
      const ethAmount = ethers.utils.parseEther("100.0");
      const tx1 = {
        to: weth.address,
        value: ethAmount,
      };
      await deployer.sendTransaction(tx1);
      expect(await weth.balanceOf(deployer.address)).to.equal(ethAmount);

      // Check the allowance
      const allowance = await weth.allowance(
        deployer.address,
        degenBox.address
      );
      expect(allowance).to.equal(maxUint256);

      expect(
        await degenBox.balanceOf(weth.address, wETHMarketContract.address)
      ).to.equal(0);

      const etherAddress = ethers.constants.AddressZero;
      // Deposit WETH tokens to the market
      // amount = 100 token
      const amount = ethers.utils.parseEther("1.0");
      const tx2 = await degenBox.deposit(
        etherAddress,
        deployer.address,
        wETHMarketContract.address,
        amount,
        0,
        {
          value: amount,
        }
      );
      await tx2.wait();

      expect(
        await degenBox.balanceOf(weth.address, wETHMarketContract.address)
      ).to.equal(amount);
    });

    it("Should deposit WETH to Market and borrow STK", async function () {
      const {
        wETHMarketContract,
        weth,
        token,
        user1,
        degenBox,
        deployer,
        cauldronV4,
        oracleProxy,
      } = await loadFixture(deployFixture);
      const maxUint256 = ethers.constants.MaxUint256;

      // Approve degenBox to spend STK tokens
      const txSTK = await token.approve(degenBox.address, maxUint256);
      await txSTK.wait();

      // Approve degenBox to spend WETH tokens
      const tx = await weth.approve(degenBox.address, maxUint256);
      await tx.wait();

      // mint WETH to deployer
      expect(await weth.balanceOf(deployer.address)).to.equal(0);
      const ethAmount = ethers.utils.parseEther("100.0");
      const tx1 = {
        to: weth.address,
        value: ethAmount,
      };
      await deployer.sendTransaction(tx1);
      expect(await weth.balanceOf(deployer.address)).to.equal(ethAmount);

      // Check the allowance
      const allowance = await weth.allowance(
        deployer.address,
        degenBox.address
      );
      expect(allowance).to.equal(maxUint256);

      expect(
        await degenBox.balanceOf(weth.address, wETHMarketContract.address)
      ).to.equal(0);
      console.log(
        "WETH balance: ",
        await degenBox.balanceOf(weth.address, deployer.address)
      );
      const etherAddress = ethers.constants.AddressZero;
      // Deposit WETH tokens to the market
      // amount = 100 token
      const amount = ethers.utils.parseEther("100");
      const tx2 = await degenBox.deposit(
        etherAddress,
        deployer.address,
        wETHMarketContract.address,
        amount,
        0,
        {
          value: amount,
        }
      );
      await tx2.wait();

      expect(
        await degenBox.balanceOf(weth.address, wETHMarketContract.address)
      ).to.equal(amount);

      // Deposit STK tokens to the market
      // amount = 100000 token
      console.log(
        "STK balance of master box: ",
        await degenBox.balanceOf(token.address, cauldronV4.address)
      );
      const amountSTK = ethers.utils.parseUnits("10000", 18);
      const txSTKDeposit = await degenBox.deposit(
        token.address,
        deployer.address,
        wETHMarketContract.address,
        amountSTK,
        0
      );
      await txSTKDeposit.wait();
      expect(
        await degenBox.balanceOf(token.address, wETHMarketContract.address)
      ).to.equal(amountSTK);
      // Set masterContract approval to user1

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

      // Check the allowance
      const allowance2 = await token.allowance(
        deployer.address,
        degenBox.address
      );
      expect(allowance2).to.equal(maxUint256);

      expect(await degenBox.balanceOf(token.address, user1.address)).to.equal(
        0
      );

      // mint wETH to user1
      const oneETH = ethers.utils.parseEther("1");
      const txMint = {
        to: weth.address,
        value: oneETH,
      };
      await user1.sendTransaction(txMint);
      console.log("User1 weth balance: ", await weth.balanceOf(user1.address));

      // User deposit ETH to the market
      // amount = 100 token
      const depositAmount = ethers.utils.parseEther("1");
      const tx4 = await degenBox
        .connect(user1)
        .deposit(etherAddress, user1.address, user1.address, depositAmount, 0, {
          value: depositAmount,
        });
      console.log(
        "User1 weth balance after deposit: ",
        await weth.balanceOf(user1.address)
      );
      // deposit function return (uint256 amountOut, uint256 shareOut), get the shareOut
      const receipt = await tx4.wait();
      const event = receipt.events.find(
        (event) => event.event === "LogDeposit"
      );
      const shareAmount = event.args[3];
      expect(shareAmount).to.not.equal(0);

      // Add collateral for user1
      expect(
        await wETHMarketContract.userCollateralShare(user1.address)
      ).to.equal(0);
      console.log("Share amount: ", shareAmount);
      const tx5 = await wETHMarketContract
        .connect(user1)
        .addCollateral(user1.address, false, shareAmount);
      await tx5.wait();
      expect(
        await wETHMarketContract.userCollateralShare(user1.address)
      ).to.not.equal(0);

      // Calculate the borrow amount

      const oracleData = await wETHMarketContract.oracleData();
      const [_, oracleRate] = await oracleProxy.callStatic.get(oracleData);
      const amountOut = (depositAmount * oracleRate) / 1e18;
      console.log("depositAmount: ", depositAmount);
      console.log("oracleRate: ", oracleRate);
      console.log("Amount out: ", amountOut);
      const borrowAmount = (amountOut * 50) / 100;
      console.log("Borrow amount: ", borrowAmount);
      const txBorrow = await wETHMarketContract
        .connect(user1)
        .borrow(user1.address, borrowAmount);
      const receiptBorrow = await txBorrow.wait();

      const eventBorrow = receiptBorrow.events.find(
        (event) => event.event === "LogBorrow"
      );
      const borrowTotalAmount = eventBorrow.args[2];
      console.log("Borrow total amount: ", borrowTotalAmount);

      // Check the borrow amount
      const txCheckBorrow = await degenBox.toAmount(
        token.address,
        borrowTotalAmount,
        true
      );
      console.log("Check amount: ", txCheckBorrow);
      console.log(
        "User collateral share: ",
        await wETHMarketContract.userCollateralShare(user1.address)
      );
      console.log(
        "User borrow part:",
        await wETHMarketContract.userBorrowPart(user1.address)
      );
      console.log(
        "User STK balance: ",
        await degenBox.balanceOf(token.address, user1.address)
      );
      console.log("Total of box:", await degenBox.totals(token.address));
    });
  });
});
