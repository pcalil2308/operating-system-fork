// Import the necessary tools from Chai for assertions and from Hardhat/Ethers for contract interaction.
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Main `describe` block grouping all tests for the "WhitepaperCenter" contract.
describe("WhitepaperCenter", function () {
  // Declare variables to be used across multiple tests.
  let WhitepaperCenter;
  let whitepaperCenter;
  let owner, addr1;

  // `beforeEach` runs before EACH `it()` test, ensuring a clean state.
  beforeEach(async function () {
    // Get test accounts provided by Hardhat.
    [owner, addr1] = await ethers.getSigners();

    // Get the contract factory.
    WhitepaperCenter = await ethers.getContractFactory("WhitepaperCenter");
    // Deploy a new contract instance.
    whitepaperCenter = await WhitepaperCenter.deploy();
    await whitepaperCenter.waitForDeployment();
  });

  // Test group for the initial state of the contract after deployment.
  describe("Deployment", function () {
    it("Should initialize with a whitepapersCount of 0", async function () {
      // The initial count of whitepaper should be zero.
      expect(await whitepaperCenter.whitepapersCount()).to.equal(0);
    });
  });

  // Test group for the `addWhitepaper` functionality.
  describe("Adding Whitepaper", function () {
    it("Should allow a user to add new whitepaper with valid data", async function () {
      // Define sample data for a new whitepaper entry.
      const title = "Introduction to Solidity";
      const description = "A beginner-friendly guide to smart contract development.";
      const url = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";

      // The first whitepaper ID should be 1, as the counter is incremented first.
      const expectedId = 1;

      // Expect the transaction to emit the `WhitepaperPublished` event with the correct arguments.
      await expect(whitepaperCenter.addWhitepaper(title, description, url))
        .to.emit(whitepaperCenter, "WhitepaperPublished")
        .withArgs(expectedId, title, owner.address);

      // Check if the whitepaper counter has been updated.
      expect(await whitepaperCenter.whitepapersCount()).to.equal(expectedId);

      // Retrieve the newly added whitepaper from the public `whitepapers` mapping to verify its data.
      const newWhitepaper = await whitepaperCenter.whitepapers(expectedId);
      expect(newWhitepaper.id).to.equal(expectedId);
      expect(newWhitepaper.title).to.equal(title);
      expect(newWhitepaper.description).to.equal(description);
      expect(newWhitepaper.url).to.equal(url);
    });

    it("Should revert if the title is empty", async function () {
      // We test a failure case: trying to add whitepaper with an empty title.
      // We expect the transaction to be reverted with the exact error message from the `require` statement.
      await expect(whitepaperCenter.addWhitepaper("", "Description", "url")).to.be.revertedWith(
        "Title must be between 1 and 49 characters"
      );
    });

    it("Should revert if the URL is empty", async function () {
      // We test another failure case: empty URL.
      await expect(whitepaperCenter.addWhitepaper("Title", "Description", "")).to.be.revertedWith(
        "URL must be between 1 and 199 characters"
      );
    });

    it("Should revert if user tries to publish more than one paper", async function () {
      await whitepaperCenter.addWhitepaper("Title", "Description", "Test");
      await expect(whitepaperCenter.addWhitepaper("Title", "Description", "Test")).to.be.revertedWith(
        "Only one paper allowed"
      );
    });    
  });

  // Test suite for the Voting functionality
  describe("Voting", function () {
    let whitepaperCenter;
    let owner, addr1, addr2;
    const whitepaperId = 1; // ID of the whitepaper to be used in tests

    // Enum values mimicking the contract's VoteType
    const VOTE_TYPE = {
      None: 0,
      Upvote: 1,
      Downvote: 2,
    };

    // Hook to run before each test in this suite
    beforeEach(async function () {
      // Get signers to be used as different users
      [owner, addr1, addr2] = await ethers.getSigners();

      const WhitepaperCenter = await ethers.getContractFactory("WhitepaperCenter");
      whitepaperCenter = await WhitepaperCenter.deploy();

      // Add a sample whitepaper so we can vote on it
      await whitepaperCenter
        .connect(owner)
        .addWhitepaper(
          "Test Title",
          "A description for the voting test.",
          "https://example.com/whitepaper"
        );
    });

    // --- Tests for the vote() function ---
    describe("vote()", function () {
      context("When a user casts a new vote", function () {
        it("✅ Should allow an upvote and increment the upvotes count", async function () {
          // Action: addr1 casts an upvote on whitepaper with ID 1
          await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Upvote);

          const whitepaper = await whitepaperCenter.whitepapers(whitepaperId);
          expect(whitepaper.upvotes).to.equal(1);
          expect(whitepaper.downvotes).to.equal(0);
        });

        it("✅ Should allow a downvote and increment the downvotes count", async function () {
          // Action: addr1 casts a downvote on whitepaper with ID 1
          await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Downvote);

          const whitepaper = await whitepaperCenter.whitepapers(whitepaperId);
          expect(whitepaper.downvotes).to.equal(1);
          expect(whitepaper.upvotes).to.equal(0);
        });
      });

      context("When a user changes their vote", function () {
        it("🔄 Should allow changing from an upvote to a downvote, adjusting counts correctly", async function () {
          // Setup: addr1 first casts an upvote
          await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Upvote);

          // Action: addr1 changes their vote to a downvote
          await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Downvote);

          const whitepaper = await whitepaperCenter.whitepapers(whitepaperId);
          expect(whitepaper.upvotes).to.equal(0);
          expect(whitepaper.downvotes).to.equal(1);
        });

        it("🔄 Should allow changing from a downvote to an upvote, adjusting counts correctly", async function () {
          // Setup: addr1 first casts a downvote
          await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Downvote);

          // Action: addr1 changes their vote to an upvote
          await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Upvote);

          const whitepaper = await whitepaperCenter.whitepapers(whitepaperId);
          expect(whitepaper.upvotes).to.equal(1);
          expect(whitepaper.downvotes).to.equal(0);
        });
      });

      context("Failure scenarios (reverts)", function () {
        it("❌ Should revert when trying to vote on non-existent whitepaper", async function () {
          const nonExistentId = 999;
          await expect(whitepaperCenter.connect(addr1).vote(nonExistentId, VOTE_TYPE.Upvote)).to.be.revertedWith(
            "Whitepaper ID does not exist"
          );
        });

        it("❌ Should revert if the vote type is invalid (e.g., None)", async function () {
          await expect(whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.None)).to.be.revertedWith(
            "Invalid vote type"
          );
        });
      });
    });

    // --- Tests for the hasMoreUpvotes() function ---
    describe("hasMoreUpvotes()", function () {
      // This function's tests do not need changes as its external behavior is the same.
      it("👍 Should return 'true' when upvotes are greater than downvotes", async function () {
        // Setup: Two upvotes
        await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Upvote);
        await whitepaperCenter.connect(addr2).vote(whitepaperId, VOTE_TYPE.Upvote);

        expect(await whitepaperCenter.hasMoreUpvotes(whitepaperId)).to.be.true;
      });

      it("👎 Should return 'false' when downvotes are greater than upvotes", async function () {
        // Setup: one downvote
        await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Downvote);

        expect(await whitepaperCenter.hasMoreUpvotes(whitepaperId)).to.be.false;
      });

      it("🤝 Should return 'false' when upvotes and downvotes are equal", async function () {
        // Setup: one upvote and one downvote
        await whitepaperCenter.connect(addr1).vote(whitepaperId, VOTE_TYPE.Upvote);
        await whitepaperCenter.connect(addr2).vote(whitepaperId, VOTE_TYPE.Downvote);

        expect(await whitepaperCenter.hasMoreUpvotes(whitepaperId)).to.be.false;
      });

      it("❌ Should revert when checking non-existent whitepaper", async function () {
        const nonExistentId = 999;
        await expect(whitepaperCenter.hasMoreUpvotes(nonExistentId)).to.be.revertedWith(
          "Whitepaper ID does not exist"
        );
      });
    });
  });

  // Test group for the `getWhitepaper` functionality.
  describe("Retrieving Whitepaper", function () {
    const title = "Test Whitepaper";
    const description = "A test entry.";
    const url = "ipfs://test";
    const photo = "";

    // Before each retrieval test, we pre-populate the catalog with one entry.
    beforeEach(async function () {
      await whitepaperCenter.connect(addr1).addWhitepaper(title, description, url);
    });

    it("getWhitepaper() should return the correct whitepaper data for a valid ID", async function () {
      const whitepaper = await whitepaperCenter.getWhitepaper(1);

      expect(whitepaper.id).to.equal(1);
      expect(whitepaper.title).to.equal(title);
      expect(whitepaper.description).to.equal(description);
    });

    it("getWhitepaper() should revert for an ID of 0", async function () {
      // Trying to get whitepaper with ID 0 should fail as IDs start from 1.
      await expect(whitepaperCenter.getWhitepaper(0)).to.be.revertedWith("Whitepaper ID does not exist");
    });

    it("getWhitepaper() should revert for a non-existent ID", async function () {
      // Trying to get whitepaper with an ID that is out of bounds should fail.
      await expect(whitepaperCenter.getWhitepaper(99)).to.be.revertedWith("Whitepaper ID does not exist");
    });
  });
});
