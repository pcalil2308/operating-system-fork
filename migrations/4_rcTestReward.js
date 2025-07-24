const saveContractAddress = require("../scripts/shared/saveContractAddress");
const verifyContract = require("../scripts/shared/verifyContract");

async function rcTestRewardDeploy() {

  const RcTestReward = await ethers.getContractFactory("RcTestReward");
  const durationInBlocks = process.env.RCTEST_REWARD_DURATION_IN_BLOCKS;

  const rcTestReward = await RcTestReward.deploy(durationInBlocks);

  saveContractAddress("RcTestReward", rcTestReward.target);

  console.log(`rcTestReward address ${rcTestReward.target}`);

  await verifyContract(rcTestReward, "rcTestReward");

  return { rcTestReward };
}

module.exports = rcTestRewardDeploy;
