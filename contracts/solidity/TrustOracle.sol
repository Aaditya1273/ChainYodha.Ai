// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title TrustOracle
 * @dev Solidity implementation of TrustGrid.AI Oracle Contract
 * 
 * A gas-efficient contract that stores signed TrustScore updates from the backend oracle
 * and allows dApps to query wallet trust scores publicly.
 */
contract TrustOracle is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @dev TrustScore structure
    struct TrustScore {
        uint16 score;           // Score from 0-100
        uint32 timestamp;       // Unix timestamp
        bytes32 source;         // Source identifier
        bytes32 metadataHash;   // Hash of explanation metadata
    }

    /// @dev Mapping from wallet address to their trust score
    mapping(address => TrustScore) public trustScores;
    
    /// @dev The authorized oracle address that can update scores
    address public oracleAddress;
    
    /// @dev Minimum score threshold for isTrusted function
    uint16 public trustThreshold;
    
    /// @dev Nonce mapping to prevent replay attacks
    mapping(address => uint256) public nonces;

    /// @dev Events
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

    event TrustThresholdUpdated(
        uint16 oldThreshold,
        uint16 newThreshold
    );

    /// @dev Custom errors
    error InvalidSignature();
    error UnauthorizedOracle();
    error InvalidScore();
    error StaleTimestamp();
    error InvalidThreshold();

    /**
     * @dev Constructor
     * @param _oracleAddress The authorized oracle address
     * @param _trustThreshold The minimum score threshold for trust
     */
    constructor(
        address _oracleAddress,
        uint16 _trustThreshold
    ) Ownable(msg.sender) {
        if (_trustThreshold > 100) revert InvalidThreshold();
        
        oracleAddress = _oracleAddress;
        trustThreshold = _trustThreshold;
    }

    /**
     * @dev Update a wallet's trust score with signature verification
     * @param wallet The wallet address to update
     * @param score The trust score (0-100)
     * @param timestamp Unix timestamp of the score computation
     * @param source Source identifier for the score
     * @param metadataHash Hash of the explanation metadata
     * @param signature ECDSA signature from the authorized oracle
     */
    function updateScore(
        address wallet,
        uint16 score,
        uint32 timestamp,
        bytes32 source,
        bytes32 metadataHash,
        bytes calldata signature
    ) external {
        // Validate score range
        if (score > 100) revert InvalidScore();

        // Check timestamp is not stale (within 1 hour)
        if (timestamp > block.timestamp || block.timestamp - timestamp > 3600) {
            revert StaleTimestamp();
        }

        // Get current nonce for replay protection
        uint256 nonce = nonces[wallet];
        
        // Create message hash for signature verification
        bytes32 messageHash = _createMessageHash(
            wallet,
            score,
            timestamp,
            source,
            metadataHash,
            nonce
        );
        
        // Verify signature
        address recoveredSigner = messageHash.toEthSignedMessageHash().recover(signature);
        if (recoveredSigner != oracleAddress) revert InvalidSignature();

        // Update the trust score
        trustScores[wallet] = TrustScore({
            score: score,
            timestamp: timestamp,
            source: source,
            metadataHash: metadataHash
        });
        
        // Increment nonce to prevent replay
        nonces[wallet] = nonce + 1;

        // Emit event
        emit ScoreUpdated(wallet, score, timestamp, source, metadataHash);
    }

    /**
     * @dev Get trust score for a wallet
     * @param wallet The wallet address to query
     * @return The trust score struct
     */
    function getTrustScore(address wallet) external view returns (TrustScore memory) {
        return trustScores[wallet];
    }

    /**
     * @dev Check if a wallet is trusted (score >= threshold)
     * @param wallet The wallet address to check
     * @return True if wallet is trusted
     */
    function isTrusted(address wallet) external view returns (bool) {
        return trustScores[wallet].score >= trustThreshold;
    }

    /**
     * @dev Get the current trust threshold
     * @return The current trust threshold
     */
    function getTrustThreshold() external view returns (uint16) {
        return trustThreshold;
    }

    /**
     * @dev Update the oracle address (owner only)
     * @param newOracle The new oracle address
     */
    function updateOracle(address newOracle) external onlyOwner {
        address oldOracle = oracleAddress;
        oracleAddress = newOracle;
        
        emit OracleUpdated(oldOracle, newOracle);
    }

    /**
     * @dev Update trust threshold (owner only)
     * @param newThreshold The new trust threshold
     */
    function updateTrustThreshold(uint16 newThreshold) external onlyOwner {
        if (newThreshold > 100) revert InvalidThreshold();
        
        uint16 oldThreshold = trustThreshold;
        trustThreshold = newThreshold;
        
        emit TrustThresholdUpdated(oldThreshold, newThreshold);
    }

    /**
     * @dev Create message hash for signature verification
     * @param wallet Wallet address
     * @param score Trust score
     * @param timestamp Score timestamp
     * @param source Score source
     * @param metadataHash Metadata hash
     * @param nonce Current nonce
     * @return Message hash for signing
     */
    function _createMessageHash(
        address wallet,
        uint16 score,
        uint32 timestamp,
        bytes32 source,
        bytes32 metadataHash,
        uint256 nonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            wallet,
            score,
            timestamp,
            source,
            metadataHash,
            nonce
        ));
    }

    /**
     * @dev Get the message hash that should be signed for a score update
     * @param wallet Wallet address
     * @param score Trust score
     * @param timestamp Score timestamp
     * @param source Score source
     * @param metadataHash Metadata hash
     * @return Message hash for signing
     */
    function getMessageHash(
        address wallet,
        uint16 score,
        uint32 timestamp,
        bytes32 source,
        bytes32 metadataHash
    ) external view returns (bytes32) {
        return _createMessageHash(
            wallet,
            score,
            timestamp,
            source,
            metadataHash,
            nonces[wallet]
        );
    }
}
