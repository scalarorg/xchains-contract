const { ethers, computeAddress } = require("ethers");
const fs = require("fs");
const yargs = require('yargs');
const path = require("path");
const { readChainConfig, getConfigPath, createWallet, getContractAddress } = require("./utils");

async function main() {
  const {n : network} = yargs
    .option('network', {
      alias: 'n',
      description: 'network',
      type: 'string',
      demandOption: true
    }).argv;
  const chainConfig = await readChainConfig(network);
  if (!chainConfig) {
    console.error(`Chain config for network ${network} not found`);
    return;
  }
  const wallet = createWallet(chainConfig);

  const contractName = "AxelarAuthWeighted";
  const contractArtifact = require(`../artifacts/contracts/axelar/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const authWeightedAddress = getContractAddress(chainConfig, "authWeighted");
  console.log(`Auth weighted contract address: ${authWeightedAddress}`);
  const axelarAuthWeightedContract = new ethers.Contract(
    authWeightedAddress, // TODO
    contractABI,
    wallet
  );
  const currentEpoch = await axelarAuthWeightedContract.currentEpoch();
  const currentHash = await axelarAuthWeightedContract.hashForEpoch(currentEpoch);
  console.log(`Current Epoch: ${currentEpoch.toString()}, Hash: ${currentHash}`);
  try {
    // TODO: Prepare params
    const keyPath = chainConfig.keyPath || path.join(getConfigPath(), network, "key");
    const [newOperators, newWeights, newThreshold] = readOperatorsInfo(keyPath);

    // Extracting addresses and powers
    console.log(newOperators);
    console.log(newWeights);
    console.log(newThreshold);
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
    const types = ["address[]", "uint256[]", "uint256"];
    const encodedParams = ethers.AbiCoder.defaultAbiCoder().encode(types, [
      sortedOperators,
      sortedWeights,
      newThreshold,
    ]);

    // Call Transfer Operatorship
    const txTransferOpShip =
      await axelarAuthWeightedContract.transferOperatorship(encodedParams, {
        gasLimit: 3000000,
      });
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

function readOperatorsInfo(keyPath) {
  console.log("Key file path:", keyPath);
  data = fs.readFileSync(keyPath, "utf8");
  const jsonData = JSON.parse(data);

  // Extract the validators data
  const threshold = jsonData.threshold_weight;
  const operators = jsonData.participants.map((participant) => {
    const pubKey = "0x" + participant.pub_key;
    return computeAddress(pubKey);
  });
  const weights = jsonData.participants.map((participant) => {
    return participant.weight;
  });
  return [operators, weights, threshold];
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
