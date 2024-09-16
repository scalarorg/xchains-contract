// Remember to change MintContract address at 2 places in the script.

const { ethers } = require("hardhat");
const envs = require("../envs.js");
const path = require("path");
const { setTimeout } = require("timers/promises");
const { readChainConfig, getContractAddress, getAxelarContractByName, getContractByName } = require("./utils.js");

const parsePayload = (executeData) => {
  const executeABI = [
    "function execute(bytes32 commandId,string calldata sourceChain,string calldata sourceAddress,bytes calldata payload) external",
  ];
  const executeInterface = new ethers.utils.Interface(executeABI);
  const { commandId, sourceChain, sourceAddress, payload } = executeInterface.decodeFunctionData(
    "execute",
    executeData
  );
  console.log(commandId, sourceChain, sourceAddress, payload);
  const [to, amount] = ethers.utils.defaultAbiCoder.decode(["address", "uint256"], payload);
  // console.log(decodeRes);
  // const abiFunctions = [
  //   "function mint(address to, uint256 amount) public",
  // ];
  // const abiInterface = new ethers.utils.Interface(abiFunctions)
  // const { to, amount } = abiInterface.decodeFunctionData("mint", payload);
  return { commandId, sourceChain, sourceAddress, payload, to, amount };
}
const EXECUTE_PAYLOAD = "0x49160658b7ec524185392ab7546689791cce2ce7b41b84712bc706787b40777487ee939c000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000f626974636f696e2d726567746573740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a307866333946643665353161616438384636463463653661423838323732373963666646623932323636000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000002710";
async function main() {
  const [signer] = await ethers.getSigners();

  console.log("Signer account:", await signer.getAddress());
  console.log("Account balance:", (await signer.getBalance()).toString());
  const chainConfig = await readChainConfig(envs.network);
  console.log("Chain config:", chainConfig);
  const axlGatewayAddress = await getContractAddress(chainConfig, "gateway");
  console.log(`Gateway contract address: ${axlGatewayAddress}`);
  const axlGatewayContract = await getAxelarContractByName("AxelarGateway", axlGatewayAddress);

  const mintContractAddress = await getContractAddress(chainConfig, "mintContract");
  console.log(`Mint contract address: ${mintContractAddress}`);
  const mintContract = await getContractByName("MintContract", mintContractAddress);

  const sBtcAddress = await getContractAddress(chainConfig, "sBtc");
  console.log(`sBTC contract address: ${sBtcAddress}`);
  const sbtcContract = await getContractByName("sBTC", sBtcAddress);

  console.log("========== Check ContractCall Validation =========="); 
  const { commandId, sourceChain, sourceAddress, payload, to, amount } = parsePayload(EXECUTE_PAYLOAD);
  // Check if the contract call is approved
  const payloadHash = ethers.utils.keccak256(payload);
  //0xd584e5b96e6028181ae2acc142dc87bdb1b2260d9a62020a22f843043124f26c
  console.log("Command ID:", commandId);
  console.log("Payload hash:", payloadHash);
  console.log(`MintContract Address: ${mintContract.address}`)
  console.log(`Source Chain: ${sourceChain}`);
  console.log(`Source Address: ${sourceAddress}`);
  console.log(`Gateway address: ${axlGatewayContract.address}`);
  const validateResult = await axlGatewayContract.isContractCallApproved(
    commandId,
    sourceChain,
    sourceAddress,
    mintContract.address,
    payloadHash
  );
  console.log("Validation result:", validateResult);
  console.log("========== Call transaction from wallet ==========");
  
  const tx = {
    to: mintContractAddress,
    data: EXECUTE_PAYLOAD,
    gasLimit: 1000000,
  }
  const tx2 = {
    to: "0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE",
    data: EXECUTE_PAYLOAD,
    gasLimit: 1000000,
  }
  const txRes = await signer.sendTransaction(tx2);
  console.log("Result:", txRes);
  const txReceipt = await txRes.wait();
  console.log("Receipt:", txReceipt);

  // console.log("========== Call transaction from contract ==========");
  // const commandId = ethers.utils.toUtf8Bytes("b7ec524185392ab7546689791cce2ce7b41b84712bc706787b40777487ee939c");
  // const payloadBytes = "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000002710";
  // console.log("Mint contract address:", mintContract.address);
  // const txExecute = await mintContract.execute(
  //   commandId,
  //   'bitcoin-regtest',
  //   '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  //   payloadBytes,
  //   {
  //     gasLimit: 2000000,
  //   }
  // );
  // console.log("Transaction hash:", txExecute.hash);

  // // Wait for transaction confirmation
  // const receipt = await txExecute.wait();
  // console.log("Transaction confirmed");

  // const {
  //   params,
  //   commandId,
  //   sourceChain,
  //   sourceAddress,
  //   payloadHash,
  //   payloadBytes,
  // } = prepareTxParams();

  // // ApproveContractCall
  // const txApproveContractCall = await axlContract.approveContractCall(
  //   params,
  //   commandId
  // );
  // console.log("Transaction hash:", txApproveContractCall.hash);
  // await txApproveContractCall.wait();

  // // Check if the contract call is approved
  // const validateResult = await axlContract.isContractCallApproved(
  //   commandId,
  //   sourceChain,
  //   sourceAddress,
  //   mintContract.address,
  //   payloadHash
  // );
  // console.log("Validation result:", validateResult);

  // try {
  //   console.log("Prepare payload bytes:", payloadBytes);
  //   console.log("Prepare payload hash:", payloadHash);

  //   // Call execute function
  //   console.log(
  //     "Balance before execute:",
  //     await sbtcContract.balanceOf(signer.address)
  //   );
  //   const txExecute = await mintContract.execute(
  //     commandId,
  //     sourceChain,
  //     sourceAddress,
  //     payloadBytes,
  //     {
  //       gasLimit: 2000000,
  //     }
  //   );
  //   console.log("Transaction hash:", txExecute.hash);

  //   // Wait for transaction confirmation
  //   await txExecute.wait();
  //   console.log("Transaction confirmed");

  //   // Log message after execute
  //   console.log(
  //     "Balance after execute:",
  //     await sbtcContract.balanceOf(signer.address)
  //   );
  // } catch (error) {
  //   console.error("Error executing transaction:", error);
  // }
}

function prepareTxParams() {
  const sourceChain = "Bitcoin";
  const sourceAddress = "0xBitcoinSourceAddress";
  const contractAddress = "0x3AE131F593C603c152f419f954C49f8A742bEC8c"; // TODO
  const userAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const payloadBytes = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256"],
    [
      userAddress,
      10000,
    ]
  );
  console.log(payloadBytes)
  // const payloadBytes2 = ethers.utils.defaultAbiCoder.encode(
  //   ["address", "uint256"],
  //   [
  //     userAddress,
  //     11000,
  //   ]
  // );
  // console.log(payloadBytes2)
  const payloadHash = ethers.utils.keccak256(payloadBytes);
  const sourceTxHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("0xBitcoinSourceTxHash")
  );
  const sourceEventIndex = 1; // Example value, use the actual event index
  const params = ethers.utils.defaultAbiCoder.encode(
    ["string", "string", "address", "bytes32", "bytes32", "uint256"],
    [
      sourceChain,
      sourceAddress,
      contractAddress,
      payloadHash,
      sourceTxHash,
      sourceEventIndex,
    ]
  );
  // Define the commandId

  const commandId = ethers.utils.randomBytes(32);
  return {
    params,
    commandId,
    sourceChain,
    sourceAddress,
    payloadHash,
    payloadBytes,
  };
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
