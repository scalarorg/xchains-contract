// set ownership for mintContract
const path = require("path");
async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "sBTC";
  const contractArtifact = require(`../artifacts/contracts/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const sbtc = new ethers.Contract(
    "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B",
    contractABI,
    deployer
  );

  //   const SBTC = await ethers.getContractFactory("sBTC");
  //   const sbtc = await SBTC.deploy();
  //   await sbtc.deployed();

  console.log("sbtc address:", sbtc.address);
  console.log("sbtc total supply:", await sbtc.totalSupply());

  //   // Deploy the MintContract
  //   const gatewayAddress = "0x70b9E1B98fb9cDd0221778c1E4d72e7a386D9CCe";
  //   const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
  //   const MintContract = await ethers.getContractFactory("MintContract");
  //   const mintContract = await MintContract.deploy(
  //     gatewayAddress,
  //     gasServiceAddress,
  //     sbtc.address
  //   );
  //   await mintContract.deployed();

  const mintContractName = "MintContract";
  const mintContractArtifact = require(`../artifacts/contracts/${mintContractName}.sol/${mintContractName}.json`);
  const mintContractABI = mintContractArtifact.abi;
  const mintContract = new ethers.Contract(
    "0x3AE131F593C603c152f419f954C49f8A742bEC8c", // TODO: Update this address to old mintContract address
    mintContractABI,
    deployer
  );

  console.log("mintContract address:", mintContract.address);
  console.log("sbtc owner:", await sbtc.owner());
  const txTransferOwnership = await mintContract.transferMintOwnership(
    "0x768E8De8cf0c7747D41f75F83C914a19C5921Cf3" // TODO: Update this address to new mintContract address
  );
  await txTransferOwnership.wait();
  console.log("sbtc owner:", await sbtc.owner());
  //   const oneSBTC = ethers.utils.parseUnits("1", 18);
  //   const txMint = await mintContract.mintTest(deployer.address, oneSBTC);
  //   await txMint.wait();
  //   console.log("deployer sbtc balance:", await sbtc.balanceOf(deployer.address));
  //   console.log(
  //     "mintContract sbtc balance:",
  //     await sbtc.balanceOf(mintContract.address)
  //   );
  //   const txTransferOwnershipAgain = await mintContract.transferMintOwnership(
  //     deployer.address
  //   );
  //   await txTransferOwnershipAgain.wait();
  //   console.log("sbtc owner:", await sbtc.owner());

  //   saveFrontendFiles([
  //     {
  //       name: "mintContract",
  //       address: callContract.address,
  //     },
  //   ]);
}
function saveFrontendFiles(contracts) {
  const fs = require("fs");
  const contractsDir = path.join(
    __dirname,
    "..",
    "frontend",
    "src",
    "abis",
    "call"
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
