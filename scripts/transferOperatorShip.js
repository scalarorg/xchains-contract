const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Signer account:", await deployer.getAddress());
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "AxelarAuthWeighted";
  const contractArtifact = require(`../artifacts/contracts/axelar/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const axelarAuthWeightedContract = new ethers.Contract(
    "0x71b7B290B14D7A8EB8071e35e3457b192b4a7fB6", // TODO
    contractABI,
    deployer
  );
  const currentEpoch = await axelarAuthWeightedContract.currentEpoch();
  console.log("Current Epoch:", currentEpoch.toString());
  console.log(
    "Current Hash:",
    await axelarAuthWeightedContract.hashForEpoch(currentEpoch)
  );
  try {
    // TODO: Prepare params
    const jsonData = readOperatorsInfo();

    // Extracting addresses and powers
    const newOperators = jsonData.map((validator) => `0x${validator.address}`);
    const newWeights = jsonData.map((validator) =>
      ethers.BigNumber.from(validator.power)
    );

    console.log(newOperators);
    console.log(newWeights);

    let combinedArray = newOperators.map((address, index) => {
      return {
        address: address,
        weight: newWeights[index],
      };
    });
    combinedArray.sort((a, b) => {
      if (a.address.toLowerCase() < b.address.toLowerCase()) return -1;
      if (a.address.toLowerCase() > b.address.toLowerCase()) return 1;
      return 0;
    });
    const sortedOperators = combinedArray.map((item) => item.address);
    const sortedWeights = combinedArray.map((item) => item.weight);
    const newThreshold = ethers.BigNumber.from("1300000000000000");
    const types = ["address[]", "uint256[]", "uint256"];
    const encodedParams = ethers.utils.defaultAbiCoder.encode(types, [
      sortedOperators,
      sortedWeights,
      newThreshold,
    ]);

    // Call Transfer Operatorship
    const txTransferOpShip =
      await axelarAuthWeightedContract.transferOperatorship(encodedParams);
    console.log("Transaction hash:", txTransferOpShip.hash);
    await txTransferOpShip.wait();
    console.log("Transaction confirmed");
    newEpoch = await axelarAuthWeightedContract.currentEpoch();
    console.log("New Epoch:", newEpoch.toString());
    console.log(
      "New Hash:",
      await axelarAuthWeightedContract.hashForEpoch(newEpoch)
    );
  } catch (error) {
    console.error("Error executing transaction:", error);
  }
}

function readOperatorsInfo() {
  const genesisFilePath = process.env.GENESIS_FILE_PATH;

  console.log("Genesis file path:", genesisFilePath);
  data = fs.readFileSync(genesisFilePath, "utf8");
  const jsonData = JSON.parse(data);

  // Extract the validators data
  const validators = jsonData.validators;
  return validators;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
