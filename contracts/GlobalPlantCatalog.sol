// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

/**
 * @title GlobalPlantCatalog
 * @author Sintrop
 * @notice A global and open catalog of plants and trees registered on the blockchain.
 * @dev This contract allows any user to add detailed information about plants,
 * storing it in a decentralized manner and associating it with the creator.
 * It also includes a simple voting mechanism for community feedback.
 */
contract GlobalPlantCatalog {
  // --- Enums ---

  /// @notice Represents the type of vote a user can cast: no vote, a positive vote (Upvote), or a negative vote (Downvote).
  enum VoteType {
    None,
    Upvote,
    Downvote
  }

  // --- Data Structures ---

  /**
   * @dev Structure representing a plant or tree in the catalog.
   * @param id Unique identifier of the plant.
   * @param popularName Popular name of the plant/tree.
   * @param scientificName Scientific name of the plant/tree.
   * @param taxonomy Full taxonomic classification.
   * @param description A detailed description of the plant.
   * @param photoHash An IPFS hash or URL for the plant's photos.
   * @param creator The wallet address that added this plant to the catalog.
   * @param createdAt The timestamp when the plant was added.
   * @param upvotes The total count of positive votes.
   * @param downvotes The total count of negative votes.
   */
  struct Plant {
    uint256 id;
    string popularName;
    string scientificName;
    string taxonomy;
    string description;
    string photoHash;
    address creator;
    uint256 createdAt;
    uint256 upvotes;
    uint256 downvotes;
  }

  // --- State Variables ---

  /// @notice Mapping from plant ID to the complete Plant data structure.
  mapping(uint256 => Plant) public plants;

  /// @notice Tracks the vote cast by each user for each plant.
  /// @dev Maps a plant ID to another mapping from a user address to their vote type.
  mapping(uint256 => mapping(address => VoteType)) public userVotes;

  /// @notice Mapping from creator address to an array of IDs of plants they have added.
  mapping(address => uint256[]) public creatorPlants;

  /// @notice Counter to generate unique IDs for each new plant. Also represents the total number of plants.
  uint256 public nextPlantId;

  // --- Events ---

  /**
   * @notice Emitted when a new plant is added to the catalog.
   * @param plantId The unique ID of the added plant.
   * @param creator The wallet address that added the plant.
   * @param popularName The popular name of the plant.
   * @param scientificName The scientific name of the plant.
   * @param createdAt The timestamp of the plant's creation.
   */
  event PlantAdded(
    uint256 indexed plantId,
    address indexed creator,
    string popularName,
    string scientificName,
    uint256 createdAt
  );

  /**
   * @notice Emitted when a user casts or changes their vote on a plant.
   * @param plantId The ID of the plant that was voted on.
   * @param voter The address of the user who voted.
   * @param voteType The type of vote cast (Upvote or Downvote).
   */
  event Voted(uint256 indexed plantId, address indexed voter, VoteType voteType);

  // --- Functions ---

  /**
   * @notice Adds a new plant or tree to the global catalog.
   * @dev Plant IDs are automatically incremented starting from 0.
   * @param _popularName The popular name of the plant.
   * @param _scientificName The scientific name of the plant.
   * @param _taxonomy The taxonomic classification.
   * @param _description A description or additional information.
   * @param _photoHash An IPFS hash or URL for the photos.
   */
  function addPlant(
    string memory _popularName,
    string memory _scientificName,
    string memory _taxonomy,
    string memory _description,
    string calldata _photoHash
  ) public {
    uint256 currentId = nextPlantId;

    // Create and store the new Plant struct, initializing votes to zero
    plants[currentId] = Plant(
      currentId,
      _popularName,
      _scientificName,
      _taxonomy,
      _description,
      _photoHash,
      msg.sender,
      block.number,
      0, // upvotes
      0 // downvotes
    );

    creatorPlants[msg.sender].push(currentId);
    nextPlantId++;
    emit PlantAdded(currentId, msg.sender, _popularName, _scientificName, block.number);
  }

  /**
   * @notice Casts a vote on a plant. A user can change their vote.
   * @dev Updates vote counts based on the user's previous vote.
   * @param _plantId The unique ID of the plant to vote on.
   * @param _isUpvote True for a positive vote (upvote), false for a negative vote (downvote).
   */
  function vote(uint256 _plantId, bool _isUpvote) public {
    require(_plantId < nextPlantId, "GPC: Plant ID does not exist");

    Plant storage plantToVote = plants[_plantId];
    VoteType previousVote = userVotes[_plantId][msg.sender];
    VoteType newVote = _isUpvote ? VoteType.Upvote : VoteType.Downvote;

    require(previousVote != newVote, "GPC: You have already cast this vote");

    if (previousVote == VoteType.Downvote && newVote == VoteType.Upvote) {
      plantToVote.downvotes--;
      plantToVote.upvotes++;
    } else if (previousVote == VoteType.Upvote && newVote == VoteType.Downvote) {
      plantToVote.upvotes--;
      plantToVote.downvotes++;
    } else if (previousVote == VoteType.None) {
      if (newVote == VoteType.Upvote) {
        plantToVote.upvotes++;
      } else {
        plantToVote.downvotes++;
      }
    }

    userVotes[_plantId][msg.sender] = newVote;
    emit Voted(_plantId, msg.sender, newVote);
  }

  /**
   * @notice Checks if a plant has more positive votes than negative votes.
   * @param _plantId The unique ID of the plant to check.
   * @return bool True if upvotes are strictly greater than downvotes, false otherwise.
   */
  function hasMoreUpvotes(uint256 _plantId) public view returns (bool) {
    require(_plantId < nextPlantId, "GPC: Plant ID does not exist");
    return plants[_plantId].upvotes > plants[_plantId].downvotes;
  }

  function getPlant(uint256 _plantId) public view returns (Plant memory) {
    require(_plantId < nextPlantId, "Plant ID does not exist");
    return plants[_plantId];
  }

  function getTotalPlantsCount() public view returns (uint256) {
    return nextPlantId;
  }

  function getPlantsByCreator(address _creator) public view returns (uint256[] memory) {
    return creatorPlants[_creator];
  }
}
