const path = require("path");
async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the AxelarGateway contract
  const authModule = "0x1a920b29ebd437074225caee44f78fc700b27a5d";
  const tokenDeployer = "0xD2aDceFd0496449E3FDE873A2332B18A0F0FCADf";
  const AxelarGateway = await ethers.getContractFactory("AxelarGateway");
  const axelarGateway = await AxelarGateway.deploy(authModule, tokenDeployer);
  await axelarGateway.deployed();
  console.log("AxelarGateway deployed to:", axelarGateway.address);
  console.log(await axelarGateway.contractId());
  //   saveFrontendFiles([
  //     {
  //       name: "MarketLens",
  //       address: marketLens.address,
  //     },
  //   ]);
}
function saveFrontendFiles(contracts) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "abis");

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
