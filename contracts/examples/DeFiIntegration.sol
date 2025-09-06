// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../solidity/TrustOracle.sol";

/**
 * @title DeFiIntegration
 * @dev Example contract showing how DeFi protocols can integrate ChainYodha.Ai
 */
contract DeFiIntegration {
    TrustOracle public immutable trustOracle;
    
    uint16 public constant MIN_TRUST_SCORE = 50;
    uint16 public constant HIGH_TRUST_SCORE = 80;
    
    event SwapExecuted(address indexed user, uint256 amount, uint16 trustScore);
    event HighRiskSwapBlocked(address indexed user, uint16 trustScore);
    
    constructor(address _trustOracle) {
        trustOracle = TrustOracle(_trustOracle);
    }
    
    /**
     * @dev Execute a swap with trust score validation
     * @param amount The swap amount
     */
    function executeSwap(uint256 amount) external {
        // Get user's trust score
        TrustOracle.TrustScore memory userScore = trustOracle.getTrustScore(msg.sender);
        
        // Block high-risk users
        if (userScore.score < MIN_TRUST_SCORE) {
            emit HighRiskSwapBlocked(msg.sender, userScore.score);
            revert("Trust score too low for swap");
        }
        
        // Apply different slippage based on trust score
        uint256 slippage = _calculateSlippage(userScore.score);
        
        // Execute swap logic here...
        // (This is a simplified example)
        
        emit SwapExecuted(msg.sender, amount, userScore.score);
    }
    
    /**
     * @dev Calculate slippage based on trust score
     * Higher trust = lower slippage
     */
    function _calculateSlippage(uint16 trustScore) internal pure returns (uint256) {
        if (trustScore >= HIGH_TRUST_SCORE) {
            return 50; // 0.5% slippage for high trust users
        } else if (trustScore >= MIN_TRUST_SCORE) {
            return 100; // 1% slippage for medium trust users
        } else {
            return 300; // 3% slippage for low trust users
        }
    }
    
    /**
     * @dev Check if user can access premium features
     */
    function canAccessPremiumFeatures(address user) external view returns (bool) {
        return trustOracle.isTrusted(user);
    }
}
