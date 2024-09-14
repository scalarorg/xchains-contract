// Remember to change MintContract address at 2 places in the script.

const { ethers } = require("hardhat");
const envs = require("../envs.js");
const path = require("path");
const { setTimeout } = require("timers/promises");
const { readChainConfig, getContractAddress, getAxelarContractByName, getContractByName } = require("./utils.js");

const EXECUTE_PAYLOAD = "0x49160658b5561135fc533f6dbbab4e0b6648b9b1d7ed49fa562bd58f75563e5a9a9a806d000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000000f626974636f696e2d726567746573740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a307866333946643665353161616438384636463463653661423838323732373963666646623932323636000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000000000000002710";
async function main() {
  const [signer] = await ethers.getSigners();

  console.log("Signer account:", await signer.getAddress());
  console.log("Account balance:", (await signer.getBalance()).toString());
  const chainConfig = await readChainConfig(envs.network);
  
  const axlGatewayAddress = getContractAddress(chainConfig, "gateway");
  console.log(`Gateway contract address: ${axlGatewayAddress}`);
  const axlContract = getAxelarContractByName("AxelarGateway", axlGatewayAddress);

  const mintContractAddress = getContractAddress(chainConfig, "mintContract");
  console.log(`Mint contract address: ${mintContractAddress}`);
  const mintContract = getContractByName("MintContract", mintContractAddress);
  
  const sBtcAddress = getContractAddress(chainConfig, "sBtc");
  console.log(`sBTC contract address: ${sBtcAddress}`);
  const sbtcContract = getContractByName("sBTC", sBtcAddress);

  console.log("========== Call transaction from wallet ==========");
  const txRes = await signer.sendTransaction({
    to: mintContractAddress,
    data: EXECUTE_PAYLOAD,
    gasLimit: 1000000,
  });
  console.log("Result:", txRes);

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
  const payloadBytes = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint256"],
    [
      "0x130C4810D57140e1E62967cBF742CaEaE91b6ecE",
      ethers.utils.parseUnits("1", 18),
    ]
  );
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
