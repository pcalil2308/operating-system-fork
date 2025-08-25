const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function whitepaperCenterDeploy() {

  const WhitepaperCenter = await ethers.getContractFactory("WhitepaperCenter");

  const whitepaperCenter = await WhitepaperCenter.deploy();

  saveContractAddress("WhitepaperCenter", whitepaperCenter.target);

  console.log(`WhitepaperCenter address ${whitepaperCenter.target}`);

  await verifyContract(whitepaperCenter, "WhitepaperCenter");

  return { whitepaperCenter };
}

module.exports = whitepaperCenterDeploy;
