// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ScoreUtils
 * @dev Utility library for TrustGrid.AI score operations
 */
library ScoreUtils {
    /// @dev Score categories
    enum ScoreCategory {
        VERY_LOW,    // 0-20
        LOW,         // 21-40
        MEDIUM,      // 41-60
        HIGH,        // 61-80
        VERY_HIGH    // 81-100
    }

    /// @dev Risk levels
    enum RiskLevel {
        CRITICAL,    // 0-20
        HIGH,        // 21-40
        MEDIUM,      // 41-60
        LOW,         // 61-80
        MINIMAL      // 81-100
    }

    /**
     * @dev Convert score to category
     * @param score The trust score (0-100)
     * @return The score category
     */
    function getScoreCategory(uint16 score) internal pure returns (ScoreCategory) {
        if (score <= 20) return ScoreCategory.VERY_LOW;
        if (score <= 40) return ScoreCategory.LOW;
        if (score <= 60) return ScoreCategory.MEDIUM;
        if (score <= 80) return ScoreCategory.HIGH;
        return ScoreCategory.VERY_HIGH;
    }

    /**
     * @dev Convert score to risk level (inverse of score)
     * @param score The trust score (0-100)
     * @return The risk level
     */
    function getRiskLevel(uint16 score) internal pure returns (RiskLevel) {
        if (score <= 20) return RiskLevel.CRITICAL;
        if (score <= 40) return RiskLevel.HIGH;
        if (score <= 60) return RiskLevel.MEDIUM;
        if (score <= 80) return RiskLevel.LOW;
        return RiskLevel.MINIMAL;
    }

    /**
     * @dev Check if score is valid
     * @param score The score to validate
     * @return True if score is valid (0-100)
     */
    function isValidScore(uint16 score) internal pure returns (bool) {
        return score <= 100;
    }

    /**
     * @dev Calculate weighted average of scores
     * @param scores Array of scores
     * @param weights Array of weights (must sum to 100)
     * @return Weighted average score
     */
    function calculateWeightedAverage(
        uint16[] memory scores,
        uint16[] memory weights
    ) internal pure returns (uint16) {
        require(scores.length == weights.length, "Arrays length mismatch");
        require(scores.length > 0, "Empty arrays");

        uint256 totalWeightedScore = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < scores.length; i++) {
            require(isValidScore(scores[i]), "Invalid score");
            totalWeightedScore += scores[i] * weights[i];
            totalWeight += weights[i];
        }

        require(totalWeight > 0, "Zero total weight");
        return uint16(totalWeightedScore / totalWeight);
    }

    /**
     * @dev Serialize score data for hashing
     * @param score Trust score
     * @param timestamp Score timestamp
     * @param source Score source
     * @return Serialized data
     */
    function serializeScoreData(
        uint16 score,
        uint32 timestamp,
        bytes32 source
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(score, timestamp, source);
    }

    /**
     * @dev Create metadata hash from explanation data
     * @param explanation Human-readable explanation
     * @param features Array of feature names
     * @param values Array of feature values
     * @param weights Array of feature weights
     * @return Hash of the metadata
     */
    function createMetadataHash(
        string memory explanation,
        string[] memory features,
        uint16[] memory values,
        uint16[] memory weights
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(explanation, features, values, weights));
    }

    /**
     * @dev Check if timestamp is recent (within specified seconds)
     * @param timestamp The timestamp to check
     * @param maxAge Maximum age in seconds
     * @return True if timestamp is recent
     */
    function isRecentTimestamp(uint32 timestamp, uint32 maxAge) internal view returns (bool) {
        return timestamp <= block.timestamp && (block.timestamp - timestamp) <= maxAge;
    }
}
