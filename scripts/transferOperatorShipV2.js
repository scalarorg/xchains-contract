const { ethers } = require("hardhat");
const fs = require("fs").promises;
const yargs = require('yargs');
const envs = require("../envs.js");
const path = require("path");


async function main() {
  const argv = yargs
    .option('network', {
      alias: 'n',
      description: 'network',
      type: 'string',
      demandOption: true
    }).argv;

  const chainConfig = await readChainConfig(argv.n);
  const provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
  const wallet = new ethers.Wallet(envs.privateKeySigner, provider);

  
  const contractName = "AxelarAuthWeighted";
  const contractArtifact = require(`../artifacts/contracts/axelar/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const axelarAuthWeightedContract = new ethers.Contract(
    chainConfig.authWeighted, // TODO
    contractABI,
    wallet
  );
  const currentEpoch = await axelarAuthWeightedContract.currentEpoch();
  console.log("Current Epoch:", currentEpoch.toString());
  console.log(
    "Current Hash:",
    await axelarAuthWeightedContract.hashForEpoch(currentEpoch)
  );
  try {
    // TODO: Prepare params
    const [newOperators, newWeights, newThreshold] = readOperatorsInfo(chainConfig.keyPath);

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

function readOperatorsInfo(genesisFilePath) {
  // const genesisFilePath = process.env.KEY_SEPOLIA_PATH;

  console.log("Genesis file path:", genesisFilePath);
  data = fs.readFileSync(genesisFilePath, "utf8");
  const jsonData = JSON.parse(data);

  // Extract the validators data
  const threshold = jsonData.threshold_weight;
  const operators = jsonData.participants.map((participant) => {
    const pubKey = "0x" + participant.pub_key;
    return ethers.utils.computeAddress(pubKey);
  });
  const weights = jsonData.participants.map((participant) => {
    return participant.weight;
  });
  return [operators, weights, threshold];
}

async function readChainConfig(chain) {
  try {
      const filePath = path.join(__dirname, "..", "config", "chains", chain, `${chain}.json`)
      console.log(chain)
      const data = await fs.readFile(filePath, 'utf8');
      const chainConfig = JSON.parse(data);
      return chainConfig

  } catch (error) {
      console.error('Error reading or parsing the file:', error);
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
