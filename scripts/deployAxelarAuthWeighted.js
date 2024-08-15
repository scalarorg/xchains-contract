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
    "0x450Ef898237296Feb7A1F19ab41d4228fA55b8fd",
    "0x583990ACa884D8F20D1D252e3027a2B03344e195",
    "0xB002f8b7BC79E08E05FD0eB2A6449f3B4Da3E44B",
    "0xD905FdCb01E0BB98411933425498A6afb416D3f5",
  ];
  const newWeights = [
    ethers.BigNumber.from("10000"), // replace with actual weights
    ethers.BigNumber.from("40000"),
    ethers.BigNumber.from("30000"),
    ethers.BigNumber.from("20000"),
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
  const newThreshold = ethers.BigNumber.from("60000"); // replace with actual threshold

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
  const contractsDir = path.join(__dirname, "..", "abis", "auth-alt");

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
