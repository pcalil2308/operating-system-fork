const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function globalPlantCatalogDeploy() {

  const GlobalPlantCatalog = await ethers.getContractFactory("GlobalPlantCatalog");

  const globalPlantCatalog = await GlobalPlantCatalog.deploy();

  saveContractAddress("GlobalPlantCatalog", globalPlantCatalog.target);

  console.log(`globalPlantCatalog address ${globalPlantCatalog.target}`);

  await verifyContract(globalPlantCatalog, "globalPlantCatalog");

  return { globalPlantCatalog };
}

module.exports = globalPlantCatalogDeploy;
