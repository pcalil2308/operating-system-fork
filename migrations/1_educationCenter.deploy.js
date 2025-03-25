const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function educationCenterDeploy() {

  const EducationCenter = await ethers.getContractFactory("EducationCenter");

  const educationCenter = await EducationCenter.deploy();

  saveContractAddress("EducationCenter", educationCenter.target);

  console.log(`EducationCenter address ${educationCenter.target}`);

  await verifyContract(educationCenter, "EducationCenter");

  return { educationCenter };
}

module.exports = educationCenterDeploy;
