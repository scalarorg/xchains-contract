const { ethers } = require("hardhat");
const path = require("path");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Define the data to be encoded
  const newOperators = [
    "0xFCC2E13FFAB2840EBD289A4A89F7DFF28E9A5373", // replace with actual addresses
    "0xF36D6C9CFB4D22E05B23858C71A2069A41AC2348",
    "0xF8017D7D78D24A1D1DC1D378A33DFFF14CA4A53A",
    "0x74D34C796F095E1188DF01860DA1A8F6815C919E",
    // more addresses as needed
  ];
  const newWeights = [
    ethers.BigNumber.from("900000000000000"), // replace with actual weights
    ethers.BigNumber.from("500000000000000"),
    ethers.BigNumber.from("500000000000000"),
    ethers.BigNumber.from("500000000000000"),
    // more weights as needed
  ];

  // Combine the operators and weights into an array of objects
  let combinedArray = newOperators.map((address, index) => {
    return {
      address: address,
      weight: newWeights[index],
    };
  });

  // Sort the combined array by address
  combinedArray.sort((a, b) => {
    if (a.address.toLowerCase() < b.address.toLowerCase()) return -1;
    if (a.address.toLowerCase() > b.address.toLowerCase()) return 1;
    return 0;
  });

  // Separate the sorted addresses and weights back into individual arrays
  const sortedOperators = combinedArray.map((item) => item.address);
  const sortedWeights = combinedArray.map((item) => item.weight);

  // Define the new threshold
  const newThreshold = ethers.BigNumber.from("1300000000000000"); // replace with actual threshold

  // Define the types of the data
  const types = ["address[]", "uint256[]", "uint256"];

  // Encode the data
  const encodedParams = ethers.utils.defaultAbiCoder.encode(types, [
    sortedOperators,
    sortedWeights,
    newThreshold,
  ]);

  console.log(encodedParams);

  // Deploy the AxelarAuthWeighted contract

  const AxelarAuthWeighted = await ethers.getContractFactory(
    "AxelarAuthWeighted"
  );
  const axelarAuthWeighted = await AxelarAuthWeighted.deploy([encodedParams]);

  await axelarAuthWeighted.deployed();
  console.log("AxelarAuthWeighted deployed to:", axelarAuthWeighted.address);
  const currentEpoch = await axelarAuthWeighted.currentEpoch();
  console.log("Current epoch: ", currentEpoch);
  console.log(
    "Hash for epoch",
    await axelarAuthWeighted.hashForEpoch(currentEpoch)
  );

  saveABI([
    {
      name: "AxelarAuthWeighted",
      address: axelarAuthWeighted.address,
    },
  ]);
}
function saveABI(contracts) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "abis", "auth");

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
