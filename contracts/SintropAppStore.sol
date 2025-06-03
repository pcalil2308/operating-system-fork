// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20; 

/**
 * @title SintropAppStore v.1.0.0
 * @author Sintrop
 * @notice A decentralized appStore for listing impact smart contract applications,
 * with a focus on evaluating their socio-environmental impact.
 * @dev This contract allows users to register DApps, vote on their impact, and determine their approval status dynamically.
 */
contract SintropAppStore {
    // --- Data Types ---

    /// @notice Represents a DApp listed in the SintropAppStore.
    /// @dev Contains DApp metadata and impact voting information. The sustainability status is dynamic.
    struct DApp {
        uint256 id;                 /// @notice Unique ID of the DApp.
        address publisher;          /// @notice Wallet address that published the DApp.
        string name;                /// @notice Name of the DApp.
        string description;         /// @notice Detailed description of the DApp.
        string repositoryUrl;       /// @notice URL to the code repository (e.g., GitHub, GitLab).
        string externalLink;        /// @notice URL to the DApp's website or external interface.
        address[] contractAddresses;/// @notice List of smart contract addresses that compose the DApp.
        uint256 positiveVotes;      /// @notice Count of positive votes for socio-environmental impact.
        uint256 negativeVotes;      /// @notice Count of negative votes for socio-environmental impact.
    }

    /// @notice Represents a wallet's vote for a DApp.
    /// @dev Maps the DApp ID and wallet address to the vote type (positive/negative).
    enum VoteType {
        None,     /// @notice No vote given.
        Positive, /// @notice Positive vote for socio-environmental impact.
        Negative  /// @notice Negative vote for socio-environmental impact.
    }

    // --- State Variables ---

    /// @notice Total counter of DApps registered in the SintropAppStore.
    /// @dev Used to generate unique IDs for new DApps.
    uint256 public dAppsCount;

    /// @notice Mapping of DApp IDs to their complete information.
    mapping(uint256 => DApp) public dApps;

    /// @notice Mapping of `dAppId => voterAddress => VoteType` to track each wallet's votes.
    mapping(uint256 => mapping(address => VoteType)) public dAppVotes;

    // --- Events ---

    /// @notice Emitted when a new DApp is registered in the SintropAppStore.
    /// @param dAppId The unique ID of the registered DApp.
    /// @param name The name of the DApp.
    /// @param publisher The wallet address that registered the DApp.
    event DAppRegistered(uint256 indexed dAppId, string name, address indexed publisher);

    /// @notice Emitted when a wallet votes on a DApp.
    /// @param dAppId The ID of the DApp voted on.
    /// @param voter The address of the wallet that voted.
    /// @param voteType The type of vote (Positive or Negative).
    event DAppVoted(uint256 indexed dAppId, address indexed voter, VoteType voteType);

    // --- Functions ---

    /**
     * @notice Registers a new application (DApp) in the SintropAppStore.
     * @dev Any user can register a DApp. String fields cannot be empty and have length limits.
     * The list of contract addresses must contain at least one address.
     * @param _name Name of the application.
     * @param _description Description of the application.
     * @param _repositoryUrl URL to the code repository (e.g., GitHub, GitLab).
     * @param _externalLink URL to the DApp's website or external interface.
     * @param _contractAddresses List of smart contract addresses that compose the DApp.
     */
    function registerDApp(
        string memory _name,
        string memory _description,
        string memory _repositoryUrl,
        string memory _externalLink,
        address[] memory _contractAddresses
    ) public {
        // Input validation
        require(bytes(_name).length > 0 && bytes(_name).length <= 100, "Name must be between 1 and 100 characters.");
        require(bytes(_description).length > 0 && bytes(_description).length <= 1000, "Description must be between 1 and 1000 characters.");
        require(bytes(_repositoryUrl).length > 0 && bytes(_repositoryUrl).length <= 200, "Repository URL must be between 1 and 200 characters.");
        require(bytes(_externalLink).length > 0 && bytes(_externalLink).length <= 200, "External link must be between 1 and 200 characters.");
        require(_contractAddresses.length > 0, "Must include at least one contract address.");

        dAppsCount++;
        uint256 newDAppId = dAppsCount;

        // Create and store the new DApp
        dApps[newDAppId] = DApp({
            id: newDAppId,
            publisher: msg.sender,
            name: _name,
            description: _description,
            repositoryUrl: _repositoryUrl,
            externalLink: _externalLink,
            contractAddresses: _contractAddresses, // Copy the array of addresses
            positiveVotes: 0,
            negativeVotes: 0
        });

        emit DAppRegistered(newDAppId, _name, msg.sender);
    }

    /**
     * @notice Allows a wallet to vote positively or negatively on a DApp's socio-environmental impact.
     * @dev Each wallet can vote only once per DApp. Voting again on the same DApp with the same vote type changes nothing.
     * Voting again with a different vote type will change the vote and adjust the counts.
     * @param _dAppId The ID of the DApp to be voted on.
     * @param _voteType The type of vote: `VoteType.Positive` for impact, `VoteType.Negative` for no impact.
     */
    function voteForDApp(uint256 _dAppId, VoteType _voteType) public {
        require(_dAppId > 0 && _dAppId <= dAppsCount, "Invalid DApp ID.");
        require(_voteType == VoteType.Positive || _voteType == VoteType.Negative, "Invalid vote type.");
        
        DApp storage dappToVote = dApps[_dAppId]; // Use `storage` to modify directly

        // The `require(!dappToVote.isAudited)` check was removed, as auditing is now dynamic.

        VoteType existingVote = dAppVotes[_dAppId][msg.sender];

        // If the existing vote is different from the new vote
        if (existingVote != _voteType) {
            // Revert the previous vote, if any
            if (existingVote == VoteType.Positive) {
                dappToVote.positiveVotes--;
            } else if (existingVote == VoteType.Negative) {
                dappToVote.negativeVotes--;
            }

            // Apply the new vote
            if (_voteType == VoteType.Positive) {
                dappToVote.positiveVotes++;
            } else { // _voteType == VoteType.Negative
                dappToVote.negativeVotes++;
            }

            // Store the user's new vote
            dAppVotes[_dAppId][msg.sender] = _voteType;

            emit DAppVoted(_dAppId, msg.sender, _voteType);
        }
    }

    /**
     * @notice Dynamically checks if a DApp is considered sustainable based on its votes.
     * @dev A DApp is considered sustainable if it has more positive votes than negative votes.
     * This is a `view` function and does not modify the contract's state.
     * @param _dAppId The ID of the DApp to be checked.
     * @return bool True if the DApp is considered sustainable, false otherwise.
     */
    function isDAppSustainable(uint256 _dAppId) public view returns (bool) {
        require(_dAppId > 0 && _dAppId <= dAppsCount, "Invalid DApp ID.");
        
        DApp memory dapp = dApps[_dAppId]; // Use `memory` for reading in a view function

        // Sustainability logic: more positive votes than negative.
        return dapp.positiveVotes > dapp.negativeVotes;
    }
}
