const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function sintropAppStoreDeploy() {

  const SintropAppStore = await ethers.getContractFactory("SintropAppStore");

  const sintropAppStore = await SintropAppStore.deploy();

  saveContractAddress("SintropAppStore", sintropAppStore.target);

  console.log(`sintropAppStore address ${sintropAppStore.target}`);

  await verifyContract(sintropAppStore, "sintropAppStore");

  return { sintropAppStore };
}

module.exports = sintropAppStoreDeploy;
