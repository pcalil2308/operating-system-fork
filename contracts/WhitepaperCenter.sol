// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Whitepapers Center
 * @author Sintrop
 * @notice A contract for users to publish and access whitepapers or technical papers aiming to operate at Sintrop Impact Chain.
 * @dev This contract manages the storage and retrieval of whitepapers publications, each identified by a unique ID.
 */
contract WhitepaperCenter {
  // --- State Variables ---

  /// @notice A counter for the total number of whitepaper entries published in the center.
  /// @dev This variable is incremented for each new whitepaper added and serves as the unique ID for new whitepaper.
  uint256 public whitepapersCount;

  /// @notice Stores all whitepaper entries, mapped by their unique ID.
  /// @dev This mapping allows efficient retrieval of whitepaper using its `id`.
  mapping(uint256 => Whitepaper) public whitepapers;

  // --- Structs ---

  /// @notice Represents a single educational whitepaper entry within the Free Education Center.
  /// @dev Each whitepaper piece includes metadata, links to the actual whitepaper, and vote counts.
  struct Whitepaper {
    uint256 id; ///< @notice The unique identifier for this whitepaper entry.
    string title; ///< @notice The title of the paper.
    string description; ///< @notice A brief description of the paper.
    string url; ///< @notice The URL or IPFS CID pointing to the actual whitepaper resource.
  }

  // --- Events ---

  /// @notice Emitted when a new educational whitepaper entry is successfully published.
  /// @param id The unique ID assigned to the new whitepaper.
  /// @param title The title of the published whitepaper.
  /// @param publisher The address of the user who published the whitepaper.
  event WhitepaperPublished(uint256 indexed id, string title, address indexed publisher);

  // --- Public Functions ---

  /**
   * @notice Publishes a new educational whitepaper entry to the Free Education Center.
   * @dev Increments the `whitepapersCount` to generate a new unique ID, stores the whitepaper details,
   * and emits a `WhitepaperPublished` event for off-chain indexing.
   * Basic input validation is included to ensure whitepaper is not empty and respects length limits.
   * @param _title The title of the educational whitepaper. Cannot be empty and must be less than 50 characters.
   * @param _description A brief description of the whitepaper. Cannot be empty and must be less than 500 characters.
   * @param _url The URL or IPFS CID pointing to the actual whitepaper resource. Cannot be empty and must be less than 200 characters.
   */
  function addWhitepaper(
    string memory _title,
    string memory _description,
    string memory _url
  ) public {
    // Input validation for string lengths and non-empty fields.
    require(bytes(_title).length > 0 && bytes(_title).length < 50, "FEC: Title must be between 1 and 49 characters");
    require(
      bytes(_description).length > 0 && bytes(_description).length < 500,
      "FEC: Description must be between 1 and 499 characters"
    );
    require(bytes(_url).length > 0 && bytes(_url).length < 200, "FEC: URL must be between 1 and 199 characters");

    whitepapersCount++; // Increment count to get the next ID
    uint256 newId = whitepapersCount; // Use the new count as the ID

    // Store the new whitepaper entry in the mapping, initializing votes to zero.
    whitepapers[newId] = Whitepaper(newId, _title, _description, _url);

    // Emit an event to allow off-chain applications to track new whitepaper.
    emit WhitepaperPublished(newId, _title, msg.sender);
  }


  /**
   * @notice Retrieves a specific educational whitepaper entry by its ID.
   * @dev Provides a read-only interface to fetch whitepaper details.
   * Will revert if the provided `_id` does not correspond to an existing whitepaper entry.
   * @param _id The unique ID of the whitepaper to retrieve.
   * @return The `Whitepaper` struct containing all details for the requested entry.
   */
  function getWhitepaper(uint256 _id) public view returns (Whitepaper memory) {
    // Ensure the requested ID exists and is within the valid range.
    require(_id > 0 && _id <= whitepapersCount, "FEC: Whitepaper ID does not exist");
    return whitepapers[_id];
  }
}
