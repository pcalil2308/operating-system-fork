// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Free Education Center
 * @author Sintrop
 * @notice A decentralized platform for users to publish and access free educational content.
 * @dev This contract manages the storage and retrieval of content entries, each identified by a unique ID.
 * It emphasizes public access, user contribution, and a simple voting mechanism.
 */
contract FreeEducationCenter {
  // --- State Variables ---

  /// @notice A counter for the total number of content entries published in the center.
  /// @dev This variable is incremented for each new piece of content added and serves as the unique ID for new content.
  uint256 public contentsCount;

  /// @notice Stores all content entries, mapped by their unique ID.
  /// @dev This mapping allows efficient retrieval of content using its `id`.
  mapping(uint256 => Content) public contents;

  /// @notice Tracks the vote cast by each user for each piece of content.
  /// @dev Maps a content ID to another mapping from a user address to their vote type.
  mapping(uint256 => mapping(address => VoteType)) public userVotes;

  // --- Enums ---

  /// @notice Represents the type of vote a user can cast: no vote, a positive vote (Upvote), or a negative vote (Downvote).
  enum VoteType {
    None,
    Upvote,
    Downvote
  }

  // --- Structs ---

  /// @notice Represents a single educational content entry within the Free Education Center.
  /// @dev Each content piece includes metadata, links to the actual content, and vote counts.
  struct Content {
    uint256 id; ///< @notice The unique identifier for this content entry.
    string title; ///< @notice The title of the educational content.
    string description; ///< @notice A brief description of the content.
    string url; ///< @notice The URL or IPFS CID pointing to the actual content resource.
    string photo; ///< @notice The URL or IPFS CID for a representative image or thumbnail.
    uint256 upvotes; ///< @notice The total count of positive votes (upvotes).
    uint256 downvotes; ///< @notice The total count of negative votes (downvotes).
  }

  // --- Events ---

  /// @notice Emitted when a new educational content entry is successfully published.
  /// @param id The unique ID assigned to the new content.
  /// @param title The title of the published content.
  /// @param publisher The address of the user who published the content.
  event ContentPublished(uint256 indexed id, string title, address indexed publisher);

  /// @notice Emitted when a user casts or changes their vote on a piece of content.
  /// @param contentId The ID of the content that was voted on.
  /// @param voter The address of the user who voted.
  /// @param voteType The type of vote cast (Upvote or Downvote).
  event Voted(uint256 indexed contentId, address indexed voter, VoteType voteType);

  // --- Public Functions ---

  /**
   * @notice Publishes a new educational content entry to the Free Education Center.
   * @dev Increments the `contentsCount` to generate a new unique ID, stores the content details,
   * and emits a `ContentPublished` event for off-chain indexing.
   * Basic input validation is included to ensure content is not empty and respects length limits.
   * @param _title The title of the educational content. Cannot be empty and must be less than 50 characters.
   * @param _description A brief description of the content. Cannot be empty and must be less than 500 characters.
   * @param _url The URL or IPFS CID pointing to the actual content resource. Cannot be empty and must be less than 200 characters.
   * @param _photo The URL or IPFS CID for a representative image or thumbnail. Can be empty and must be less than 200 characters if provided.
   */
  function addContent(
    string memory _title,
    string memory _description,
    string memory _url,
    string memory _photo
  ) public {
    // Input validation for string lengths and non-empty fields.
    require(bytes(_title).length > 0 && bytes(_title).length < 50, "FEC: Title must be between 1 and 49 characters");
    require(
      bytes(_description).length > 0 && bytes(_description).length < 500,
      "FEC: Description must be between 1 and 499 characters"
    );
    require(bytes(_url).length > 0 && bytes(_url).length < 200, "FEC: URL must be between 1 and 199 characters");
    // _photo can be empty, but if not empty, it must respect the length limit.
    require(bytes(_photo).length < 200, "FEC: Photo URL must be less than 199 characters");

    contentsCount++; // Increment count to get the next ID
    uint256 newId = contentsCount; // Use the new count as the ID

    // Store the new content entry in the mapping, initializing votes to zero.
    contents[newId] = Content(newId, _title, _description, _url, _photo, 0, 0);

    // Emit an event to allow off-chain applications to track new content.
    emit ContentPublished(newId, _title, msg.sender);
  }

  /**
   * @notice Casts a vote on a piece of content. A user can change their vote.
   * @dev If a user votes again with a different type, the old vote is removed and the new one is applied.
   * Voting with the same type again has no effect.
   * @param _id The unique ID of the content to vote on.
   * @param _voteType The type of vote: `VoteType.Upvote` or `VoteType.Downvote`.
   */
  function vote(uint256 _id, VoteType _voteType) public {
    require(_id > 0 && _id <= contentsCount, "FEC: Content ID does not exist");
    require(_voteType == VoteType.Upvote || _voteType == VoteType.Downvote, "FEC: Invalid vote type");

    Content storage contentToVote = contents[_id];
    VoteType existingVote = userVotes[_id][msg.sender];

    // Proceed only if the new vote is different from the existing one.
    if (existingVote != _voteType) {
      // Revert the previous vote count, if any.
      if (existingVote == VoteType.Upvote) {
        contentToVote.upvotes--;
      } else if (existingVote == VoteType.Downvote) {
        contentToVote.downvotes--;
      }

      // Apply the new vote count.
      if (_voteType == VoteType.Upvote) {
        contentToVote.upvotes++;
      } else {
        // _voteType == VoteType.Downvote
        contentToVote.downvotes++;
      }

      // Store the user's new vote and emit the event.
      userVotes[_id][msg.sender] = _voteType;
      emit Voted(_id, msg.sender, _voteType);
    }
  }

  /**
   * @notice Checks if a piece of content has more positive votes than negative votes.
   * @param _id The unique ID of the content to check.
   * @return bool True if upvotes are strictly greater than downvotes, false otherwise.
   */
  function hasMoreUpvotes(uint256 _id) public view returns (bool) {
    require(_id > 0 && _id <= contentsCount, "FEC: Content ID does not exist");
    return contents[_id].upvotes > contents[_id].downvotes;
  }

  /**
   * @notice Retrieves a specific educational content entry by its ID.
   * @dev Provides a read-only interface to fetch content details.
   * Will revert if the provided `_id` does not correspond to an existing content entry.
   * @param _id The unique ID of the content to retrieve.
   * @return Content The `Content` struct containing all details for the requested entry.
   */
  function getContent(uint256 _id) public view returns (Content memory) {
    // Ensure the requested ID exists and is within the valid range.
    require(_id > 0 && _id <= contentsCount, "FEC: Content ID does not exist");
    return contents[_id];
  }
}
