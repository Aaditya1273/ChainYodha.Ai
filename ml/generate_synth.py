"""
Synthetic Dataset Generator for TrustGrid.AI

Generates realistic synthetic wallet data with trust labels for training
the trust scoring model.
"""

import numpy as np
import pandas as pd
import random
from typing import List, Dict, Tuple
from dataclasses import dataclass
import os

@dataclass
class WalletProfile:
    """Represents a synthetic wallet profile"""
    address: str
    total_transactions: int
    contract_interactions: int
    unique_contracts_interacted: int
    average_transaction_value: float
    swap_frequency: int
    bridge_transactions: int
    portfolio_volatility: float
    account_age: int
    has_ens: bool
    farcaster_followers: int
    github_contributions: int
    top_tokens: List[Dict]
    trust_label: int  # 0-100 trust score

class SyntheticDataGenerator:
    """
    Generates synthetic wallet data with realistic distributions
    and correlations for training trust scoring models.
    """
    
    def __init__(self, seed: int = 42):
        self.seed = seed
        np.random.seed(seed)
        random.seed(seed)
        
        # Define wallet archetypes with different characteristics
        self.archetypes = {
            'high_trust_defi_user': {
                'trust_range': (80, 95),
                'tx_range': (200, 1000),
                'contract_ratio': (0.4, 0.7),
                'age_range': (180, 730),
                'ens_prob': 0.8,
                'social_prob': 0.6,
                'volatility_range': (0.2, 0.8)
            },
            'medium_trust_trader': {
                'trust_range': (60, 79),
                'tx_range': (50, 300),
                'contract_ratio': (0.2, 0.5),
                'age_range': (90, 365),
                'ens_prob': 0.4,
                'social_prob': 0.3,
                'volatility_range': (0.5, 1.5)
            },
            'low_trust_new_user': {
                'trust_range': (40, 59),
                'tx_range': (10, 80),
                'contract_ratio': (0.1, 0.3),
                'age_range': (7, 90),
                'ens_prob': 0.1,
                'social_prob': 0.1,
                'volatility_range': (0.3, 1.2)
            },
            'very_low_trust_suspicious': {
                'trust_range': (10, 39),
                'tx_range': (1, 50),
                'contract_ratio': (0.0, 0.2),
                'age_range': (1, 30),
                'ens_prob': 0.05,
                'social_prob': 0.02,
                'volatility_range': (1.0, 3.0)
            },
            'whale_investor': {
                'trust_range': (85, 98),
                'tx_range': (100, 500),
                'contract_ratio': (0.3, 0.6),
                'age_range': (365, 1095),
                'ens_prob': 0.9,
                'social_prob': 0.7,
                'volatility_range': (0.1, 0.5)
            }
        }
        
        # Token symbols for portfolio generation
        self.token_symbols = [
            'ETH', 'USDC', 'USDT', 'ARB', 'WBTC', 'DAI', 'LINK', 'UNI',
            'AAVE', 'CRV', 'COMP', 'MKR', 'SNX', 'YFI', 'SUSHI', 'BAL'
        ]
    
    def generate_wallet_address(self) -> str:
        """Generate a random Ethereum address"""
        return '0x' + ''.join(random.choices('0123456789abcdef', k=40))
    
    def generate_wallet_profile(self, archetype: str) -> WalletProfile:
        """
        Generate a wallet profile based on the specified archetype
        
        Args:
            archetype: The wallet archetype to generate
            
        Returns:
            WalletProfile instance
        """
        config = self.archetypes[archetype]
        
        # Generate basic metrics
        trust_score = random.randint(*config['trust_range'])
        total_transactions = random.randint(*config['tx_range'])
        
        # Contract interactions based on transaction count and archetype
        contract_ratio = random.uniform(*config['contract_ratio'])
        contract_interactions = int(total_transactions * contract_ratio)
        
        # Unique contracts (with some correlation to total interactions)
        unique_contracts = min(
            contract_interactions,
            max(1, int(contract_interactions * random.uniform(0.1, 0.8)))
        )
        
        # Average transaction value (log-normal distribution)
        if archetype == 'whale_investor':
            avg_tx_value = np.random.lognormal(2.0, 1.0)  # Higher values for whales
        else:
            avg_tx_value = np.random.lognormal(0.5, 0.8)
        
        # Swap frequency correlated with DeFi activity
        if contract_interactions > 0:
            swap_frequency = max(0, int(contract_interactions * random.uniform(0.2, 0.6)))
        else:
            swap_frequency = 0
        
        # Bridge transactions (less common)
        bridge_prob = 0.3 if trust_score > 60 else 0.1
        bridge_transactions = random.randint(0, 5) if random.random() < bridge_prob else 0
        
        # Portfolio volatility
        portfolio_volatility = random.uniform(*config['volatility_range'])
        
        # Account age
        account_age = random.randint(*config['age_range'])
        
        # ENS domain
        has_ens = random.random() < config['ens_prob']
        
        # Social signals
        if random.random() < config['social_prob']:
            farcaster_followers = max(0, int(np.random.exponential(50)))
            github_contributions = max(0, int(np.random.exponential(30)))
        else:
            farcaster_followers = 0
            github_contributions = 0
        
        # Generate token portfolio
        top_tokens = self.generate_token_portfolio(archetype)
        
        return WalletProfile(
            address=self.generate_wallet_address(),
            total_transactions=total_transactions,
            contract_interactions=contract_interactions,
            unique_contracts_interacted=unique_contracts,
            average_transaction_value=avg_tx_value,
            swap_frequency=swap_frequency,
            bridge_transactions=bridge_transactions,
            portfolio_volatility=portfolio_volatility,
            account_age=account_age,
            has_ens=has_ens,
            farcaster_followers=farcaster_followers,
            github_contributions=github_contributions,
            top_tokens=top_tokens,
            trust_label=trust_score
        )
    
    def generate_token_portfolio(self, archetype: str) -> List[Dict]:
        """Generate a realistic token portfolio"""
        num_tokens = random.randint(1, 5)
        selected_tokens = random.sample(self.token_symbols, num_tokens)
        
        # Generate random percentages that sum to 100
        percentages = np.random.dirichlet(np.ones(num_tokens)) * 100
        
        portfolio = []
        for token, percentage in zip(selected_tokens, percentages):
            # Generate mock balance based on percentage and token type
            if token in ['USDC', 'USDT', 'DAI']:  # Stablecoins
                balance = f"{percentage * 10:.2f}"
            elif token == 'ETH':
                balance = f"{percentage / 100:.4f}"
            elif token == 'WBTC':
                balance = f"{percentage / 1000:.6f}"
            else:
                balance = f"{percentage * 5:.2f}"
            
            portfolio.append({
                'address': self.generate_wallet_address(),
                'symbol': token,
                'balance': balance,
                'percentage': round(percentage, 2)
            })
        
        return sorted(portfolio, key=lambda x: x['percentage'], reverse=True)
    
    def generate_dataset(self, 
                        total_samples: int = 1000,
                        archetype_distribution: Dict[str, float] = None) -> pd.DataFrame:
        """
        Generate a complete synthetic dataset
        
        Args:
            total_samples: Total number of wallet profiles to generate
            archetype_distribution: Distribution of archetypes (defaults to balanced)
            
        Returns:
            DataFrame containing the synthetic dataset
        """
        if archetype_distribution is None:
            archetype_distribution = {
                'high_trust_defi_user': 0.25,
                'medium_trust_trader': 0.30,
                'low_trust_new_user': 0.25,
                'very_low_trust_suspicious': 0.15,
                'whale_investor': 0.05
            }
        
        # Validate distribution
        if abs(sum(archetype_distribution.values()) - 1.0) > 0.01:
            raise ValueError("Archetype distribution must sum to 1.0")
        
        profiles = []
        
        for archetype, proportion in archetype_distribution.items():
            num_samples = int(total_samples * proportion)
            
            for _ in range(num_samples):
                profile = self.generate_wallet_profile(archetype)
                profiles.append(profile)
        
        # Convert to DataFrame
        data = []
        for profile in profiles:
            row = {
                'wallet_address': profile.address,
                'total_transactions': profile.total_transactions,
                'contract_interactions': profile.contract_interactions,
                'unique_contracts_interacted': profile.unique_contracts_interacted,
                'average_transaction_value': profile.average_transaction_value,
                'swap_frequency': profile.swap_frequency,
                'bridge_transactions': profile.bridge_transactions,
                'portfolio_volatility': profile.portfolio_volatility,
                'account_age': profile.account_age,
                'has_ens': profile.has_ens,
                'farcaster_followers': profile.farcaster_followers,
                'github_contributions': profile.github_contributions,
                'token_count': len(profile.top_tokens),
                'trust_score': profile.trust_label
            }
            
            # Add token portfolio features
            if profile.top_tokens:
                row['top_token_percentage'] = profile.top_tokens[0]['percentage']
                row['portfolio_concentration'] = sum(
                    (token['percentage'] / 100) ** 2 for token in profile.top_tokens
                )
            else:
                row['top_token_percentage'] = 100.0
                row['portfolio_concentration'] = 1.0
            
            data.append(row)
        
        df = pd.DataFrame(data)
        
        # Add some noise and correlations to make it more realistic
        df = self._add_realistic_noise(df)
        
        return df
    
    def _add_realistic_noise(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add realistic noise and correlations to the dataset"""
        df = df.copy()
        
        # Add some noise to continuous variables
        noise_columns = [
            'average_transaction_value', 'portfolio_volatility',
            'farcaster_followers', 'github_contributions'
        ]
        
        for col in noise_columns:
            if col in df.columns:
                noise = np.random.normal(0, df[col].std() * 0.05, len(df))
                df[col] = np.maximum(0, df[col] + noise)
        
        # Ensure trust scores are within bounds
        df['trust_score'] = np.clip(df['trust_score'], 0, 100)
        
        return df
    
    def save_dataset(self, df: pd.DataFrame, filepath: str) -> None:
        """Save dataset to CSV file"""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        df.to_csv(filepath, index=False)
        print(f"Saved dataset with {len(df)} samples to {filepath}")
    
    def generate_demo_wallets(self) -> List[Dict]:
        """Generate specific demo wallets for testing"""
        demo_wallets = []
        
        # High trust wallet
        high_trust = self.generate_wallet_profile('whale_investor')
        demo_wallets.append({
            'address': '0x1234567890123456789012345678901234567890',
            'profile': high_trust,
            'description': 'High trust DeFi whale with long history'
        })
        
        # Medium trust wallet
        medium_trust = self.generate_wallet_profile('medium_trust_trader')
        demo_wallets.append({
            'address': '0x5678901234567890123456789012345678901234',
            'profile': medium_trust,
            'description': 'Medium trust active trader'
        })
        
        # Low trust wallet
        low_trust = self.generate_wallet_profile('very_low_trust_suspicious')
        demo_wallets.append({
            'address': '0x9abcdef123456789012345678901234567890123',
            'profile': low_trust,
            'description': 'Low trust new or suspicious account'
        })
        
        return demo_wallets

if __name__ == "__main__":
    # Generate synthetic dataset
    generator = SyntheticDataGenerator(seed=42)
    
    # Generate main dataset
    print("Generating synthetic dataset...")
    df = generator.generate_dataset(total_samples=2000)
    
    # Save to file
    os.makedirs('data', exist_ok=True)
    generator.save_dataset(df, 'data/demo_dataset.csv')
    
    # Print dataset statistics
    print("\nDataset Statistics:")
    print(f"Total samples: {len(df)}")
    print(f"Trust score distribution:")
    print(df['trust_score'].describe())
    
    print(f"\nArchetype distribution (approximate):")
    trust_ranges = [
        (0, 39, 'Very Low Trust'),
        (40, 59, 'Low Trust'),
        (60, 79, 'Medium Trust'),
        (80, 95, 'High Trust'),
        (96, 100, 'Very High Trust')
    ]
    
    for min_score, max_score, label in trust_ranges:
        count = len(df[(df['trust_score'] >= min_score) & (df['trust_score'] <= max_score)])
        percentage = count / len(df) * 100
        print(f"  {label}: {count} ({percentage:.1f}%)")
    
    # Generate demo wallets
    print("\nGenerating demo wallets...")
    demo_wallets = generator.generate_demo_wallets()
    
    for wallet in demo_wallets:
        print(f"\n{wallet['description']}:")
        print(f"  Address: {wallet['address']}")
        print(f"  Trust Score: {wallet['profile'].trust_label}")
        print(f"  Transactions: {wallet['profile'].total_transactions}")
        print(f"  Account Age: {wallet['profile'].account_age} days")
