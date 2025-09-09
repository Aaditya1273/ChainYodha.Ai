import { promises as fs } from 'fs';
import path from 'path';

// Types for our storage entities
export interface WalletProfile {
  id?: string;
  walletAddress: string;
  totalTransactions: number;
  avgTransactionValue: number;
  uniqueContracts: number;
  gasEfficiency: number;
  timeSpread: number;
  riskLevel: string;
  classification: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrustScore {
  id?: string;
  walletAddress: string;
  overallScore: number;
  transactionHistory: number;
  contractInteraction: number;
  riskAssessment: number;
  networkActivity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScoreHistory {
  id?: string;
  walletAddress: string;
  score: number;
  timestamp?: Date;
}

interface StorageData {
  walletProfiles: WalletProfile[];
  trustScores: TrustScore[];
  scoreHistory: ScoreHistory[];
}

class SimpleStorage {
  private dataPath: string;
  private data: StorageData;

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'storage.json');
    this.data = {
      walletProfiles: [],
      trustScores: [],
      scoreHistory: []
    };
  }

  async initialize(): Promise<void> {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.dataPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to load existing data
      try {
        const fileContent = await fs.readFile(this.dataPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        
        // Convert date strings back to Date objects
        this.data.walletProfiles.forEach(profile => {
          if (profile.createdAt) profile.createdAt = new Date(profile.createdAt);
          if (profile.updatedAt) profile.updatedAt = new Date(profile.updatedAt);
        });
        
        this.data.trustScores.forEach(score => {
          if (score.createdAt) score.createdAt = new Date(score.createdAt);
          if (score.updatedAt) score.updatedAt = new Date(score.updatedAt);
        });
        
        this.data.scoreHistory.forEach(history => {
          if (history.timestamp) history.timestamp = new Date(history.timestamp);
        });
        
        console.log('Loaded existing storage data');
      } catch (error) {
        // File doesn't exist or is invalid, start with empty data
        console.log('Starting with empty storage data');
        await this.save();
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private async save(): Promise<void> {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save storage:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Wallet Profile methods
  async createWalletProfile(profile: Omit<WalletProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalletProfile> {
    const newProfile: WalletProfile = {
      ...profile,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.data.walletProfiles.push(newProfile);
    await this.save();
    return newProfile;
  }

  async findWalletProfileByAddress(address: string): Promise<WalletProfile | null> {
    const profile = this.data.walletProfiles.find(
      p => p.walletAddress.toLowerCase() === address.toLowerCase()
    );
    return profile || null;
  }

  async updateWalletProfile(address: string, updates: Partial<WalletProfile>): Promise<WalletProfile | null> {
    const index = this.data.walletProfiles.findIndex(
      p => p.walletAddress.toLowerCase() === address.toLowerCase()
    );

    if (index === -1) return null;

    this.data.walletProfiles[index] = {
      ...this.data.walletProfiles[index],
      ...updates,
      updatedAt: new Date()
    };

    await this.save();
    return this.data.walletProfiles[index];
  }

  // Trust Score methods
  async createTrustScore(score: Omit<TrustScore, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrustScore> {
    const newScore: TrustScore = {
      ...score,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove existing score for this wallet if it exists
    this.data.trustScores = this.data.trustScores.filter(
      s => s.walletAddress.toLowerCase() !== score.walletAddress.toLowerCase()
    );

    this.data.trustScores.push(newScore);
    await this.save();
    return newScore;
  }

  async findTrustScoreByAddress(address: string): Promise<TrustScore | null> {
    const score = this.data.trustScores.find(
      s => s.walletAddress.toLowerCase() === address.toLowerCase()
    );
    return score || null;
  }

  // Score History methods
  async createScoreHistory(history: Omit<ScoreHistory, 'id' | 'timestamp'>): Promise<ScoreHistory> {
    const newHistory: ScoreHistory = {
      ...history,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.data.scoreHistory.push(newHistory);
    await this.save();
    return newHistory;
  }

  async findScoreHistoryByAddress(address: string): Promise<ScoreHistory[]> {
    return this.data.scoreHistory.filter(
      h => h.walletAddress.toLowerCase() === address.toLowerCase()
    ).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  // Utility methods
  async getAllWalletProfiles(): Promise<WalletProfile[]> {
    return [...this.data.walletProfiles];
  }

  async getAllTrustScores(): Promise<TrustScore[]> {
    return [...this.data.trustScores];
  }

  async destroy(): Promise<void> {
    // Nothing to destroy for file-based storage
    console.log('Storage connection closed');
  }
}

// Export singleton instance
export const simpleStorage = new SimpleStorage();
