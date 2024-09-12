
const fs = require('fs').promises;
const { outputJsonSync } = require('fs-extra');
const path = require('path');

async function readChainConfig(chain, file) {
    try {
        const filePath = path.join(__dirname, "..", "config", "chains", chain, `${chain}.json`);
        const data = await fs.readFile(file === undefined ? filePath : file, 'utf8');
        const chainConfig = JSON.parse(data);
        return chainConfig

    } catch (error) {
        console.error('Error reading or parsing the file:', error);
    }
}



function saveChainConfig(config, chain, file) {
    const filePath = `${__dirname}/../config/chains/${chain}/deployed-addresses.json`;
    // console.log(filePath)
    writeJSON(config, file === undefined ? filePath : file);
}

const writeJSON = (data, name) => {
    outputJsonSync(name, data, {
        spaces: 2,
        EOL: '\n',
    });
};

// const data = {
//     name: 'Alice',
//     age: 30,
//     city: 'Wonderland'
// };

// saveConfig(data, "atest",".")


module.exports = {
    readChainConfig,
    saveChainConfig
}