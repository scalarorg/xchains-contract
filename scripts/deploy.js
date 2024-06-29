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
  const INTEREST_PER_SECOND = ethers.BigNumber.from(600); // Example value
  const LIQUIDATION_MULTIPLIER = ethers.BigNumber.from(600); // Example value
  const COLLATERIZATION_RATE = ethers.BigNumber.from(8000); // Example value
  const BORROW_OPENING_FEE = ethers.BigNumber.from(25); // Example value

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

  const maxUint256 = ethers.constants.MaxUint256;

  // Approve degenBox to spend WETH tokens
  const txApprove = await weth.approve(degenBox.address, maxUint256);
  await txApprove.wait();

  // mint WETH to deployer
  const ethAmount = ethers.utils.parseEther("100.0");
  const tx1 = {
    to: weth.address,
    value: ethAmount,
  };
  await deployer.sendTransaction(tx1);

  // Check the allowance
  const allowance = await weth.allowance(deployer.address, degenBox.address);

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

  // Approve degenBox to spend STK tokens
  const tx3 = await token.approve(degenBox.address, maxUint256);
  await tx3.wait();

  // Check the allowance
  const allowance2 = await token.allowance(deployer.address, degenBox.address);

  console.log(
    "Master contract of deployer: ",
    await degenBox.whitelistedMasterContracts(cauldronV4.address)
  );

  // User deposit ETH to the market
  // amount = 100 token
  const amount2 = ethers.utils.parseEther("1");
  const tx4 = await degenBox
    .connect(user1)
    .deposit(etherAddress, user1.address, user1.address, amount2, 0);
  // deposit function return (uint256 amountOut, uint256 shareOut), get the shareOut
  const receipt4 = await tx4.wait();
  // const event = receipt.events.find(
  //   (event) => event.event === "LogDeposit"
  // );
  // const shareAmount = event.args[3];
  console.log("Share amount: ", shareAmount);
  // We also save the contract's artifacts and address in the frontend directory
  //saveFrontendFiles(staking);
}

// function saveFrontendFiles(staking) {
//   const fs = require("fs");
//   const contractsDir = path.join(
//     __dirname,
//     "..",
//     "frontend",
//     "src",
//     "contracts"
//   );

//   if (!fs.existsSync(contractsDir)) {
//     fs.mkdirSync(contractsDir);
//   }

//   fs.writeFileSync(
//     path.join(contractsDir, "contract-address.json"),
//     JSON.stringify({ Staking: staking.address }, undefined, 2)
//   );

//   const StakingArtifact = artifacts.readArtifactSync("Staking");

//   fs.writeFileSync(
//     path.join(contractsDir, "Staking.json"),
//     JSON.stringify(StakingArtifact, null, 2)
//   );
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
