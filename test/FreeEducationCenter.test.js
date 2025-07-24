// Import the necessary tools from Chai for assertions and from Hardhat/Ethers for contract interaction.
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Main `describe` block grouping all tests for the "FreeEducationCenter" contract.
describe("FreeEducationCenter", function () {
  // Declare variables to be used across multiple tests.
  let EducationCenter;
  let educationCenter;
  let owner, addr1;

  // `beforeEach` runs before EACH `it()` test, ensuring a clean state.
  beforeEach(async function () {
    // Get test accounts provided by Hardhat.
    [owner, addr1] = await ethers.getSigners();

    // Get the contract factory.
    EducationCenter = await ethers.getContractFactory("FreeEducationCenter");
    // Deploy a new contract instance.
    educationCenter = await EducationCenter.deploy();
    await educationCenter.waitForDeployment();
  });

  // Test group for the initial state of the contract after deployment.
  describe("Deployment", function () {
    it("Should initialize with a contentsCount of 0", async function () {
      // The initial count of content should be zero.
      expect(await educationCenter.contentsCount()).to.equal(0);
    });
  });

  // Test group for the `addContent` functionality.
  describe("Adding Content", function () {
    it("Should allow a user to add new content with valid data", async function () {
      // Define sample data for a new content entry.
      const title = "Introduction to Solidity";
      const description = "A beginner-friendly guide to smart contract development.";
      const url = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const photo = "ipfs://bafybeiemxf5abjw2wsq5eehgpj22w3dwc6g5x4flvfc24Gf22w3dwc6g";

      // The first content ID should be 1, as the counter is incremented first.
      const expectedId = 1;

      // Expect the transaction to emit the `ContentPublished` event with the correct arguments.
      await expect(educationCenter.addContent(title, description, url, photo))
        .to.emit(educationCenter, "ContentPublished")
        .withArgs(expectedId, title, owner.address);

      // Check if the content counter has been updated.
      expect(await educationCenter.contentsCount()).to.equal(expectedId);

      // Retrieve the newly added content from the public `contents` mapping to verify its data.
      const newContent = await educationCenter.contents(expectedId);
      expect(newContent.id).to.equal(expectedId);
      expect(newContent.title).to.equal(title);
      expect(newContent.description).to.equal(description);
      expect(newContent.url).to.equal(url);
      expect(newContent.photo).to.equal(photo);
    });

    it("Should allow adding content with an empty photo URL", async function () {
      const title = "Test Title";
      const description = "Test Description";
      const url = "ipfs://some-url";
      const photo = ""; // Empty photo string

      await expect(educationCenter.addContent(title, description, url, photo))
        .to.emit(educationCenter, "ContentPublished")
        .withArgs(1, title, owner.address);

      const newContent = await educationCenter.contents(1);
      expect(newContent.photo).to.equal("");
    });

    it("Should revert if the title is empty", async function () {
      // We test a failure case: trying to add content with an empty title.
      // We expect the transaction to be reverted with the exact error message from the `require` statement.
      await expect(educationCenter.addContent("", "Description", "url", "photo")).to.be.revertedWith(
        "FEC: Title must be between 1 and 49 characters"
      );
    });

    it("Should revert if the URL is empty", async function () {
      // We test another failure case: empty URL.
      await expect(educationCenter.addContent("Title", "Description", "", "photo")).to.be.revertedWith(
        "FEC: URL must be between 1 and 199 characters"
      );
    });
  });

  // Test group for the `getContent` functionality.
  describe("Retrieving Content", function () {
    const title = "Test Content";
    const description = "A test entry.";
    const url = "ipfs://test";
    const photo = "";

    // Before each retrieval test, we pre-populate the catalog with one entry.
    beforeEach(async function () {
      await educationCenter.connect(addr1).addContent(title, description, url, photo);
    });

    it("getContent() should return the correct content data for a valid ID", async function () {
      const content = await educationCenter.getContent(1);

      expect(content.id).to.equal(1);
      expect(content.title).to.equal(title);
      expect(content.description).to.equal(description);
    });

    it("getContent() should revert for an ID of 0", async function () {
      // Trying to get content with ID 0 should fail as IDs start from 1.
      await expect(educationCenter.getContent(0)).to.be.revertedWith("FEC: Content ID does not exist");
    });

    it("getContent() should revert for a non-existent ID", async function () {
      // Trying to get content with an ID that is out of bounds should fail.
      await expect(educationCenter.getContent(99)).to.be.revertedWith("FEC: Content ID does not exist");
    });
  });

  // Test suite for the Voting functionality
  describe("Voting", function () {
    let educationCenter;
    let owner, addr1, addr2;
    const contentId = 1; // ID of the content to be used in tests

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

      const EducationCenter = await ethers.getContractFactory("FreeEducationCenter");
      educationCenter = await EducationCenter.deploy();

      // Add a sample content so we can vote on it
      await educationCenter
        .connect(owner)
        .addContent(
          "Test Title",
          "A description for the voting test.",
          "https://example.com/content",
          "https://example.com/photo"
        );
    });

    // --- Tests for the vote() function ---
    describe("vote()", function () {
      context("When a user casts a new vote", function () {
        it("✅ Should allow an upvote and increment the upvotes count", async function () {
          // Action: addr1 casts an upvote on content with ID 1
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote);

          const content = await educationCenter.contents(contentId);
          expect(content.upvotes).to.equal(1);
          expect(content.downvotes).to.equal(0);
        });

        it("✅ Should allow a downvote and increment the downvotes count", async function () {
          // Action: addr1 casts a downvote on content with ID 1
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Downvote);

          const content = await educationCenter.contents(contentId);
          expect(content.downvotes).to.equal(1);
          expect(content.upvotes).to.equal(0);
        });

        it("📣 Should emit a 'Voted' event when a new vote is cast", async function () {
          // Check for the 'Voted' event emission with the correct arguments
          await expect(educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote))
            .to.emit(educationCenter, "Voted")
            .withArgs(contentId, addr1.address, VOTE_TYPE.Upvote);
        });
      });

      context("When a user changes their vote", function () {
        it("🔄 Should allow changing from an upvote to a downvote, adjusting counts correctly", async function () {
          // Setup: addr1 first casts an upvote
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote);

          // Action: addr1 changes their vote to a downvote
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Downvote);

          const content = await educationCenter.contents(contentId);
          expect(content.upvotes).to.equal(0);
          expect(content.downvotes).to.equal(1);
        });

        it("🔄 Should allow changing from a downvote to an upvote, adjusting counts correctly", async function () {
          // Setup: addr1 first casts a downvote
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Downvote);

          // Action: addr1 changes their vote to an upvote
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote);

          const content = await educationCenter.contents(contentId);
          expect(content.upvotes).to.equal(1);
          expect(content.downvotes).to.equal(0);
        });
      });

      context("When a user casts the same vote again", function () {
        it("⚖️ Should not change state or emit an event", async function () {
          // Setup: addr1 casts an upvote
          await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote);
          const contentBefore = await educationCenter.contents(contentId);

          // Action: Attempt to upvote again and expect no event to be emitted
          await expect(educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote)).to.not.emit(
            educationCenter,
            "Voted"
          );

          const contentAfter = await educationCenter.contents(contentId);
          // Verify that vote counts have not changed
          expect(contentAfter.upvotes).to.equal(contentBefore.upvotes);
          expect(contentAfter.downvotes).to.equal(contentBefore.downvotes);
        });
      });

      context("Failure scenarios (reverts)", function () {
        it("❌ Should revert when trying to vote on non-existent content", async function () {
          const nonExistentId = 999;
          await expect(educationCenter.connect(addr1).vote(nonExistentId, VOTE_TYPE.Upvote)).to.be.revertedWith(
            "FEC: Content ID does not exist"
          );
        });

        it("❌ Should revert if the vote type is invalid (e.g., None)", async function () {
          await expect(educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.None)).to.be.revertedWith(
            "FEC: Invalid vote type"
          );
        });
      });
    });

    // --- Tests for the hasMoreUpvotes() function ---
    describe("hasMoreUpvotes()", function () {
      // This function's tests do not need changes as its external behavior is the same.
      it("👍 Should return 'true' when upvotes are greater than downvotes", async function () {
        // Setup: Two upvotes
        await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote);
        await educationCenter.connect(addr2).vote(contentId, VOTE_TYPE.Upvote);

        expect(await educationCenter.hasMoreUpvotes(contentId)).to.be.true;
      });

      it("👎 Should return 'false' when downvotes are greater than upvotes", async function () {
        // Setup: one downvote
        await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Downvote);

        expect(await educationCenter.hasMoreUpvotes(contentId)).to.be.false;
      });

      it("🤝 Should return 'false' when upvotes and downvotes are equal", async function () {
        // Setup: one upvote and one downvote
        await educationCenter.connect(addr1).vote(contentId, VOTE_TYPE.Upvote);
        await educationCenter.connect(addr2).vote(contentId, VOTE_TYPE.Downvote);

        expect(await educationCenter.hasMoreUpvotes(contentId)).to.be.false;
      });

      it("❌ Should revert when checking non-existent content", async function () {
        const nonExistentId = 999;
        await expect(educationCenter.hasMoreUpvotes(nonExistentId)).to.be.revertedWith(
          "FEC: Content ID does not exist"
        );
      });
    });
  });
});
