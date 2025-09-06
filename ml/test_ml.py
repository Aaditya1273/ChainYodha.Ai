"""
Tests for TrustGrid.AI ML components
"""

import pytest
import numpy as np
import pandas as pd
import os
import tempfile
from unittest.mock import patch, MagicMock

from feature_engineering import FeatureEngineer, FeatureConfig
from generate_synth import SyntheticDataGenerator
from explain import TrustScoreExplainer

class TestFeatureEngineer:
    
    def setup_method(self):
        self.feature_engineer = FeatureEngineer()
        self.sample_wallet_data = {
            'total_transactions': 100,
            'contract_interactions': 30,
            'unique_contracts_interacted': 10,
            'average_transaction_value': 1.0,
            'swap_frequency': 15,
            'bridge_transactions': 2,
            'portfolio_volatility': 0.5,
            'account_age': 120,
            'has_ens': True,
            'farcaster_followers': 25,
            'github_contributions': 10,
            'top_tokens': [
                {'percentage': 60, 'symbol': 'USDC'},
                {'percentage': 40, 'symbol': 'ETH'}
            ]
        }
    
    def test_extract_onchain_features(self):
        features = self.feature_engineer.extract_onchain_features(self.sample_wallet_data)
        
        assert 'tx_count' in features
        assert 'contract_interaction_ratio' in features
        assert 'token_diversity' in features
        assert features['tx_count'] == 100
        assert 0 <= features['contract_interaction_ratio'] <= 1
    
    def test_extract_offchain_features(self):
        features = self.feature_engineer.extract_offchain_features(self.sample_wallet_data)
        
        assert 'has_ens' in features
        assert 'farcaster_followers' in features
        assert 'social_presence' in features
        assert features['has_ens'] == 1.0
        assert features['farcaster_followers'] == 25
    
    def test_engineer_features(self):
        features = self.feature_engineer.engineer_features(self.sample_wallet_data)
        
        # Should contain onchain, offchain, and composite features
        assert len(features) > 15
        assert 'activity_social_score' in features
        assert 'trust_indicators' in features
    
    def test_fit_and_transform_scalers(self):
        # Create sample feature data
        feature_data = []
        for _ in range(10):
            features = self.feature_engineer.engineer_features(self.sample_wallet_data)
            feature_data.append(features)
        
        # Fit scalers
        self.feature_engineer.fit_scalers(feature_data)
        assert self.feature_engineer.is_fitted
        
        # Transform features
        test_features = self.feature_engineer.engineer_features(self.sample_wallet_data)
        scaled_features = self.feature_engineer.transform_features(test_features)
        
        assert len(scaled_features) == len(test_features)

class TestSyntheticDataGenerator:
    
    def setup_method(self):
        self.generator = SyntheticDataGenerator(seed=42)
    
    def test_generate_wallet_profile(self):
        profile = self.generator.generate_wallet_profile('high_trust_defi_user')
        
        assert 80 <= profile.trust_label <= 95
        assert profile.total_transactions >= 200
        assert profile.has_ens in [True, False]
        assert len(profile.address) == 42
        assert profile.address.startswith('0x')
    
    def test_generate_dataset(self):
        df = self.generator.generate_dataset(total_samples=100)
        
        assert len(df) == 100
        assert 'trust_score' in df.columns
        assert 'wallet_address' in df.columns
        assert df['trust_score'].min() >= 0
        assert df['trust_score'].max() <= 100
    
    def test_generate_demo_wallets(self):
        demo_wallets = self.generator.generate_demo_wallets()
        
        assert len(demo_wallets) == 3
        assert all('address' in wallet for wallet in demo_wallets)
        assert all('profile' in wallet for wallet in demo_wallets)

class TestTrustScoreExplainer:
    
    def setup_method(self):
        # Create a mock model file
        self.temp_dir = tempfile.mkdtemp()
        self.model_path = os.path.join(self.temp_dir, 'test_model.pkl')
        
        # Mock model data
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([75.0])
        
        mock_feature_engineer = FeatureEngineer()
        
        model_data = {
            'model': mock_model,
            'model_name': 'test_model',
            'feature_engineer': mock_feature_engineer,
            'feature_names': ['tx_count_log', 'has_ens', 'social_presence'],
            'model_performance': {}
        }
        
        import joblib
        joblib.dump(model_data, self.model_path)
    
    def test_load_model(self):
        explainer = TrustScoreExplainer(self.model_path)
        
        assert explainer.model is not None
        assert explainer.feature_engineer is not None
        assert len(explainer.feature_names) == 3
    
    def test_explain_prediction(self):
        explainer = TrustScoreExplainer(self.model_path)
        
        sample_data = {
            'total_transactions': 100,
            'has_ens': True,
            'farcaster_followers': 25,
            'github_contributions': 10,
            'account_age': 120,
            'contract_interactions': 30,
            'unique_contracts_interacted': 10,
            'average_transaction_value': 1.0,
            'swap_frequency': 15,
            'bridge_transactions': 2,
            'portfolio_volatility': 0.5,
            'top_tokens': []
        }
        
        explanation = explainer.explain_prediction(sample_data)
        
        assert explanation.predicted_score > 0
        assert 0 <= explanation.confidence <= 100
        assert len(explanation.explanation_text) > 0
        assert isinstance(explanation.feature_contributions, list)

if __name__ == "__main__":
    pytest.main([__file__])
