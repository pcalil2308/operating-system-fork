// Import the tools we need from Chai (for assertions) and Hardhat/Ethers.
const { expect } = require("chai");
const { ethers } = require("hardhat");

// The main `describe` block groups all tests for the "GlobalPlantCatalog" contract.
describe("GlobalPlantCatalog", function () {
  // Declare variables that we will use across multiple tests.
  let PlantCatalog;
  let plantCatalog;
  let owner, addr1, addr2;

  // `beforeEach` runs before EACH `it()` test.
  // This is the perfect place to deploy the contract, ensuring a clean state.
  beforeEach(async function () {
    // Get the test accounts provided by Hardhat.
    [owner, addr1, addr2] = await ethers.getSigners();

    // Get the contract factory.
    PlantCatalog = await ethers.getContractFactory("GlobalPlantCatalog");
    // Deploy a new contract instance before each test.
    plantCatalog = await PlantCatalog.deploy();
    await plantCatalog.waitForDeployment();
  });

  // A group of tests to check the initial state of the contract after deployment.
  describe("Deployment", function () {
    it("Should set the nextPlantId to 0 initially", async function () {
      // The initial count of plants should be zero.
      expect(await plantCatalog.getTotalPlantsCount()).to.equal(0);
      expect(await plantCatalog.nextPlantId()).to.equal(0);
    });
  });

  // A group of tests focused on the `addPlant` functionality.
  describe("Adding Plants", function () {
    it("Should allow a user to add a new plant and emit an event", async function () {
      // Define sample data for a new plant.
      const popularName = "Pau-Brasil";
      const scientificName = "Paubrasilia echinata";
      const taxonomy = "Fabaceae";
      const description = "A Brazilian timber tree.";
      const photoHash = "ipfs://hash1";

      // We expect the transaction to EMIT the `PlantAdded` event with correct arguments.
      // The `anyValue` from Chai is useful for checking `block.timestamp` without knowing the exact value.
      await expect(plantCatalog.addPlant(popularName, scientificName, taxonomy, description, photoHash))
        .to.emit(plantCatalog, "PlantAdded")
        .withArgs(0, owner.address, popularName, scientificName, (value) => {
          // We can add a custom check for the timestamp if needed
          expect(value).to.be.above(0);
          return true;
        });

      // Check if the total plant count has been updated.
      expect(await plantCatalog.getTotalPlantsCount()).to.equal(1);

      // Retrieve the newly added plant to verify its data.
      const newPlant = await plantCatalog.getPlant(0);
      expect(newPlant.id).to.equal(0);
      expect(newPlant.creator).to.equal(owner.address);
      expect(newPlant.popularName).to.equal(popularName);
      expect(newPlant.photoHash).to.equal(photoHash);
    });

    it("Should correctly assign IDs and creators for multiple plants from different users", async function () {
      // addr1 adds the first plant (ID 0)
      await plantCatalog.connect(addr1).addPlant("Jatobá", "Hymenaea courbaril", "Fabaceae", "...", "...");

      // addr2 adds the second plant (ID 1)
      await plantCatalog.connect(addr2).addPlant("Ipê Amarelo", "Handroanthus albus", "Bignoniaceae", "...", "...");

      expect(await plantCatalog.getTotalPlantsCount()).to.equal(2);

      const plant1 = await plantCatalog.getPlant(0);
      const plant2 = await plantCatalog.getPlant(1);

      // Verify creators are correct.
      expect(plant1.creator).to.equal(addr1.address);
      expect(plant2.creator).to.equal(addr2.address);
    });
  });

  // A group of tests for the various `get` functions.
  describe("Retrieving Plant Data", function () {
    // Before each retrieval test, we pre-populate the catalog with some data.
    beforeEach(async function () {
      // addr1 adds plant with ID 0
      await plantCatalog.connect(addr1).addPlant("Plant A", "A scientia", "...", "...", "...");
      // addr2 adds plant with ID 1
      await plantCatalog.connect(addr2).addPlant("Plant B", "B scientia", "...", "...", "...");
      // addr1 adds another plant with ID 2
      await plantCatalog.connect(addr1).addPlant("Plant C", "C scientia", "...", "...", "...");
    });

    it("getPlant() should return the correct plant data", async function () {
      const plantB = await plantCatalog.getPlant(1);
      expect(plantB.popularName).to.equal("Plant B");
      expect(plantB.creator).to.equal(addr2.address);
    });

    it("getPlant() should revert for a non-existent plant ID", async function () {
      // Trying to get a plant with ID 99 (which doesn't exist) should fail.
      await expect(plantCatalog.getPlant(99)).to.be.revertedWith("Plant ID does not exist");
    });

    it("getPlantsByCreator() should return the correct list of plant IDs for each creator", async function () {
      // Get plants for addr1
      const addr1Plants = await plantCatalog.getPlantsByCreator(addr1.address);
      const addr1IdsAsNumbers = addr1Plants.map((id) => Number(id));
      expect(addr1IdsAsNumbers).to.deep.equal([0, 2]);

      // Get plants for addr2
      const addr2Plants = await plantCatalog.getPlantsByCreator(addr2.address);
      const addr2IdsAsNumbers = addr2Plants.map((id) => Number(id));
      expect(addr2IdsAsNumbers).to.deep.equal([1]);

      // Get plants for owner (who created none)
      const ownerPlants = await plantCatalog.getPlantsByCreator(owner.address);
      expect(ownerPlants).to.deep.equal([]);
    });
  });

  // Test suite for the Voting functionality
  describe("Voting", function () {
    let globalPlantCatalog;
    let owner, addr1, addr2;
    const plantId = 0; // ID of the first plant, since IDs start at 0

    // Enum values mimicking the contract's VoteType
    const VOTE_TYPE = {
      None: 0,
      Upvote: 1,
      Downvote: 2,
    };

    // Hook to run before each test in this suite
    beforeEach(async function () {
      const GlobalPlantCatalog = await ethers.getContractFactory("GlobalPlantCatalog");
      [owner, addr1, addr2] = await ethers.getSigners();
      globalPlantCatalog = await GlobalPlantCatalog.deploy();

      // Add a sample plant so we can vote on it
      await globalPlantCatalog
        .connect(owner)
        .addPlant(
          "Rosewood",
          "Cariniana legalis",
          "Family: Lecythidaceae",
          "A large tree native to Brazil.",
          "ipfs://somehash"
        );
    });

    // --- Tests for the vote() function ---
    describe("vote()", function () {
      context("When a user casts a new vote", function () {
        it("✅ Should allow an upvote and increment the upvotes count", async function () {
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote);

          const plant = await globalPlantCatalog.plants(plantId);
          expect(plant.upvotes).to.equal(1);
          expect(plant.downvotes).to.equal(0);
        });

        it("✅ Should allow a downvote and increment the downvotes count", async function () {
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Downvote);

          const plant = await globalPlantCatalog.plants(plantId);
          expect(plant.downvotes).to.equal(1);
          expect(plant.upvotes).to.equal(0);
        });

        it("📣 Should emit a 'Voted' event when a new vote is cast", async function () {
          await expect(globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote))
            .to.emit(globalPlantCatalog, "Voted")
            .withArgs(plantId, addr1.address, VOTE_TYPE.Upvote);
        });
      });

      context("When a user changes their vote", function () {
        it("🔄 Should allow changing from an upvote to a downvote, adjusting counts", async function () {
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote);
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Downvote);

          const plant = await globalPlantCatalog.plants(plantId);
          expect(plant.upvotes).to.equal(0);
          expect(plant.downvotes).to.equal(1);
        });

        it("🔄 Should allow changing from a downvote to an upvote, adjusting counts", async function () {
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Downvote);
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote);

          const plant = await globalPlantCatalog.plants(plantId);
          expect(plant.upvotes).to.equal(1);
          expect(plant.downvotes).to.equal(0);
        });
      });

      context("When a user casts the same vote again", function () {
        it("⚖️ Should not change state or emit an event", async function () {
          await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote);
          const plantBefore = await globalPlantCatalog.plants(plantId);

          await expect(globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote)).to.not.emit(
            globalPlantCatalog,
            "Voted"
          );

          const plantAfter = await globalPlantCatalog.plants(plantId);
          expect(plantAfter.upvotes).to.equal(plantBefore.upvotes);
          expect(plantAfter.downvotes).to.equal(plantBefore.downvotes);
        });
      });

      context("Failure scenarios (reverts)", function () {
        it("❌ Should revert when trying to vote on a non-existent plant", async function () {
          const nonExistentId = 999;
          await expect(globalPlantCatalog.connect(addr1).vote(nonExistentId, VOTE_TYPE.Upvote)).to.be.revertedWith(
            "GPC: Plant ID does not exist"
          );
        });

        it("❌ Should revert if the vote type is invalid (e.g., None)", async function () {
          await expect(globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.None)).to.be.revertedWith(
            "GPC: Invalid vote type"
          );
        });
      });
    });

    // --- Tests for the hasMoreUpvotes() function ---
    describe("hasMoreUpvotes()", function () {
      it("👍 Should return 'true' when upvotes are greater than downvotes", async function () {
        await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote);
        await globalPlantCatalog.connect(addr2).vote(plantId, VOTE_TYPE.Upvote);

        expect(await globalPlantCatalog.hasMoreUpvotes(plantId)).to.be.true;
      });

      it("👎 Should return 'false' when downvotes are greater than upvotes", async function () {
        await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Downvote);

        expect(await globalPlantCatalog.hasMoreUpvotes(plantId)).to.be.false;
      });

      it("🤝 Should return 'false' when upvotes and downvotes are equal", async function () {
        await globalPlantCatalog.connect(addr1).vote(plantId, VOTE_TYPE.Upvote);
        await globalPlantCatalog.connect(addr2).vote(plantId, VOTE_TYPE.Downvote);

        expect(await globalPlantCatalog.hasMoreUpvotes(plantId)).to.be.false;
      });

      it("❌ Should revert when checking a non-existent plant", async function () {
        const nonExistentId = 999;
        await expect(globalPlantCatalog.hasMoreUpvotes(nonExistentId)).to.be.revertedWith(
          "GPC: Plant ID does not exist"
        );
      });
    });
  });
});
