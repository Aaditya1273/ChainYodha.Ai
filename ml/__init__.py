"""
TrustGrid.AI ML Package

Machine learning components for trust score prediction and explanation.
"""

from .feature_engineering import FeatureEngineer, FeatureConfig
from .explain import TrustScoreExplainer, TrustScoreExplanation, FeatureContribution
from .generate_synth import SyntheticDataGenerator, WalletProfile

__version__ = "1.0.0"
__all__ = [
    "FeatureEngineer",
    "FeatureConfig", 
    "TrustScoreExplainer",
    "TrustScoreExplanation",
    "FeatureContribution",
    "SyntheticDataGenerator",
    "WalletProfile"
]
