// Import necessary tools from Hardhat and Chai for testing
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

// Top-level test suite for the HumansPeaceTreaty contract
describe("HumansPeaceTreaty", function () {
  // Declare variables to be used across multiple test cases
  let HumansPeaceTreaty;
  let owner, signer1, nonSigner;

  // This hook runs before each test, deploying a fresh contract instance
  // to ensure test isolation and a clean state.
  beforeEach(async function () {
    // Get test accounts (signers) from the Hardhat environment
    [owner, signer1, nonSigner] = await ethers.getSigners();

    // Get the ContractFactory for the HumansPeaceTreaty contract
    const HumansPeaceTreaty = await ethers.getContractFactory("HumansPeaceTreaty");
    
    // Deploy a new instance of the contract
    HumansPeaceTreaty = await HumansPeaceTreaty.deploy();
    await HumansPeaceTreaty.waitForDeployment();
  });

  // Test suite for the `signPeacePledge` function
  describe("Signing the Pledge (signPeacePledge)", function () {
    it("should allow a user to sign the pledge, updating their status and lastProofBlock", async function () {
      // User `signer1` calls the function to sign the pledge
      const tx = await HumansPeaceTreaty.connect(signer1).signPeacePledge();
      const receipt = await tx.wait();
      const txBlockNumber = receipt.blockNumber;

      // Verify the stored data using the public mapping getter
      const pledgeData = await HumansPeaceTreaty.pledges(signer1.address);
      expect(pledgeData.hasSigned).to.be.true;
      expect(pledgeData.lastProofBlock).to.equal(txBlockNumber);
    });

    it("should emit a PledgeSigned event upon a successful signature", async function () {
      // This test verifies that the correct event is emitted with the correct arguments
      await expect(HumansPeaceTreaty.connect(signer1).signPeacePledge())
        .to.emit(HumansPeaceTreaty, "PledgeSigned")
        // We check that the signer is correct. The block number check is just to ensure it's a valid number.
        .withArgs(signer1.address, (block) => block > 0);
    });

    it("should revert if a user tries to sign the pledge more than once", async function () {
      // The user signs successfully for the first time
      await HumansPeaceTreaty.connect(signer1).signPeacePledge();

      // This test verifies that the second attempt from the same user is rejected
      await expect(
        HumansPeaceTreaty.connect(signer1).signPeacePledge()
      ).to.be.revertedWith("HumansPeaceTreaty: You have already signed this pledge.");
    });
  });

  // Test suite for the `proveCommitment` function
  describe("Proving Commitment (proveCommitment)", function () {
    beforeEach(async function() {
      // To test this function, a user must have already signed.
      // We perform the signature here to avoid repetition in each test.
      await HumansPeaceTreaty.connect(signer1).signPeacePledge();
    });

    it("should allow a signatory to prove their commitment, updating the lastProofBlock", async function () {
      // Get the initial proof block from the signing action
      const initialPledge = await HumansPeaceTreaty.pledges(signer1.address);
      const initialProofBlock = initialPledge.lastProofBlock;

      // Advance the blockchain by 10 blocks to simulate the passage of time
      await mine(10);

      // The user now calls `proveCommitment` to reaffirm their pledge
      const proveTx = await HumansPeaceTreaty.connect(signer1).proveCommitment();
      const proveReceipt = await proveTx.wait();
      const newProofBlock = proveReceipt.blockNumber;

      // Verify that the new proof block is updated and greater than the initial one
      const updatedPledge = await HumansPeaceTreaty.pledges(signer1.address);
      expect(updatedPledge.hasSigned).to.be.true; // Status should remain signed
      expect(updatedPledge.lastProofBlock).to.equal(newProofBlock);
      expect(updatedPledge.lastProofBlock).to.be.greaterThan(initialProofBlock);
    });

    it("should emit a CommitmentProven event upon successful proof", async function () {
      // This test verifies that the correct event is emitted when a user proves commitment
      await expect(HumansPeaceTreaty.connect(signer1).proveCommitment())
        .to.emit(HumansPeaceTreaty, "CommitmentProven")
        .withArgs(signer1.address, (block) => block > 0);
    });

    it("should revert if a non-signatory tries to prove their commitment", async function () {
      // This test verifies that a user who has not signed cannot prove commitment
      await expect(
        HumansPeaceTreaty.connect(nonSigner).proveCommitment()
      ).to.be.revertedWith("HumansPeaceTreaty: You must sign the pledge first before proving commitment.");
    });
  });

  // Test suite for the view functions that check pledge status
  describe("Viewing Pledge Status", function () {
    it("hasSigned() should return true for a signatory and false for a non-signatory", async function () {
      // `signer1` signs the pledge
      await HumansPeaceTreaty.connect(signer1).signPeacePledge();

      // Verify `hasSigned` returns the correct boolean for both users
      expect(await HumansPeaceTreaty.hasSigned(signer1.address)).to.be.true;
      expect(await HumansPeaceTreaty.hasSigned(nonSigner.address)).to.be.false;
    });

    it("The public 'pledges' getter should return the full, correct struct data", async function () {
      // First, check the data for a user who has not signed
      const nonSignerPledge = await HumansPeaceTreaty.pledges(nonSigner.address);
      expect(nonSignerPledge.hasSigned).to.be.false;
      expect(nonSignerPledge.lastProofBlock).to.equal(0);

      // Now, have a user sign the pledge
      const tx = await HumansPeaceTreaty.connect(signer1).signPeacePledge();
      const receipt = await tx.wait();
      
      // Verify the returned struct contains the correct data after signing
      const signerPledge = await HumansPeaceTreaty.pledges(signer1.address);
      expect(signerPledge.hasSigned).to.be.true;
      expect(signerPledge.lastProofBlock).to.equal(receipt.blockNumber);
    });
  });
});