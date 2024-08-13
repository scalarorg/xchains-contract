const path = require("path");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the AxelarGateway contract
  const authModule = "0x410C9dF9802E084CAEcA48494f40Dd200AF5f962"; // TODO: update AxelarAuthWeighted address
  const tokenDeployer = "0xD2aDceFd0496449E3FDE873A2332B18A0F0FCADf";

  const AxelarGateway = await ethers.getContractFactory("AxelarGateway");
  const axelarGateway = await AxelarGateway.deploy(authModule, tokenDeployer);
  await axelarGateway.deployed();
  console.log("AxelarGateway deployed to:", axelarGateway.address);
  console.log(await axelarGateway.contractId());

  saveABI([
    {
      name: "AxelarGateway",
      address: axelarGateway.address,
    },
  ]);
}
function saveABI(contracts) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "abis", "gateway-alt");

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
