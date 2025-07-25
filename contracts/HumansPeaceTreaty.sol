// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HumansPeaceTreaty
 * @dev This contract allows individuals to digitally sign a public pledge for peace
 * and to periodically prove their ongoing commitment. It acts as an immutable ledger
 * of peace commitments.
 */
contract HumansPeaceTreaty {
  // --- Custom Data Structures ---

  /**
   * @dev Holds the data for each signatory.
   * It tracks both the initial pledge and the last time commitment was proven.
   */
  struct Signature {
    bool hasSigned; // True if the address has made the initial pledge.
    uint256 lastProofBlock; // The block number of the last commitment proof.
  }

  // --- Events ---

  /**
   * @dev Emitted when a new address signs the peace pledge.
   * @param signer The address of the individual who signed.
   * @param blockNumber The block number when the pledge was made.
   */
  event PledgeSigned(address indexed signer, uint256 blockNumber);

  /**
   * @dev Emitted when a signatory proves their ongoing commitment.
   * @param prover The address of the individual proving their commitment.
   * @param blockNumber The block number of the proof.
   */
  event CommitmentProven(address indexed prover, uint256 blockNumber);

  // --- State Variables ---

  /**
   * @dev A public mapping from an address to their Signature data.
   */
  mapping(address => Signature) private pledges;

  /**
   * @dev A public counter for the total number of unique addresses that
   * have signed the peace pledge.
   */
  uint256 public totalSignatures;

  // --- Functions ---

  /**
   * @notice By calling this function, you are making a solemn, public, and permanent declaration.
   * This action on the blockchain signifies your personal commitment to a universal peace treaty.
   *
   * THE PLEDGE:
   * "I hereby commit myself to the principles of peace and non-violence. I recognize the
   * inherent dignity and worth of every individual, regardless of origin, belief, or
   * status. With the exception of defending myself or others from imminent harm, I pledge
   * to abstain from physical violence, theft, and any act intended to kill or make harm to
   * another human being."
   *
   * @dev This function sets the caller's `hasSigned` status to true and initializes
   * their `lastProofBlock` to the current block number. It can only be called once per address.
   */
  function signPeacePledge() external {
    // Requirement: The caller must not have already signed the pledge.
    require(!pledges[msg.sender].hasSigned, "HumansPeaceTreaty: You have already signed this pledge.");

    // State change: Record the new signature.
    // The act of signing is itself the first proof of commitment.
    pledges[msg.sender] = Signature({ hasSigned: true, lastProofBlock: block.number });

    // State change: Increment the total number of signatures.
    totalSignatures++;

    // Emit an event to log this action.
    emit PledgeSigned(msg.sender, block.number);
  }

  /**
   * @notice Call this function to reaffirm your pledge. This updates your public record
   * to show a recent, on-chain proof of your ongoing commitment.
   * @dev This function can only be called by addresses that have already signed the pledge.
   * It updates the `lastProofBlock` for the `msg.sender` to the current block number.
   */
  function proveCommitment() external {
    // Requirement: The caller must have signed the pledge before they can prove it.
    require(
      pledges[msg.sender].hasSigned,
      "HumansPeaceTreaty: You must sign the pledge first before proving commitment."
    );

    // State change: Update the last proof block to the current block.
    pledges[msg.sender].lastProofBlock = block.number;

    // Emit an event to log this reaffirmation.
    emit CommitmentProven(msg.sender, block.number);
  }

  /**
   * @notice A simple way to check if an address has signed the initial pledge.
   * @param account The address you want to check.
   * @return A boolean value: 'true' if the address has signed, 'false' otherwise.
   */
  function hasSigned(address account) external view returns (bool) {
    // Returns the 'hasSigned' flag from the account's Signature struct.
    return pledges[account].hasSigned;
  }
}
