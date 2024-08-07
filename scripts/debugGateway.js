const path = require("path");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the AxelarGateway contract

  const axlContractName = "AxelarGateway";
  const axlContractArtifact = require(`../artifacts/contracts/axelar/${axlContractName}.sol/${axlContractName}.json`);
  const axlContractABI = axlContractArtifact.abi;
  const axlContract = new ethers.Contract(
    "0xBA3e5B0EebF14f895114EE6b0f12b6a49295515e", //TODO
    axlContractABI,
    deployer
  );
  axlContract.on("*", (event) => {
    console.log("Event:", event);
  });
  setTimeout(() => {
    contract.removeAllListeners();
    console.log("All listeners removed");
  }, 300000);
  //   saveABI([
  //     {
  //       name: "AxelarGateway",
  //       address: axelarGateway.address,
  //     },
  //   ]);
}
function saveABI(contracts) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "abis", "gateway");

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
  .then(() => {
    // Prevent the script from exiting
    process.stdin.resume();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
