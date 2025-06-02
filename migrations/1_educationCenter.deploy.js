const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function educationCenterDeploy() {

  const FreeEducationCenter = await ethers.getContractFactory("FreeEducationCenter");

  const educationCenter = await FreeEducationCenter.deploy();

  saveContractAddress("FreeEducationCenter", educationCenter.target);

  console.log(`EducationCenter address ${educationCenter.target}`);

  await verifyContract(educationCenter, "EducationCenter");

  return { educationCenter };
}

module.exports = educationCenterDeploy;
