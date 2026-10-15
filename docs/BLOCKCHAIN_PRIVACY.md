# Blockchain Architecture & Ballot Privacy Assumptions

## 1. Executive Summary

This document explains the cryptographic privacy model, smart contract design, and trust assumptions implemented in the **Online Voting Management System with Blockchain** for the South East Asian Institute of Technology, Inc. (SEAIT).

---

## 2. Why Plaintext Ballots Are Never Placed On-Chain

A common misconception in electronic voting is that placing votes directly on a public blockchain automatically secures an election. On any public or consortium EVM blockchain:
1. **Contract storage is public:** Every variable and internal state can be read by any node or block explorer.
2. **Transaction calldata is public:** Input parameters passed into smart contract functions are visible to all network participants.
3. **Events and logs are public:** Data emitted via events can be indexed and queried by anyone.

Placing student names, School IDs, or plaintext candidate choices on a blockchain would constitute a catastrophic violation of the Philippine Data Privacy Act of 2012 (RA 10173) and destroy the constitutional guarantee of ballot secrecy.

---

## 3. Cryptographic Commitment Scheme

To ensure that submitted ballots are **tamper-evident** and **voter-verifiable** without exposing voting choices, the system implements a cryptographic commitment scheme.

### 3.1 The Low-Entropy Hazard
In a student council election, the total number of candidate combinations is finite (e.g., 2 presidential candidates × 2 vice-presidential candidates × 2 secretarial candidates = 8 possible ballot states).
If the system published a plain hash of selections:
$$\text{Commitment} = \text{SHA256}(\text{Selections})$$
An external adversary could compute the hashes of all 8 possibilities in milliseconds, compare them against on-chain transactions, and immediately deduce every student's voting choices.

### 3.2 High-Entropy Randomized Commitment
To prevent rainbow-table and dictionary attacks, each ballot generation generates 256 bits of cryptographically secure random entropy ($\text{Salt}$):

$$\text{CommitmentHash} = \text{SHA256}\Big(\text{ElectionID} \parallel \text{CanonicalSortedSelections} \parallel \text{Salt}\Big)$$

Because the salt has $2^{256}$ potential values, it is mathematically impossible for an outside observer to guess or brute-force the selections from the commitment hash alone.

---

## 4. The Smart Contract (`VotingLedger.sol`)

The `VotingLedger.sol` contract deployed on the EVM network enforces the following rules:

1. **Election Registration & States:** An election progresses through strictly guarded states:
   `NON_EXISTENT` $\rightarrow$ `REGISTERED` $\rightarrow$ `OPEN` $\rightarrow$ `CLOSED` $\rightarrow$ `FINALIZED`.
2. **Permissioned Submissions:** Only certified COMELEC officer relayer accounts can submit transactions to prevent spam and transaction griefing.
3. **Anti-Replay & Duplicate Protection:** The contract maintains two unique mapping tables:
   - `voteCommitments[electionId][commitmentHash]`
   - `receiptToCommitment[electionId][receiptReference]`
   If a duplicate commitment hash or duplicate receipt reference is submitted, the transaction reverts with custom errors (`DuplicateCommitmentHash` or `DuplicateReceiptReference`).
4. **Finalization Sealing:** When polls close, the COMELEC committee audits the results and calculates the canonical results Merkle/SHA-256 root. Finalizing the election stores this hash on-chain and prevents any further transactions.

---

## 5. Voter-Verifiable Receipts & Coercion Resistance

Upon casting a ballot, the voter receives an individualized **Verification Reference** (e.g. `SEAIT-SC-2026-8A3F9B2C`) and an HMAC integrity code.

### What the Receipt Proves:
- The voter's ballot commitment was received by the election system.
- The ballot commitment has been mined and sealed into an EVM block.
- The ballot commitment was included before the election window closed.

### What the Receipt Does NOT Contain:
- The voter's candidate selections.
- The voter's student name or school ID.

**Coercion Resistance:** By keeping the receipt receipt-free regarding candidate choices, no student can be coerced or paid to prove how they voted to a third party, fulfilling the academic requirements described in Chapter 2 (El Kafhali, 2024; Stockemer, 2024).

---

## 6. Known Limitations & Trust Assumptions

1. **Network Availability:** If the blockchain RPC is unreachable or during network reorganizations, transactions are logged in a local pending queue with an explicit `PENDING` status. The system never misrepresents an unconfirmed transaction as confirmed.
2. **Relayer Trust:** Ballots are submitted to the contract through the COMELEC backend relayer. Voters trust the server-side relayer to record the commitment accurately; independent verification allows voters to detect if their commitment was omitted.
3. **Auditability:** Independent observers can verify that the final tally matches the decrypted off-chain records and that the published result commitment hash matches the on-chain finalized root.
