"""
TrustGrid.AI Model Explainability Module

Provides explanations for trust score predictions using SHAP values
or deterministic weight-based explanations.
"""

import numpy as np
import pandas as pd
import joblib
import shap
from typing import Dict, List, Tuple, Optional, Any
import logging
from dataclasses import dataclass

from feature_engineering import FeatureEngineer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class FeatureContribution:
    """Represents a single feature's contribution to the trust score"""
    feature_name: str
    value: float
    contribution: float
    importance: float
    description: str

@dataclass
class TrustScoreExplanation:
    """Complete explanation of a trust score prediction"""
    predicted_score: float
    base_score: float
    feature_contributions: List[FeatureContribution]
    top_positive_factors: List[FeatureContribution]
    top_negative_factors: List[FeatureContribution]
    confidence: float
    explanation_text: str

class TrustScoreExplainer:
    """
    Provides explanations for trust score predictions using multiple methods
    """
    
    def __init__(self, model_path: str = "model.pkl"):
        self.model_data = None
        self.model = None
        self.feature_engineer = None
        self.feature_names = None
        self.explainer = None
        self.load_model(model_path)
        
        # Feature descriptions for human-readable explanations
        self.feature_descriptions = {
            'tx_count_log': 'Transaction history depth',
            'contract_interaction_ratio': 'Smart contract usage frequency',
            'unique_contracts': 'Diversity of contract interactions',
            'account_age_log': 'Account maturity',
            'swap_ratio': 'DeFi trading activity',
            'portfolio_stability': 'Portfolio risk management',
            'token_diversity': 'Asset diversification',
            'has_ens': 'ENS domain ownership',
            'social_presence': 'Social media engagement',
            'trust_indicators': 'Overall trust signals',
            'activity_social_score': 'Activity-social composite',
            'bridge_ratio': 'Cross-chain activity',
            'risk_indicators': 'Risk factors',
            'avg_tx_value_log': 'Transaction size patterns',
            'contract_diversity': 'Contract interaction diversity',
            'farcaster_followers_log': 'Farcaster social presence',
            'github_contributions_log': 'Developer activity'
        }
    
    def load_model(self, model_path: str) -> None:
        """Load trained model and associated components"""
        try:
            self.model_data = joblib.load(model_path)
            self.model = self.model_data['model']
            self.feature_engineer = self.model_data['feature_engineer']
            self.feature_names = self.model_data['feature_names']
            
            logger.info(f"Loaded model: {self.model_data['model_name']}")
            logger.info(f"Features: {len(self.feature_names)}")
            
            # Initialize SHAP explainer if possible
            self._initialize_shap_explainer()
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def _initialize_shap_explainer(self) -> None:
        """Initialize SHAP explainer for the loaded model"""
        try:
            if hasattr(self.model, 'predict'):
                # For tree-based models, use TreeExplainer
                if hasattr(self.model, 'estimators_') or 'XGB' in str(type(self.model)):
                    self.explainer = shap.TreeExplainer(self.model)
                    logger.info("Initialized SHAP TreeExplainer")
                else:
                    # For linear models, use LinearExplainer
                    self.explainer = shap.LinearExplainer(self.model, np.zeros((1, len(self.feature_names))))
                    logger.info("Initialized SHAP LinearExplainer")
        except Exception as e:
            logger.warning(f"Could not initialize SHAP explainer: {e}")
            logger.info("Will use deterministic weight-based explanations")
    
    def explain_prediction(self, wallet_data: Dict) -> TrustScoreExplanation:
        """
        Generate a complete explanation for a trust score prediction
        
        Args:
            wallet_data: Raw wallet data dictionary
            
        Returns:
            TrustScoreExplanation object with detailed breakdown
        """
        # Engineer features
        features = self.feature_engineer.engineer_features(wallet_data)
        scaled_features = self.feature_engineer.transform_features(features)
        
        # Create feature vector
        feature_vector = np.array([scaled_features.get(name, 0) for name in self.feature_names]).reshape(1, -1)
        
        # Make prediction
        predicted_score = float(self.model.predict(feature_vector)[0])
        
        # Get feature contributions
        if self.explainer is not None:
            contributions = self._get_shap_contributions(feature_vector, scaled_features)
        else:
            contributions = self._get_deterministic_contributions(scaled_features, predicted_score)
        
        # Calculate base score (average prediction)
        base_score = 50.0  # Assume neutral base score
        
        # Sort contributions
        positive_factors = [c for c in contributions if c.contribution > 0]
        negative_factors = [c for c in contributions if c.contribution < 0]
        
        positive_factors.sort(key=lambda x: x.contribution, reverse=True)
        negative_factors.sort(key=lambda x: x.contribution)
        
        # Calculate confidence based on feature availability and model certainty
        confidence = self._calculate_confidence(scaled_features, contributions)
        
        # Generate explanation text
        explanation_text = self._generate_explanation_text(
            predicted_score, positive_factors[:3], negative_factors[:3]
        )
        
        return TrustScoreExplanation(
            predicted_score=predicted_score,
            base_score=base_score,
            feature_contributions=contributions,
            top_positive_factors=positive_factors[:5],
            top_negative_factors=negative_factors[:5],
            confidence=confidence,
            explanation_text=explanation_text
        )
    
    def _get_shap_contributions(self, feature_vector: np.ndarray, scaled_features: Dict) -> List[FeatureContribution]:
        """Get feature contributions using SHAP values"""
        try:
            shap_values = self.explainer.shap_values(feature_vector)
            if len(shap_values.shape) > 1:
                shap_values = shap_values[0]  # Take first sample
            
            contributions = []
            for i, feature_name in enumerate(self.feature_names):
                contribution = float(shap_values[i])
                value = scaled_features.get(feature_name, 0)
                
                contributions.append(FeatureContribution(
                    feature_name=feature_name,
                    value=value,
                    contribution=contribution,
                    importance=abs(contribution),
                    description=self.feature_descriptions.get(feature_name, feature_name)
                ))
            
            return contributions
            
        except Exception as e:
            logger.warning(f"SHAP explanation failed: {e}")
            return self._get_deterministic_contributions(scaled_features, 50.0)
    
    def _get_deterministic_contributions(self, scaled_features: Dict, predicted_score: float) -> List[FeatureContribution]:
        """Get feature contributions using deterministic weights"""
        # Get predefined feature weights
        feature_weights = self.feature_engineer.get_feature_importance_weights()
        
        contributions = []
        total_weighted_contribution = 0
        
        for feature_name in self.feature_names:
            value = scaled_features.get(feature_name, 0)
            weight = feature_weights.get(feature_name, 0.01)  # Default small weight
            
            # Calculate contribution based on scaled value and weight
            # Positive scaled values contribute positively, negative contribute negatively
            raw_contribution = value * weight * 100  # Scale to score range
            
            # Normalize contributions to match predicted score
            total_weighted_contribution += abs(raw_contribution)
            
            contributions.append(FeatureContribution(
                feature_name=feature_name,
                value=value,
                contribution=raw_contribution,
                importance=abs(raw_contribution),
                description=self.feature_descriptions.get(feature_name, feature_name)
            ))
        
        # Normalize contributions so they sum to the deviation from base score
        if total_weighted_contribution > 0:
            base_score = 50.0
            score_deviation = predicted_score - base_score
            normalization_factor = score_deviation / total_weighted_contribution if total_weighted_contribution != 0 else 1
            
            for contrib in contributions:
                contrib.contribution *= normalization_factor
        
        return contributions
    
    def _calculate_confidence(self, scaled_features: Dict, contributions: List[FeatureContribution]) -> float:
        """Calculate confidence in the prediction based on feature availability and consistency"""
        confidence = 0.0
        
        # Base confidence from feature availability
        available_features = sum(1 for name in self.feature_names if scaled_features.get(name, 0) != 0)
        feature_availability = available_features / len(self.feature_names)
        confidence += feature_availability * 40  # Up to 40 points for feature availability
        
        # Confidence from contribution consistency
        total_importance = sum(contrib.importance for contrib in contributions)
        if total_importance > 0:
            # Higher total importance suggests more confident prediction
            importance_confidence = min(total_importance / 20, 1.0) * 30  # Up to 30 points
            confidence += importance_confidence
        
        # Confidence from feature quality (non-zero, reasonable values)
        quality_features = [
            'tx_count_log', 'account_age_log', 'contract_interaction_ratio',
            'has_ens', 'social_presence'
        ]
        quality_score = sum(1 for name in quality_features if scaled_features.get(name, 0) > 0)
        confidence += (quality_score / len(quality_features)) * 30  # Up to 30 points
        
        return min(confidence, 100.0)
    
    def _generate_explanation_text(self, 
                                 predicted_score: float,
                                 top_positive: List[FeatureContribution],
                                 top_negative: List[FeatureContribution]) -> str:
        """Generate human-readable explanation text"""
        
        # Determine score category
        if predicted_score >= 80:
            score_category = "excellent"
            trust_level = "highly trusted"
        elif predicted_score >= 60:
            score_category = "good"
            trust_level = "trusted"
        elif predicted_score >= 40:
            score_category = "moderate"
            trust_level = "moderately trusted"
        else:
            score_category = "low"
            trust_level = "low trust"
        
        explanation = f"This wallet has a {score_category} trust score of {predicted_score:.0f}/100, indicating it is {trust_level}. "
        
        # Add positive factors
        if top_positive:
            positive_descriptions = [factor.description for factor in top_positive]
            if len(positive_descriptions) == 1:
                explanation += f"The main positive factor is {positive_descriptions[0].lower()}. "
            elif len(positive_descriptions) == 2:
                explanation += f"Key positive factors include {positive_descriptions[0].lower()} and {positive_descriptions[1].lower()}. "
            else:
                explanation += f"Key positive factors include {', '.join(positive_descriptions[:-1]).lower()}, and {positive_descriptions[-1].lower()}. "
        
        # Add negative factors
        if top_negative:
            negative_descriptions = [factor.description for factor in top_negative]
            if len(negative_descriptions) == 1:
                explanation += f"The main concern is {negative_descriptions[0].lower()}. "
            elif len(negative_descriptions) == 2:
                explanation += f"Areas of concern include {negative_descriptions[0].lower()} and {negative_descriptions[1].lower()}. "
            else:
                explanation += f"Areas of concern include {', '.join(negative_descriptions[:-1]).lower()}, and {negative_descriptions[-1].lower()}. "
        
        return explanation
    
    def batch_explain(self, wallet_data_list: List[Dict]) -> List[TrustScoreExplanation]:
        """Generate explanations for multiple wallets"""
        explanations = []
        for wallet_data in wallet_data_list:
            explanation = self.explain_prediction(wallet_data)
            explanations.append(explanation)
        return explanations
    
    def export_explanation(self, explanation: TrustScoreExplanation, format: str = 'dict') -> Any:
        """Export explanation in different formats"""
        if format == 'dict':
            return {
                'predicted_score': explanation.predicted_score,
                'confidence': explanation.confidence,
                'explanation': explanation.explanation_text,
                'top_positive_factors': [
                    {
                        'factor': factor.description,
                        'contribution': factor.contribution,
                        'value': factor.value
                    }
                    for factor in explanation.top_positive_factors
                ],
                'top_negative_factors': [
                    {
                        'factor': factor.description,
                        'contribution': factor.contribution,
                        'value': factor.value
                    }
                    for factor in explanation.top_negative_factors
                ]
            }
        elif format == 'json':
            import json
            return json.dumps(self.export_explanation(explanation, 'dict'), indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")

def main():
    """Example usage of the explainer"""
    # Sample wallet data
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
    
    try:
        # Initialize explainer
        explainer = TrustScoreExplainer("model.pkl")
        
        # Generate explanation
        explanation = explainer.explain_prediction(sample_wallet_data)
        
        # Print results
        print("="*60)
        print("TRUST SCORE EXPLANATION")
        print("="*60)
        print(f"Predicted Score: {explanation.predicted_score:.1f}/100")
        print(f"Confidence: {explanation.confidence:.1f}%")
        print(f"\nExplanation: {explanation.explanation_text}")
        
        print(f"\nTop Positive Factors:")
        for factor in explanation.top_positive_factors:
            print(f"  • {factor.description}: +{factor.contribution:.1f} points")
        
        print(f"\nTop Negative Factors:")
        for factor in explanation.top_negative_factors:
            print(f"  • {factor.description}: {factor.contribution:.1f} points")
        
        print("="*60)
        
        # Export as JSON
        json_explanation = explainer.export_explanation(explanation, 'json')
        print("\nJSON Export:")
        print(json_explanation)
        
    except Exception as e:
        logger.error(f"Error running explainer: {e}")
        print("Please ensure the model has been trained first by running train.py")

if __name__ == "__main__":
    main()
