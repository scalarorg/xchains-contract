//const path = require("path");
async function main() {
  // This is just a convenience check

  const [deployer, user1, user2] = await ethers.getSigners();
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
    ["address", "address", "bytes", "uint64", "uint256", "uint256", "uint256"],
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

  const etherAddress = ethers.constants.AddressZero;

  // Deposit STK tokens to the market
  // amount = 100000 token
  const amountSTK = ethers.utils.parseUnits("10000", 18);
  const txSTKDeposit = await degenBox.deposit(
    token.address,
    deployer.address,
    wETHMarketContract.address,
    amountSTK,
    0
  );
  await txSTKDeposit.wait();

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

  // Set masterContract approval to user1
  await degenBox.whitelistMasterContract(cauldronV4.address, true);
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

  // User deposit ETH to the market
  // amount = 100 token

  // mint wETH to user1
  const oneETH = ethers.utils.parseEther("10");
  const txMint = {
    to: weth.address,
    value: oneETH,
  };
  await user1.sendTransaction(txMint);

  const depositAmount = ethers.utils.parseEther("1");
  const tx4 = await degenBox
    .connect(user1)
    .deposit(etherAddress, user1.address, user1.address, depositAmount, 0, {
      value: depositAmount,
    });
  // deposit function return (uint256 amountOut, uint256 shareOut), get the shareOut
  const receipt4 = await tx4.wait();
  const event2 = receipt4.events.find((event) => event.event === "LogDeposit");
  const shareAmount = event2.args[3];
  console.log("Share amount: ", shareAmount);

  // Add collateral for user1
  const tx5 = await wETHMarketContract
    .connect(user1)
    .addCollateral(user1.address, false, shareAmount);
  await tx5.wait();

  // Calculate the borrow amount
  const oracleDataTemp = await wETHMarketContract.oracleData();
  const [_, oracleRate] = await oracleProxy.callStatic.get(oracleDataTemp);
  const amountOut = (depositAmount * oracleRate) / 1e18;
  const borrowAmount = (amountOut * 50) / 100;
  const txBorrow = await wETHMarketContract
    .connect(user1)
    .borrow(user1.address, borrowAmount);
  const receiptBorrow = await txBorrow.wait();

  const eventBorrow = receiptBorrow.events.find(
    (event) => event.event === "LogBorrow"
  );
  const borrowTotalAmount = eventBorrow.args[2];
  console.log("Borrow total amount: ", borrowTotalAmount);

  // Save the contract's artifacts and address in the frontend directory
  // saveFrontendFiles([
  //   { name: "ScalarToken", address: token.address },
  //   { name: "WETH", address: weth.address },
  //   { name: "DegenBox", address: degenBox.address },
  //   { name: "CauldronV4", address: cauldronV4.address },
  //   { name: "FixedPriceOracle", address: oracle.address },
  //   { name: "ProxyOracle", address: oracleProxy.address },
  //   { name: "CauldronFactory", address: cauldronFactory.address },
  // ]);
}

function saveFrontendFiles(contracts) {
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "contracts"
  );

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  let contractAddresses = {};

  contracts.forEach((contract) => {
    // Save each contract's address
    contractAddresses[contract.name] = contract.address;

    // Save each contract's artifact
    const ContractArtifact = artifacts.readArtifactSync(contract.name);
    fs.writeFileSync(
      path.join(contractsDir, `${contract.name}.json`),
      JSON.stringify(ContractArtifact, null, 2)
    );
  });

  // Save all contract addresses in a single file
  fs.writeFileSync(
    path.join(contractsDir, "contract-addresses.json"),
    JSON.stringify(contractAddresses, undefined, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
