// This script is used to decode neccessary data from the Batch Commands sending from Axelar.
// Paste the content of Batch Command to the executeObject variable.

const { ethers } = require("hardhat");
const envs = require("../envs.js");
const BATCH_COMMAND="0x09c5eabe000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000001b1b766153d76a1c1b107b10c928d00fe4bbe2c0398a7893436c56329b6925355000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000013617070726f7665436f6e747261637443616c6c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000768e8de8cf0c7747d41f75f83c914a19c5921cf3697d52f010038ab37352d5109e7d1120fc7b7fcf7ccba5d29d2c8122b5c258d8db5eaf871512ed331f5c0a000fa356f4334e04d4bba45170ffa9b5e4ca916c0400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007626974636f696e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a30783133304334383130443537313430653145363239363763424637343243614561453931623665634500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000ea6000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000c66674cea3916425f91bf260bd0bad316c7df140000000000000000000000001db53a6746d3c2d962011f9b7b50a8893142814e0000000000000000000000005536ac48b248f5a8bba7f8f6f0cf2885a666110a00000000000000000000000083a9aeb9dca341dfda6ae7b264ad955e47b206ad00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000009c4000000000000000000000000000000000000000000000000000000000000075300000000000000000000000000000000000000000000000000000000000004e2000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000041eda8bc8d4d496defe6b94d0f9635db4f6ad61dbf7a43e723248b01119ccd80bd7869fddb6e1d8d46c1ff1a6e3ef674decf7bdf455e6fb4c1d58fcc2fdd92b0ff1c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041ff1876eebb823b5a75c8cf91a40cceaca9cb08404ff7c855b51c104fd4f1b90e52f714b8a4e5850850e02755317bf1431431b16b2ba3099314c423e3e19b31691c00000000000000000000000000000000000000000000000000000000000000"
async function getContractByName(name, address) {
  const [signer] = await ethers.getSigners();
  const { abi } = require(`../artifacts/contracts/axelar/${name}.sol/${name}.json`);
  const constract = new ethers.Contract(
    address,
    abi,
    signer
  );
  return constract
}

async function main() {
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress()
  const signerBalance = await signer.getBalance()
  console.log(`Signer ${envs.privateKeySigner} with address: ${signerAddress} and balance ${signerBalance.toString()}`);
  const executeObject = BATCH_COMMAND;
  const axelarAuthWeightedContract = await getContractByName("AxelarAuthWeighted", envs.contractAddressAuthWeighted);
  const axelarGatewayContract = await getContractByName("AxelarGateway", envs.contractAddressGateway);
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
  console.log(
    "Current Hash:",
    await axelarAuthWeightedContract.hashForEpoch(currentEpoch)
  );
  console.log("Current Epoch:", currentEpoch.toString());
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
