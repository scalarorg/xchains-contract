// This script is used to decode neccessary data from the Batch Commands sending from Axelar.
// Paste the content of Batch Command to the executeObject variable.

const { ethers } = require("hardhat");
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const contractName = "AxelarAuthWeighted";
  const contractArtifact = require(`../artifacts/contracts/axelar/${contractName}.sol/${contractName}.json`);
  const contractABI = contractArtifact.abi;
  const axelarAuthWeightedContract = new ethers.Contract(
    "0x1B20209EdF21c10E85a2Fee5244f0c8C2A446387", // TODO
    contractABI,
    deployer
  );

  const executeABI = [
    "function execute(bytes calldata input) external override",
  ];
  const executeInterface = new ethers.utils.Interface(executeABI);
  const executeObject =
    "0x09c5eabe000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000006a00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000aa36a7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000011bb6636d755afa06bf8a693b8975bb066e1fbed3a33458bc99897affc39a5bd3000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000013617070726f7665436f6e747261637443616c6c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001000000000000000000000000003a619659ea28c078bb14c10dcdcb631216bf4094169fa48cdcaf12bcb6dcdf2237dfa6e97a0fa17ec31f3a56225b22e9920c16bbf1c192a990488b69f944dd5771b977ef8a5d7a4a3326472a2e65a32ae0023b760000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000857626974636f696e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a30783436396630613634643545644536344663614631363139353236353741414634303539303430646500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000ea6000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000032cd577042ce0145a8993e316953f645447c478700000000000000000000000060e068cda5aa35a8b978924315eb0b667b41c7190000000000000000000000008419e0124264b91e08ff96da396ddde840049d57000000000000000000000000bd7cb31c8b71e6d2334a439374f9a77c82dadded00000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000009c40000000000000000000000000000000000000000000000000000000000000753000000000000000000000000000000000000000000000000000000000000027100000000000000000000000000000000000000000000000000000000000004e200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000413c001c3b5eeaaca234d5c85a8b9bf8237e3d9b32b1866f9f439d4385ee5f3d5b32dc36f3dfc465e9eddcd6e23c0c2635afa67802b826b492683ad6c09ea2a8501c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004140d2ab85bc37ce94bce5d2cd106b9dafdb7b81c8a4b3127fa63af8f5ec3f99393812e80a35a42026fe77e380d7bf0c88ed14f6eeae1dd96aca8f957daa4c46281c00000000000000000000000000000000000000000000000000000000000000";
  const decodedData = executeInterface.decodeFunctionData(
    "execute",
    executeObject
  );
  const input = decodedData.input;
  const inputDecoded = ethers.utils.defaultAbiCoder.decode(
    ["bytes", "bytes"],
    input
  );
  const [data, proof] = inputDecoded;
  console.log("==================================================");
  console.log("Data part:");
  const dataDecoded = ethers.utils.defaultAbiCoder.decode(
    ["uint256", "bytes32[]", "string[]", "bytes[]"],
    data
  );
  const [chainId, commandIds, commands, params] = dataDecoded;
  console.log("Chain ID:", chainId);
  console.log("Command IDs:", commandIds);
  console.log("Commands:", commands);
  console.log("Params:", params);
  console.log("==================================================");
  console.log("Proof part:");
  const proofDecoded = ethers.utils.defaultAbiCoder.decode(
    ["address[]", "uint256[]", "uint256", "bytes[]"],
    proof
  );
  const [operators, weights, threshold, signatures] = proofDecoded;
  console.log("Operators:", operators);
  console.log("Weights:", weights);
  console.log("Threshold:", threshold);
  console.log("Signatures:", signatures);

  console.log("==================================================");
  console.log("Compare data:");
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
  console.log("==================================================");
  console.log("Check approve:");
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
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
