const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function humansPeaceTreatyDeploy() {

  const HumansPeaceTreaty = await ethers.getContractFactory("HumansPeaceTreaty");

  const humansPeaceTreaty = await HumansPeaceTreaty.deploy();

  saveContractAddress("HumansPeaceTreaty", humansPeaceTreaty.target);

  console.log(`humansPeaceTreaty address ${humansPeaceTreaty.target}`);

  await verifyContract(humansPeaceTreaty, "humansPeaceTreaty");

  return { humansPeaceTreaty };
}

module.exports = humansPeaceTreatyDeploy;
