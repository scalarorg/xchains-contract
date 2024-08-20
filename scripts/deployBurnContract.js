const path = require("path");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the MintContract
  const gatewayAddress = "0x1811AE0B97479b77258CF8aAda7768aB74e21aE9"; // TODO: Update this address
  const gasServiceAddress = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
  const sbtcAddress = "0xa32e5903815476Aff6E784F5644b1E0e3eE2081B";

  const BurnContract = await ethers.getContractFactory("BurnContract");
  const burnContract = await BurnContract.deploy(
    gatewayAddress,
    gasServiceAddress,
    sbtcAddress
  );
  await burnContract.deployed();

  console.log("burnContract address:", burnContract.address);
  console.log("sbtc address:", await burnContract.sbtc());

  saveABI([
    {
      name: "BurnContract",
      address: burnContract.address,
    },
  ]);
}
function saveABI(contracts) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "abis", "burn-contract");

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