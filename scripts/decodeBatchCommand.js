// This script is used to decode neccessary data from the Batch Commands sending from Axelar.
// Paste the content of Batch Command to the executeObject variable.

const { ethers } = require("hardhat");
const envs = require("../envs.js");
const { readChainConfig, getContractAddress, getAxelarContractByName } = require("./utils.js");
const BATCH_COMMAND = "0x09c5eabe000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000539000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000001df96e8f0fcb260947163941f70d45e556eff33d0d642a13f24ad1ae3f0a4f70d000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000013617070726f7665436f6e747261637443616c6c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000faa7b3a4b5c3f54a934a2e33d34c7bc099f96cce5f1705cc2e4ccc6bc6c0b3c318d18b1c283bc456f2dc0b0ab9db4be1ff3b797e244517975b845d50835e24219b68347c65d77e07172fd3816898de63fe7621990000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f626974636f696e2d726567746573740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000ea6000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000043702cb478537ba955b02f0325f79b1cac06b09800000000000000000000000071877ab6d8b04e8fc644276aeee8814bd9598305000000000000000000000000747d81499ec39fb18c83ad497351ea533825d35b0000000000000000000000009540de771bdaa9f95eb194f35f2af2553d05202200000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000009c400000000000000000000000000000000000000000000000000000000000004e20000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000075300000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000418862fa2bce8b4c01d8220fb53ef91139b8e22fedafada19c02c2c6df41952939405ed36e35d089949a5595e1001cd7677e52b5136643f52ee96b5965c6885e6e1b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041d29a833023e33706bfa5851d5c1f71135ca17120949456bdc1f5e949048776033eb98b4a82f32a3add0666144afa5dce82df9422f1988797ba54ef0fe4fe2f841b00000000000000000000000000000000000000000000000000000000000000";

async function main() {
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress()
  const signerBalance = await signer.getBalance()
  console.log(`Signer ${envs.privateKeySigner} with address: ${signerAddress} and balance ${signerBalance.toString()}`);
  const executeObject = BATCH_COMMAND;
  const chainConfig = await readChainConfig("ethereum-local");
  const authWeightedAddress = getContractAddress(chainConfig, "authWeighted");
  const gatewayAddress = getContractAddress(chainConfig, "gateway");
  const axelarAuthWeightedContract = await getAxelarContractByName("AxelarAuthWeighted", authWeightedAddress);
  const axelarGatewayContract = await getAxelarContractByName("AxelarGateway", gatewayAddress);
  const executeABI = [
    "function execute(bytes calldata input) external override",
  ];
  const executeInterface = new ethers.utils.Interface(executeABI);
  const { input } = executeInterface.decodeFunctionData(
    "execute",
    executeObject
  );
  // console.log("Input:", input);
  const inputDecoded = ethers.utils.defaultAbiCoder.decode(
    ["bytes", "bytes"],
    input
  );
  const [data, proof] = inputDecoded;
  // console.log("Data:", data);
  // console.log("Proof:", proof);
  console.log("========== Data part ==========");
  const dataDecoded = ethers.utils.defaultAbiCoder.decode(
    ["uint256", "bytes32[]", "string[]", "bytes[]"],
    data
  );
  const [chainId, commandIds, commands, params] = dataDecoded;
  console.log("Chain ID:", chainId);
  console.log("Command IDs:", commandIds);
  console.log("Commands:", commands);
  console.log("Params:", params);
  console.log("========== Proof part ==========");
  const proofDecoded = ethers.utils.defaultAbiCoder.decode(
    ["address[]", "uint256[]", "uint256", "bytes[]"],
    proof
  );
  const [operators, weights, threshold, signatures] = proofDecoded;
  console.log("Operators:", operators);
  console.log("Weights:", weights);
  console.log("Threshold:", threshold);
  console.log("Signatures:", signatures);

  console.log("========== Compare data ==========");

  const operatorsHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "uint256"],
      [operators, weights, threshold]
    )
  );
  console.log("Operators hash:", operatorsHash);
  const epochForHash = await axelarAuthWeightedContract.epochForHash(
    operatorsHash
  );
  console.log("Epoch for this hash:", epochForHash.toString());
  const currentEpoch = await axelarAuthWeightedContract.currentEpoch();
  console.log("Current Epoch:", currentEpoch.toString());
  console.log(
    "Current Hash:",
    await axelarAuthWeightedContract.hashForEpoch(currentEpoch)
  );
  console.log("==================================================");
  console.log("Verify Signature:");
  const dataHash = ethers.utils.keccak256(data);

  // Convert the hashed data to an Ethereum signed message hash
  const ethSignedMessageHash = ethers.utils.hashMessage(
    ethers.utils.arrayify(dataHash)
  );
  signatures.map((signature, index) => {
    const signerAddress = ethers.utils.recoverAddress(
      ethSignedMessageHash,
      signature
    );
    console.log("Signer Address", index, ":", signerAddress);
  });
  console.log("========== Check approve ==========");
  console.log(":");
  const paramsDecoded = ethers.utils.defaultAbiCoder.decode(
    ["string", "string", "address", "bytes32", "bytes32", "uint256"],
    params[0]
  );
  const [
    sourceChain,
    sourceAddress,
    contractAddress,
    payloadHash,
    sourceTxHash,
    sourceEventIndex,
  ] = paramsDecoded;
  console.log("Source Chain:", sourceChain);
  console.log("Source Address:", sourceAddress);
  console.log("Contract Address:", contractAddress);
  console.log("Payload Hash:", payloadHash);
  console.log("Source Tx Hash:", sourceTxHash);
  console.log("Source Event Index:", sourceEventIndex.toString());
  console.log("========== Call transaction from wallet ==========");
  const txRes = await signer.sendTransaction({
    to: envs.contractAddressGateway,
    data: executeObject,
    gasLimit: 1000000,
  });
  console.log("Send execute transaction result:", txRes);
  console.log("========== Recall execute on gateway ==========");
  const executeData = `0x${executeObject.substring(10)}`;
  const executeRes = await axelarGatewayContract.execute(executeData, {
    gasLimit: 1000000,
  });
  console.log("Execute result:", executeRes);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
