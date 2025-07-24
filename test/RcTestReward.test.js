// Import necessary tools from Hardhat and Chai for testing
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

// Top-level test suite for the RcTestReward contract
describe("RcTestReward", function () {
  // Declare variables to be used across multiple test cases
  let RcTestReward;
  let rcTestReward;
  let owner, tester1, tester2;
  const DURATION_IN_BLOCKS = 100;

  // The `beforeEach` hook runs before each test (`it` block),
  // ensuring a clean state for every test scenario.
  beforeEach(async function () {
    // Get the signers (test accounts) provided by Hardhat's local network
    [owner, tester1, tester2] = await ethers.getSigners();

    // Get the ContractFactory for our RcTestReward contract
    RcTestReward = await ethers.getContractFactory("RcTestReward");
    
    // Deploy a new instance of the contract, passing the duration as a constructor argument
    rcTestReward = await RcTestReward.deploy(DURATION_IN_BLOCKS);
    // Wait for the deployment transaction to be mined
    await rcTestReward.waitForDeployment();
  });

  // Test suite for contract deployment and initialization
  describe("Deployment", function () {
    it("Should set the correct start and end blocks upon deployment", async function () {
      // Get the deployment transaction receipt to find the block number
      const deployTx = rcTestReward.deploymentTransaction();
      const deployBlock = (await deployTx.wait()).blockNumber;

      // Assert that the startBlock and endBlock state variables were set correctly
      expect(await rcTestReward.startBlock()).to.equal(deployBlock);
      expect(await rcTestReward.endBlock()).to.equal(deployBlock + DURATION_IN_BLOCKS);
    });

    it("Should have the correct constant values", async function () {
      // Assert that the public constants are compiled with the expected values
      expect(await rcTestReward.REWARD_PER_TRANSACTION()).to.equal(100);
      expect(await rcTestReward.MAX_TRANSACTIONS_PER_TESTER()).to.equal(1000);
    });
  });

  // Test suite for the primary state-changing function, `submitAuditReport`
  describe("submitAuditReport", function () {
    // Test the "happy path": a valid submission
    it("Should allow a tester to submit a valid report within the time limit", async function () {
      const txCount = 50;
      const description = "Performed login and transfer tests.";
      const reportHash = "QmVmYWRiODE4ZjcyY2Y3ZGUzM2FhMjY2YjM4MjQ0ZDE=";

      // `tester1` submits the report. `.connect(tester1)` executes the function from their account.
      await rcTestReward.connect(tester1).submitAuditReport(txCount, description, reportHash);

      // Verify that the data was stored correctly in the `auditReports` mapping
      const submittedReport = await rcTestReward.auditReports(tester1.address);
      expect(submittedReport.transactionCount).to.equal(txCount);
      expect(submittedReport.description).to.equal(description);
      expect(submittedReport.reportHash).to.equal(reportHash);
      expect(submittedReport.tester).to.equal(tester1.address);
    });

    // Revert case tests for various failure scenarios
    it("Should revert if the same tester tries to submit a report twice", async function () {
      // First submission (successful)
      await rcTestReward.connect(tester1).submitAuditReport(10, "First report", "hash1");

      // Second submission (expected to fail)
      // `expect(...).to.be.revertedWith(...)` asserts that the transaction fails with the specified error message.
      await expect(
        rcTestReward.connect(tester1).submitAuditReport(20, "Second report", "hash2")
      ).to.be.revertedWith("RcTestReward: Report already submitted.");
    });

    it("Should revert if the testing period has ended", async function () {
      // Advance the blockchain by 101 blocks, exceeding the 100-block duration
      await mine(DURATION_IN_BLOCKS + 1);

      // Attempt to submit after the deadline (expected to fail)
      await expect(
        rcTestReward.connect(tester1).submitAuditReport(10, "Late report", "hash_late")
      ).to.be.revertedWith("RcTestReward: Testing period has ended.");
    });

    it("Should revert if transaction count is zero", async function () {
      // Attempt to submit with 0 transactions (expected to fail)
      await expect(
        rcTestReward.connect(tester1).submitAuditReport(0, "Zero transactions", "hash_zero")
      ).to.be.revertedWith("RcTestReward: Transaction count must be positive.");
    });

    it("Should revert if transaction count exceeds the maximum limit", async function () {
      // Attempt to submit with more than 1000 transactions (expected to fail)
      const overLimitCount = (await rcTestReward.MAX_TRANSACTIONS_PER_TESTER()) + 1n; // Use BigInt for safety
      await expect(
        rcTestReward.connect(tester1).submitAuditReport(overLimitCount, "Too many transactions", "hash_over")
      ).to.be.revertedWith("RcTestReward: Transaction count exceeds maximum limit.");
    });
  });

  // Test suite for the contract's view functions
  describe("View Functions", function () {
    it("getOwedTokens should calculate the correct potential reward", async function () {
      // tester1 submits a report with 75 transactions
      await rcTestReward.connect(tester1).submitAuditReport(75, "Report for token calculation", "hash_calc");
      
      // The owed amount should be 75 * 100 = 7500
      expect(await rcTestReward.getOwedTokens(tester1.address)).to.equal(7500);
      
      // For a tester who has not submitted, the amount should be 0
      expect(await rcTestReward.getOwedTokens(tester2.address)).to.equal(0);
    });

    it("getBlocksRemaining should return the correct number of blocks", async function () {
      // Immediately after deployment, remaining blocks should equal the total duration.
      // A small variance of 1 block is tolerated due to test execution timing.
      let remaining = await rcTestReward.getBlocksRemaining();
      expect(remaining).to.be.closeTo(DURATION_IN_BLOCKS, 1);

      // Advance the blockchain by 20 blocks
      await mine(20);

      // Check if the remaining block count has decreased accordingly.
      // The delta is 21 because `mine(20)` advances to the 20th block, and the `get` call is in the 21st.
      remaining = await rcTestReward.getBlocksRemaining();
      expect(remaining).to.be.closeTo(DURATION_IN_BLOCKS - 21, 1);

      // Advance the blockchain past the end of the testing period
      await mine(DURATION_IN_BLOCKS);

      // The number of remaining blocks should now be 0
      expect(await rcTestReward.getBlocksRemaining()).to.equal(0);
    });
  });
});