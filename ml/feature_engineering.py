"""
TrustGrid.AI Feature Engineering Module

This module handles the computation, transformation, and scaling of features
from onchain and offchain data for trust score prediction.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FeatureConfig:
    """Configuration for feature engineering pipeline"""
    use_log_transform: bool = True
    use_robust_scaling: bool = True
    handle_outliers: bool = True
    outlier_threshold: float = 3.0
    min_transactions_threshold: int = 5

class FeatureEngineer:
    """
    Feature engineering pipeline for TrustGrid.AI trust scoring
    
    Handles transformation of raw onchain and offchain data into
    ML-ready features with proper scaling and normalization.
    """
    
    def __init__(self, config: Optional[FeatureConfig] = None):
        self.config = config or FeatureConfig()
        self.scalers = {}
        self.feature_stats = {}
        self.is_fitted = False
        
    def extract_onchain_features(self, wallet_data: Dict) -> Dict[str, float]:
        """
        Extract and engineer onchain features from wallet data
        
        Args:
            wallet_data: Dictionary containing wallet transaction and balance data
            
        Returns:
            Dictionary of engineered onchain features
        """
        features = {}
        
        # Basic transaction features
        tx_count = wallet_data.get('total_transactions', 0)
        features['tx_count'] = tx_count
        features['tx_count_log'] = np.log1p(tx_count) if self.config.use_log_transform else tx_count
        
        # Contract interaction features
        contract_interactions = wallet_data.get('contract_interactions', 0)
        features['contract_interactions'] = contract_interactions
        features['contract_interaction_ratio'] = (
            contract_interactions / max(tx_count, 1)
        )
        
        # Unique contracts
        unique_contracts = wallet_data.get('unique_contracts_interacted', 0)
        features['unique_contracts'] = unique_contracts
        features['contract_diversity'] = unique_contracts / max(contract_interactions, 1)
        
        # Transaction value features
        avg_tx_value = wallet_data.get('average_transaction_value', 0)
        features['avg_tx_value'] = avg_tx_value
        features['avg_tx_value_log'] = np.log1p(avg_tx_value) if self.config.use_log_transform else avg_tx_value
        
        # DeFi activity features
        swap_frequency = wallet_data.get('swap_frequency', 0)
        features['swap_frequency'] = swap_frequency
        features['swap_ratio'] = swap_frequency / max(tx_count, 1)
        
        # Bridge activity features
        bridge_txs = wallet_data.get('bridge_transactions', 0)
        features['bridge_transactions'] = bridge_txs
        features['bridge_ratio'] = bridge_txs / max(tx_count, 1)
        
        # Portfolio features
        portfolio_volatility = wallet_data.get('portfolio_volatility', 0)
        features['portfolio_volatility'] = portfolio_volatility
        features['portfolio_stability'] = 1 / (1 + portfolio_volatility)  # Inverse relationship
        
        # Token diversity features
        top_tokens = wallet_data.get('top_tokens', [])
        features['token_count'] = len(top_tokens)
        
        if top_tokens:
            # Calculate Herfindahl-Hirschman Index for token concentration
            percentages = [token.get('percentage', 0) / 100 for token in top_tokens]
            hhi = sum(p**2 for p in percentages)
            features['token_concentration'] = hhi
            features['token_diversity'] = 1 - hhi
        else:
            features['token_concentration'] = 1.0
            features['token_diversity'] = 0.0
        
        # Account age features
        account_age = wallet_data.get('account_age', 0)
        features['account_age'] = account_age
        features['account_age_log'] = np.log1p(account_age) if self.config.use_log_transform else account_age
        
        # Activity consistency (transactions per day)
        features['tx_per_day'] = tx_count / max(account_age, 1)
        
        return features
    
    def extract_offchain_features(self, wallet_data: Dict) -> Dict[str, float]:
        """
        Extract and engineer offchain features from social and identity data
        
        Args:
            wallet_data: Dictionary containing offchain data
            
        Returns:
            Dictionary of engineered offchain features
        """
        features = {}
        
        # ENS features
        has_ens = wallet_data.get('has_ens', False)
        features['has_ens'] = 1.0 if has_ens else 0.0
        
        # Farcaster features
        farcaster_followers = wallet_data.get('farcaster_followers', 0)
        features['farcaster_followers'] = farcaster_followers
        features['farcaster_followers_log'] = (
            np.log1p(farcaster_followers) if self.config.use_log_transform else farcaster_followers
        )
        features['has_farcaster'] = 1.0 if farcaster_followers > 0 else 0.0
        
        # GitHub features
        github_contributions = wallet_data.get('github_contributions', 0)
        features['github_contributions'] = github_contributions
        features['github_contributions_log'] = (
            np.log1p(github_contributions) if self.config.use_log_transform else github_contributions
        )
        features['has_github'] = 1.0 if github_contributions > 0 else 0.0
        
        # Social score composite
        social_signals = (
            (farcaster_followers > 0) + 
            (github_contributions > 0) + 
            has_ens
        )
        features['social_signal_count'] = social_signals
        features['social_presence'] = social_signals / 3.0  # Normalized to 0-1
        
        return features
    
    def create_composite_features(self, onchain_features: Dict, offchain_features: Dict) -> Dict[str, float]:
        """
        Create composite features that combine onchain and offchain signals
        
        Args:
            onchain_features: Onchain feature dictionary
            offchain_features: Offchain feature dictionary
            
        Returns:
            Dictionary of composite features
        """
        features = {}
        
        # Activity-social composite
        tx_count = onchain_features.get('tx_count', 0)
        social_presence = offchain_features.get('social_presence', 0)
        features['activity_social_score'] = (
            np.sqrt(tx_count) * (1 + social_presence)
        )
        
        # Trust indicators composite
        has_ens = offchain_features.get('has_ens', 0)
        contract_diversity = onchain_features.get('contract_diversity', 0)
        account_age = onchain_features.get('account_age', 0)
        
        features['trust_indicators'] = (
            has_ens * 0.3 + 
            min(contract_diversity, 1.0) * 0.4 + 
            min(account_age / 365, 1.0) * 0.3
        )
        
        # Risk indicators composite
        portfolio_volatility = onchain_features.get('portfolio_volatility', 0)
        tx_per_day = onchain_features.get('tx_per_day', 0)
        
        # High frequency trading might indicate bot activity
        high_frequency_risk = 1.0 if tx_per_day > 10 else 0.0
        volatility_risk = min(portfolio_volatility / 2.0, 1.0)
        
        features['risk_indicators'] = (high_frequency_risk * 0.6 + volatility_risk * 0.4)
        
        return features
    
    def engineer_features(self, wallet_data: Dict) -> Dict[str, float]:
        """
        Complete feature engineering pipeline
        
        Args:
            wallet_data: Raw wallet data dictionary
            
        Returns:
            Dictionary of all engineered features
        """
        # Extract base features
        onchain_features = self.extract_onchain_features(wallet_data)
        offchain_features = self.extract_offchain_features(wallet_data)
        
        # Create composite features
        composite_features = self.create_composite_features(onchain_features, offchain_features)
        
        # Combine all features
        all_features = {**onchain_features, **offchain_features, **composite_features}
        
        # Handle outliers if configured
        if self.config.handle_outliers:
            all_features = self._handle_outliers(all_features)
        
        return all_features
    
    def fit_scalers(self, feature_data: List[Dict[str, float]]) -> None:
        """
        Fit scalers on training data
        
        Args:
            feature_data: List of feature dictionaries from training data
        """
        if not feature_data:
            raise ValueError("No feature data provided for fitting scalers")
        
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(feature_data)
        
        # Store feature statistics
        self.feature_stats = {
            'mean': df.mean().to_dict(),
            'std': df.std().to_dict(),
            'min': df.min().to_dict(),
            'max': df.max().to_dict(),
            'median': df.median().to_dict()
        }
        
        # Fit scalers for different feature types
        for column in df.columns:
            if self.config.use_robust_scaling:
                scaler = RobustScaler()
            else:
                scaler = StandardScaler()
            
            # Reshape for sklearn
            values = df[column].values.reshape(-1, 1)
            scaler.fit(values)
            self.scalers[column] = scaler
        
        self.is_fitted = True
        logger.info(f"Fitted scalers for {len(self.scalers)} features")
    
    def transform_features(self, features: Dict[str, float]) -> Dict[str, float]:
        """
        Transform features using fitted scalers
        
        Args:
            features: Dictionary of raw features
            
        Returns:
            Dictionary of scaled features
        """
        if not self.is_fitted:
            logger.warning("Scalers not fitted. Returning raw features.")
            return features
        
        scaled_features = {}
        
        for feature_name, value in features.items():
            if feature_name in self.scalers:
                # Transform using fitted scaler
                scaler = self.scalers[feature_name]
                scaled_value = scaler.transform([[value]])[0][0]
                scaled_features[feature_name] = scaled_value
            else:
                # Keep original value if no scaler available
                scaled_features[feature_name] = value
        
        return scaled_features
    
    def _handle_outliers(self, features: Dict[str, float]) -> Dict[str, float]:
        """
        Handle outliers using IQR method or z-score clipping
        
        Args:
            features: Dictionary of features
            
        Returns:
            Dictionary of features with outliers handled
        """
        handled_features = features.copy()
        
        # Define features that should be clipped (not binary features)
        continuous_features = [
            'tx_count', 'contract_interactions', 'avg_tx_value', 
            'swap_frequency', 'portfolio_volatility', 'account_age',
            'farcaster_followers', 'github_contributions'
        ]
        
        for feature_name in continuous_features:
            if feature_name in handled_features:
                value = handled_features[feature_name]
                
                # Use feature statistics if available
                if self.is_fitted and feature_name in self.feature_stats['mean']:
                    mean = self.feature_stats['mean'][feature_name]
                    std = self.feature_stats['std'][feature_name]
                    
                    # Clip values beyond threshold standard deviations
                    if abs(value - mean) > self.config.outlier_threshold * std:
                        clipped_value = mean + np.sign(value - mean) * self.config.outlier_threshold * std
                        handled_features[feature_name] = clipped_value
                        logger.debug(f"Clipped outlier in {feature_name}: {value} -> {clipped_value}")
        
        return handled_features
    
    def get_feature_importance_weights(self) -> Dict[str, float]:
        """
        Get predefined feature importance weights for deterministic scoring
        
        Returns:
            Dictionary mapping feature names to importance weights
        """
        return {
            # Onchain activity features (high importance)
            'tx_count_log': 0.15,
            'contract_interaction_ratio': 0.12,
            'unique_contracts': 0.10,
            'account_age_log': 0.10,
            
            # DeFi and portfolio features (medium-high importance)
            'swap_ratio': 0.08,
            'portfolio_stability': 0.08,
            'token_diversity': 0.06,
            
            # Social and identity features (medium importance)
            'has_ens': 0.05,
            'social_presence': 0.05,
            'trust_indicators': 0.08,
            
            # Composite and risk features (medium importance)
            'activity_social_score': 0.06,
            'bridge_ratio': 0.04,
            'risk_indicators': -0.03,  # Negative weight (risk reduces trust)
        }
    
    def save_scalers(self, filepath: str) -> None:
        """Save fitted scalers to file"""
        import joblib
        if self.is_fitted:
            joblib.dump({
                'scalers': self.scalers,
                'feature_stats': self.feature_stats,
                'config': self.config
            }, filepath)
            logger.info(f"Saved scalers to {filepath}")
    
    def load_scalers(self, filepath: str) -> None:
        """Load fitted scalers from file"""
        import joblib
        data = joblib.load(filepath)
        self.scalers = data['scalers']
        self.feature_stats = data['feature_stats']
        self.config = data.get('config', FeatureConfig())
        self.is_fitted = True
        logger.info(f"Loaded scalers from {filepath}")

def create_feature_vector(wallet_data: Dict, feature_engineer: FeatureEngineer) -> np.ndarray:
    """
    Create a feature vector from wallet data using the feature engineer
    
    Args:
        wallet_data: Raw wallet data
        feature_engineer: Fitted FeatureEngineer instance
        
    Returns:
        Numpy array of engineered and scaled features
    """
    # Engineer features
    features = feature_engineer.engineer_features(wallet_data)
    
    # Transform features
    scaled_features = feature_engineer.transform_features(features)
    
    # Convert to ordered array (ensure consistent ordering)
    feature_names = sorted(scaled_features.keys())
    feature_vector = np.array([scaled_features[name] for name in feature_names])
    
    return feature_vector, feature_names

if __name__ == "__main__":
    # Example usage
    sample_wallet_data = {
        'total_transactions': 150,
        'contract_interactions': 45,
        'unique_contracts_interacted': 12,
        'average_transaction_value': 0.5,
        'swap_frequency': 20,
        'bridge_transactions': 3,
        'portfolio_volatility': 0.8,
        'account_age': 180,
        'has_ens': True,
        'farcaster_followers': 50,
        'github_contributions': 25,
        'top_tokens': [
            {'percentage': 60, 'symbol': 'USDC'},
            {'percentage': 30, 'symbol': 'ETH'},
            {'percentage': 10, 'symbol': 'ARB'}
        ]
    }
    
    # Initialize feature engineer
    feature_engineer = FeatureEngineer()
    
    # Engineer features
    features = feature_engineer.engineer_features(sample_wallet_data)
    
    print("Engineered Features:")
    for name, value in sorted(features.items()):
        print(f"  {name}: {value:.4f}")
