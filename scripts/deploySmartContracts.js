const { printObj, readJSON, writeJSON, importNetworks, verifyContract, getBytecodeHash, deployITS, deployAmplifierGateway, deployLegacyGateway }
    = require('../axelar-contract-deployments/evm');
async function main() {
    console.log("Deploying Smart Contracts");
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });