// Import necessary tools from Hardhat and Chai for testing
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

// Top-level test suite for the HumansPeaceTreaty contract
describe("HumansPeaceTreaty", function () {
  // Declare variables to be used across multiple test cases
  let humansPeaceTreaty;
  let owner, signer1, signer2;

  // This hook runs before each test, deploying a fresh contract instance
  beforeEach(async function () {
    // Get test accounts (signers) from the Hardhat environment
    [owner, signer1, signer2] = await ethers.getSigners();

    // Get the ContractFactory for the HumansPeaceTreaty contract
    const HumansPeaceTreaty = await ethers.getContractFactory("HumansPeaceTreaty");
    
    // Deploy a new instance of the contract
    humansPeaceTreaty = await HumansPeaceTreaty.deploy();
    await humansPeaceTreaty.waitForDeployment();
  });

  // Test suite for contract deployment and initial state
  describe("Deployment", function () {
    it("should initialize the totalSignatures counter to zero", async function () {
      // This test verifies that the counter starts at 0 upon deployment.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(0);
    });
  });

  // Test suite for the `signPeacePledge` function
  describe("Signing the Pledge (signPeacePledge)", function () {
    it("should increment the totalSignatures counter upon a new signature", async function () {
      // Initially, the counter should be 0.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(0);

      // User `signer1` signs the pledge.
      await humansPeaceTreaty.connect(signer1).signPeacePledge();
      // The counter should now be 1.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(1);

      // A different user, `signer2`, signs the pledge.
      await humansPeaceTreaty.connect(signer2).signPeacePledge();
      // The counter should now be 2.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(2);
    });
    
    it("should allow a user to sign the pledge, updating their status and lastProofBlock", async function () {
      const tx = await humansPeaceTreaty.connect(signer1).signPeacePledge();
      const receipt = await tx.wait();
      const txBlockNumber = receipt.blockNumber;

      const pledgeData = await humansPeaceTreaty.pledges(signer1.address);
      expect(pledgeData.hasSigned).to.be.true;
      expect(pledgeData.lastProofBlock).to.equal(txBlockNumber);
    });

    it("should emit a PledgeSigned event upon a successful signature", async function () {
      await expect(humansPeaceTreaty.connect(signer1).signPeacePledge())
        .to.emit(humansPeaceTreaty, "PledgeSigned")
        .withArgs(signer1.address, (block) => block > 0);
    });

    it("should NOT increment the counter if a user tries to sign more than once", async function () {
      // The user signs successfully, incrementing the counter to 1.
      await humansPeaceTreaty.connect(signer1).signPeacePledge();
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(1);

      // The second attempt from the same user is reverted.
      await expect(
        humansPeaceTreaty.connect(signer1).signPeacePledge()
      ).to.be.revertedWith("HumansPeaceTreaty: You have already signed this pledge.");

      // This test verifies that the counter remains unchanged after the failed transaction.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(1);
    });
  });

  // Test suite for the `proveCommitment` function
  describe("Proving Commitment (proveCommitment)", function () {
    beforeEach(async function() {
      // A user must have already signed, setting the initial counter to 1.
      await humansPeaceTreaty.connect(signer1).signPeacePledge();
    });

    it("should NOT increment the counter when a user proves commitment", async function () {
      // The counter is 1 from the signature in `beforeEach`.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(1);

      // The user now calls `proveCommitment`.
      await humansPeaceTreaty.connect(signer1).proveCommitment();

      // This test verifies that the counter is not affected by proving commitment.
      expect(await humansPeaceTreaty.totalSignatures()).to.equal(1);
    });

    it("should allow a signatory to prove their commitment, updating the lastProofBlock", async function () {
        const initialPledge = await humansPeaceTreaty.pledges(signer1.address);
        const initialProofBlock = initialPledge.lastProofBlock;
  
        await mine(10);
  
        const proveTx = await humansPeaceTreaty.connect(signer1).proveCommitment();
        const proveReceipt = await proveTx.wait();
        const newProofBlock = proveReceipt.blockNumber;
  
        const updatedPledge = await humansPeaceTreaty.pledges(signer1.address);
        expect(updatedPledge.lastProofBlock).to.equal(newProofBlock);
        expect(updatedPledge.lastProofBlock).to.be.greaterThan(initialProofBlock);
      });
  });
});