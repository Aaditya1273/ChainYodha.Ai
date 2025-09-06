//! TrustGrid.AI Oracle Contract (Stylus/Rust)
//! 
//! A gas-efficient contract that stores signed TrustScore updates from the backend oracle
//! and allows dApps to query wallet trust scores publicly.

#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use stylus_sdk::{
    alloy_primitives::{Address, U256, FixedBytes},
    alloy_sol_types::sol,
    call::Call,
    evm, msg,
    prelude::*,
};
use alloc::{vec::Vec, string::String};

// Define the TrustScore structure
sol! {
    struct TrustScore {
        uint16 score;        // Score from 0-100
        uint32 timestamp;    // Unix timestamp
        bytes32 source;      // Source identifier
        bytes32 metadataHash; // Hash of explanation metadata
    }

    event ScoreUpdated(
        address indexed wallet,
        uint16 score,
        uint32 timestamp,
        bytes32 source,
        bytes32 metadataHash
    );

    event OracleUpdated(
        address indexed oldOracle,
        address indexed newOracle
    );

    error InvalidSignature();
    error UnauthorizedOracle();
    error InvalidScore();
    error StaleTimestamp();
}

// Contract storage
sol_storage! {
    #[entrypoint]
    pub struct TrustOracle {
        /// Mapping from wallet address to their trust score
        mapping(address => TrustScore) public trust_scores;
        
        /// The authorized oracle address that can update scores
        address public oracle_address;
        
        /// Contract owner (can update oracle address)
        address public owner;
        
        /// Minimum score threshold for isTrusted function
        uint16 public trust_threshold;
        
        /// Nonce mapping to prevent replay attacks
        mapping(address => uint256) public nonces;
    }
}

#[external]
impl TrustOracle {
    /// Initialize the contract with oracle address and trust threshold
    pub fn init(&mut self, oracle_address: Address, trust_threshold: u16) -> Result<(), Vec<u8>> {
        // Only allow initialization once
        if self.owner.get() != Address::ZERO {
            return Err(b"Already initialized".to_vec());
        }
        
        self.owner.set(msg::sender());
        self.oracle_address.set(oracle_address);
        self.trust_threshold.set(trust_threshold);
        
        Ok(())
    }

    /// Update a wallet's trust score with signature verification
    /// @param wallet The wallet address to update
    /// @param score The trust score (0-100)
    /// @param timestamp Unix timestamp of the score computation
    /// @param metadata_hash Hash of the explanation metadata
    /// @param signature ECDSA signature from the authorized oracle
    pub fn update_score(
        &mut self,
        wallet: Address,
        score: u16,
        timestamp: u32,
        source: FixedBytes<32>,
        metadata_hash: FixedBytes<32>,
        signature: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        // Validate score range
        if score > 100 {
            return Err(b"Invalid score range".to_vec());
        }

        // Check timestamp is not stale (within 1 hour)
        let current_time = evm::block_timestamp();
        if timestamp > current_time || current_time - timestamp > 3600 {
            return Err(b"Stale timestamp".to_vec());
        }

        // Get current nonce for replay protection
        let nonce = self.nonces.get(wallet);
        
        // Create message hash for signature verification
        let message_hash = self.create_message_hash(wallet, score, timestamp, source, metadata_hash, nonce);
        
        // Verify signature
        if !self.verify_signature(message_hash, signature)? {
            return Err(b"Invalid signature".to_vec());
        }

        // Update the trust score
        let trust_score = TrustScore {
            score,
            timestamp,
            source,
            metadataHash: metadata_hash,
        };
        
        self.trust_scores.setter(wallet).set(trust_score);
        
        // Increment nonce to prevent replay
        self.nonces.setter(wallet).set(nonce + U256::from(1));

        // Emit event
        evm::log(ScoreUpdated {
            wallet,
            score,
            timestamp,
            source,
            metadataHash: metadata_hash,
        });

        Ok(())
    }

    /// Get trust score for a wallet
    /// @param wallet The wallet address to query
    /// @return The trust score struct
    pub fn get_trust_score(&self, wallet: Address) -> TrustScore {
        self.trust_scores.get(wallet)
    }

    /// Check if a wallet is trusted (score >= threshold)
    /// @param wallet The wallet address to check
    /// @return True if wallet is trusted
    pub fn is_trusted(&self, wallet: Address) -> bool {
        let score = self.trust_scores.get(wallet).score;
        score >= self.trust_threshold.get()
    }

    /// Get the current trust threshold
    pub fn get_trust_threshold(&self) -> u16 {
        self.trust_threshold.get()
    }

    /// Update the oracle address (owner only)
    /// @param new_oracle The new oracle address
    pub fn update_oracle(&mut self, new_oracle: Address) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Only owner can update oracle".to_vec());
        }

        let old_oracle = self.oracle_address.get();
        self.oracle_address.set(new_oracle);

        evm::log(OracleUpdated {
            oldOracle: old_oracle,
            newOracle: new_oracle,
        });

        Ok(())
    }

    /// Update trust threshold (owner only)
    /// @param new_threshold The new trust threshold
    pub fn update_trust_threshold(&mut self, new_threshold: u16) -> Result<(), Vec<u8>> {
        if msg::sender() != self.owner.get() {
            return Err(b"Only owner can update threshold".to_vec());
        }

        if new_threshold > 100 {
            return Err(b"Invalid threshold".to_vec());
        }

        self.trust_threshold.set(new_threshold);
        Ok(())
    }
}

impl TrustOracle {
    /// Create message hash for signature verification
    fn create_message_hash(
        &self,
        wallet: Address,
        score: u16,
        timestamp: u32,
        source: FixedBytes<32>,
        metadata_hash: FixedBytes<32>,
        nonce: U256,
    ) -> FixedBytes<32> {
        use stylus_sdk::crypto::keccak;
        
        // Create packed message for signing
        let mut message = Vec::new();
        message.extend_from_slice(wallet.as_slice());
        message.extend_from_slice(&score.to_be_bytes());
        message.extend_from_slice(&timestamp.to_be_bytes());
        message.extend_from_slice(source.as_slice());
        message.extend_from_slice(metadata_hash.as_slice());
        message.extend_from_slice(&nonce.to_be_bytes::<32>());
        
        keccak(message)
    }

    /// Verify ECDSA signature
    fn verify_signature(&self, message_hash: FixedBytes<32>, signature: Vec<u8>) -> Result<bool, Vec<u8>> {
        if signature.len() != 65 {
            return Ok(false);
        }

        // Extract r, s, v from signature
        let mut r = [0u8; 32];
        let mut s = [0u8; 32];
        r.copy_from_slice(&signature[0..32]);
        s.copy_from_slice(&signature[32..64]);
        let v = signature[64];

        // Recover public key and verify against oracle address
        match stylus_sdk::crypto::ecrecover(message_hash, v, FixedBytes::from(r), FixedBytes::from(s)) {
            Ok(recovered_address) => Ok(recovered_address == self.oracle_address.get()),
            Err(_) => Ok(false),
        }
    }
}
