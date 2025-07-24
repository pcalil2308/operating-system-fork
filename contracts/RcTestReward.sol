// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RcTestReward
 * @dev This contract provides a mechanism for recording contributions from
 * testers during a specific test event of the Regeneration Credit.
 * Each tester can submit a single audit report containing their results.
 */
contract RcTestReward {

    // --- Custom Data Structures ---

    /**
     * @dev Encapsulates all data related to a single tester's submission.
     * Each submission functions as an individual audit report.
     */
    struct AuditReport {
        uint256 transactionCount; // The number of transactions reported by the tester.
        string description;       // A descriptive summary of the tests performed.
        string reportHash;        // A hash pointer (e.g., IPFS) to detailed evidence.
        address tester;           // The address of the tester who submitted the report.
        uint256 blockNumber;      // The block number at the time of submission.
    }


    // --- State Variables ---

    /// @dev The fixed reward multiplier for each validated transaction.
    uint256 public constant REWARD_PER_TRANSACTION = 100;

    /// @dev A hard cap on the number of transactions a tester can report.
    uint256 public constant MAX_TRANSACTIONS_PER_TESTER = 1000;

    /// @dev The immutable block number when the contract was deployed, marking the start of the event.
    uint256 public immutable startBlock;
    
    /// @dev The immutable block number when the testing period concludes.
    uint256 public immutable endBlock;

    /// @dev Maps a tester's address to their submitted AuditReport. Public for easy data retrieval.
    mapping(address => AuditReport) public auditReports;

    // @dev Internal mapping to enforce the one-submission-per-address rule.
    mapping(address => bool) private _hasSubmittedReport;


    // --- Constructor ---

    /**
     * @dev Initializes the contract by setting the testing period's duration in blocks.
     * The start block is set to the current block number, and the end block is calculated from it.
     * @param _durationInBlocks The number of blocks for which the testing event will be active.
     */
    constructor(uint256 _durationInBlocks) {
        startBlock = block.number;
        endBlock = block.number + _durationInBlocks;
    }


    // --- State-Changing Functions ---

    /**
     * @dev Allows a tester to submit their audit report and declare their transaction count.
     * This function enforces several preconditions:
     * 1. The call must be within the active testing period (before endBlock).
     * 2. The caller's address must not have already submitted a report.
     * 3. The transaction count must be positive and not exceed the defined maximum.
     * Upon successful execution, it creates and stores an AuditReport struct for the caller.
     * @param _transactionCount The total number of transactions being reported.
     * @param _description A summary of the testing activities or feedback.
     * @param _reportHash A hash of a file containing detailed proof.
     */
    function submitAuditReport(
        uint256 _transactionCount,
        string memory _description,
        string memory _reportHash
    ) external {
        require(block.number <= endBlock, "RcTestReward: Testing period has ended.");
        require(!_hasSubmittedReport[msg.sender], "RcTestReward: Report already submitted.");
        require(_transactionCount > 0, "RcTestReward: Transaction count must be positive.");
        require(_transactionCount <= MAX_TRANSACTIONS_PER_TESTER, "RcTestReward: Transaction count exceeds maximum limit.");

        _hasSubmittedReport[msg.sender] = true;

        auditReports[msg.sender] = AuditReport({
            transactionCount: _transactionCount,
            description: _description,
            reportHash: _reportHash,
            tester: msg.sender,
            blockNumber: block.number
        });
    }


    // --- View Functions ---

    /**
     * @dev Calculates the number of blocks remaining until the testing period ends.
     * @return The number of blocks remaining, or 0 if the period has already concluded.
     */
    function getBlocksRemaining() external view returns (uint256) {
        if (block.number >= endBlock) {
            return 0;
        }
        return endBlock - block.number;
    }

    /**
     * @dev Calculates the potential reward entitlement for a given tester based on their report.
     * Note: Final validation of the report is expected to occur off-chain.
     * @param _tester The address of the tester whose report is being queried.
     * @return The total reward amount based on the reported transaction count.
     */
    function getOwedTokens(address _tester) external view returns (uint256) {
        return auditReports[_tester].transactionCount * REWARD_PER_TRANSACTION;
    }
}