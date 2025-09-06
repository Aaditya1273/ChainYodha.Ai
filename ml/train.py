"""
TrustGrid.AI Model Training Script

Trains a trust scoring model using the synthetic dataset and saves
the trained model for use in the backend service.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import xgboost as xgb
import joblib
import os
import logging
from typing import Tuple, Dict, Any
import matplotlib.pyplot as plt
import seaborn as sns

from feature_engineering import FeatureEngineer, FeatureConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrustScoreTrainer:
    """
    Trains and evaluates trust scoring models
    """
    
    def __init__(self, feature_engineer: FeatureEngineer = None):
        self.feature_engineer = feature_engineer or FeatureEngineer()
        self.models = {}
        self.best_model = None
        self.best_model_name = None
        self.feature_names = None
        
    def load_data(self, filepath: str) -> pd.DataFrame:
        """Load training data from CSV file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Dataset not found: {filepath}")
        
        df = pd.read_csv(filepath)
        logger.info(f"Loaded dataset with {len(df)} samples and {len(df.columns)} features")
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, list]:
        """
        Prepare features for training using the feature engineering pipeline
        
        Args:
            df: Raw dataset DataFrame
            
        Returns:
            Tuple of (X, y, feature_names)
        """
        logger.info("Preparing features using feature engineering pipeline...")
        
        # Convert DataFrame rows to wallet data dictionaries
        wallet_data_list = []
        for _, row in df.iterrows():
            wallet_data = {
                'total_transactions': row['total_transactions'],
                'contract_interactions': row['contract_interactions'],
                'unique_contracts_interacted': row['unique_contracts_interacted'],
                'average_transaction_value': row['average_transaction_value'],
                'swap_frequency': row['swap_frequency'],
                'bridge_transactions': row['bridge_transactions'],
                'portfolio_volatility': row['portfolio_volatility'],
                'account_age': row['account_age'],
                'has_ens': row['has_ens'],
                'farcaster_followers': row['farcaster_followers'],
                'github_contributions': row['github_contributions'],
                'top_tokens': [
                    {'percentage': row.get('top_token_percentage', 100)}
                ] if row.get('top_token_percentage') else []
            }
            wallet_data_list.append(wallet_data)
        
        # Engineer features for all samples
        engineered_features_list = []
        for wallet_data in wallet_data_list:
            features = self.feature_engineer.engineer_features(wallet_data)
            engineered_features_list.append(features)
        
        # Fit scalers on the engineered features
        self.feature_engineer.fit_scalers(engineered_features_list)
        
        # Transform features
        X_list = []
        for features in engineered_features_list:
            scaled_features = self.feature_engineer.transform_features(features)
            X_list.append(scaled_features)
        
        # Convert to consistent feature matrix
        if X_list:
            # Get consistent feature names (sorted for reproducibility)
            self.feature_names = sorted(X_list[0].keys())
            
            # Create feature matrix
            X = np.array([[sample[name] for name in self.feature_names] for sample in X_list])
            y = df['trust_score'].values
            
            logger.info(f"Prepared feature matrix: {X.shape}")
            logger.info(f"Feature names: {self.feature_names}")
            
            return X, y, self.feature_names
        else:
            raise ValueError("No features could be engineered from the dataset")
    
    def train_models(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """
        Train multiple models and compare performance
        
        Args:
            X: Feature matrix
            y: Target values (trust scores)
            
        Returns:
            Dictionary of trained models with their performance metrics
        """
        logger.info("Training multiple models...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=pd.cut(y, bins=5, labels=False)
        )
        
        # Define models to train
        models_config = {
            'linear_regression': LinearRegression(),
            'ridge_regression': Ridge(alpha=1.0),
            'random_forest': RandomForestRegressor(
                n_estimators=100, 
                max_depth=10, 
                random_state=42,
                n_jobs=-1
            ),
            'xgboost': xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1
            )
        }
        
        results = {}
        
        for name, model in models_config.items():
            logger.info(f"Training {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Make predictions
            y_pred_train = model.predict(X_train)
            y_pred_test = model.predict(X_test)
            
            # Calculate metrics
            train_mse = mean_squared_error(y_train, y_pred_train)
            test_mse = mean_squared_error(y_test, y_pred_test)
            train_mae = mean_absolute_error(y_train, y_pred_train)
            test_mae = mean_absolute_error(y_test, y_pred_test)
            train_r2 = r2_score(y_train, y_pred_train)
            test_r2 = r2_score(y_test, y_pred_test)
            
            # Cross-validation score
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
            
            results[name] = {
                'model': model,
                'train_mse': train_mse,
                'test_mse': test_mse,
                'train_mae': train_mae,
                'test_mae': test_mae,
                'train_r2': train_r2,
                'test_r2': test_r2,
                'cv_r2_mean': cv_scores.mean(),
                'cv_r2_std': cv_scores.std(),
                'predictions_test': y_pred_test
            }
            
            logger.info(f"{name} - Test R²: {test_r2:.4f}, Test MAE: {test_mae:.2f}")
        
        # Select best model based on test R² score
        best_model_name = max(results.keys(), key=lambda k: results[k]['test_r2'])
        self.best_model = results[best_model_name]['model']
        self.best_model_name = best_model_name
        
        logger.info(f"Best model: {best_model_name} (Test R²: {results[best_model_name]['test_r2']:.4f})")
        
        # Store results
        self.models = results
        
        return results
    
    def hyperparameter_tuning(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Perform hyperparameter tuning on the best model
        """
        if self.best_model_name == 'xgboost':
            logger.info("Performing hyperparameter tuning for XGBoost...")
            
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [3, 6, 10],
                'learning_rate': [0.01, 0.1, 0.2],
                'subsample': [0.8, 0.9, 1.0]
            }
            
            grid_search = GridSearchCV(
                xgb.XGBRegressor(random_state=42),
                param_grid,
                cv=3,
                scoring='r2',
                n_jobs=-1,
                verbose=1
            )
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            grid_search.fit(X_train, y_train)
            
            # Update best model
            self.best_model = grid_search.best_estimator_
            
            logger.info(f"Best parameters: {grid_search.best_params_}")
            logger.info(f"Best CV score: {grid_search.best_score_:.4f}")
        
        elif self.best_model_name == 'random_forest':
            logger.info("Performing hyperparameter tuning for Random Forest...")
            
            param_grid = {
                'n_estimators': [50, 100, 200],
                'max_depth': [5, 10, 15, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
            
            grid_search = GridSearchCV(
                RandomForestRegressor(random_state=42),
                param_grid,
                cv=3,
                scoring='r2',
                n_jobs=-1,
                verbose=1
            )
            
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            grid_search.fit(X_train, y_train)
            
            # Update best model
            self.best_model = grid_search.best_estimator_
            
            logger.info(f"Best parameters: {grid_search.best_params_}")
            logger.info(f"Best CV score: {grid_search.best_score_:.4f}")
    
    def save_model(self, filepath: str) -> None:
        """Save the trained model and feature engineer"""
        if self.best_model is None:
            raise ValueError("No model has been trained yet")
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # Save model and associated components
        model_data = {
            'model': self.best_model,
            'model_name': self.best_model_name,
            'feature_engineer': self.feature_engineer,
            'feature_names': self.feature_names,
            'model_performance': self.models.get(self.best_model_name, {})
        }
        
        joblib.dump(model_data, filepath)
        logger.info(f"Saved model to {filepath}")
    
    def create_visualizations(self, results: Dict[str, Any], output_dir: str = "plots") -> None:
        """Create visualization plots for model performance"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Model comparison plot
        plt.figure(figsize=(12, 8))
        
        models = list(results.keys())
        test_r2_scores = [results[model]['test_r2'] for model in models]
        test_mae_scores = [results[model]['test_mae'] for model in models]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # R² scores
        ax1.bar(models, test_r2_scores, color='skyblue', alpha=0.7)
        ax1.set_title('Model Comparison - R² Score')
        ax1.set_ylabel('R² Score')
        ax1.set_ylim(0, 1)
        ax1.tick_params(axis='x', rotation=45)
        
        # MAE scores
        ax2.bar(models, test_mae_scores, color='lightcoral', alpha=0.7)
        ax2.set_title('Model Comparison - Mean Absolute Error')
        ax2.set_ylabel('MAE')
        ax2.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig(f"{output_dir}/model_comparison.png", dpi=300, bbox_inches='tight')
        plt.close()
        
        # Feature importance plot (for tree-based models)
        if hasattr(self.best_model, 'feature_importances_'):
            plt.figure(figsize=(10, 8))
            
            importances = self.best_model.feature_importances_
            indices = np.argsort(importances)[::-1]
            
            plt.title(f'Feature Importance - {self.best_model_name}')
            plt.bar(range(len(importances)), importances[indices])
            plt.xticks(range(len(importances)), 
                      [self.feature_names[i] for i in indices], 
                      rotation=45, ha='right')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/feature_importance.png", dpi=300, bbox_inches='tight')
            plt.close()
        
        logger.info(f"Saved visualizations to {output_dir}/")

def main():
    """Main training pipeline"""
    logger.info("Starting TrustGrid.AI model training pipeline...")
    
    # Initialize trainer
    feature_config = FeatureConfig(
        use_log_transform=True,
        use_robust_scaling=True,
        handle_outliers=True
    )
    feature_engineer = FeatureEngineer(feature_config)
    trainer = TrustScoreTrainer(feature_engineer)
    
    # Load data
    dataset_path = "data/demo_dataset.csv"
    if not os.path.exists(dataset_path):
        logger.error(f"Dataset not found: {dataset_path}")
        logger.info("Please run generate_synth.py first to create the dataset")
        return
    
    df = trainer.load_data(dataset_path)
    
    # Prepare features
    X, y, feature_names = trainer.prepare_features(df)
    
    # Train models
    results = trainer.train_models(X, y)
    
    # Hyperparameter tuning
    trainer.hyperparameter_tuning(X, y)
    
    # Save model
    model_path = "model.pkl"
    trainer.save_model(model_path)
    
    # Create visualizations
    trainer.create_visualizations(results)
    
    # Print final results
    logger.info("\n" + "="*50)
    logger.info("TRAINING COMPLETE")
    logger.info("="*50)
    logger.info(f"Best Model: {trainer.best_model_name}")
    logger.info(f"Test R² Score: {results[trainer.best_model_name]['test_r2']:.4f}")
    logger.info(f"Test MAE: {results[trainer.best_model_name]['test_mae']:.2f}")
    logger.info(f"Model saved to: {model_path}")
    logger.info("="*50)

if __name__ == "__main__":
    main()
