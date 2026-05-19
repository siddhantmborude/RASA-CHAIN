/**
 * RASA-CHAIN Blockchain Service
 * 
 * Modular blockchain abstraction layer.
 * Current: Simulated blockchain (Phase 1 - software only)
 * Future: Switch to 'polygon' or 'hyperledger' via BLOCKCHAIN_PROVIDER env var
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const BlockchainLog = require('../models/BlockchainLog');

class BlockchainService {
  constructor() {
    this.provider = process.env.BLOCKCHAIN_PROVIDER || 'simulated';
    this.network = this.provider;
    this.chainHead = null; // Tracks latest block for chain linking
  }

  /**
   * Generate a deterministic SHA-256 hash of data
   */
  generateDataHash(data) {
    const normalized = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Generate a simulated transaction hash
   */
  generateTxHash() {
    const entropy = `${uuidv4()}-${Date.now()}-${Math.random()}`;
    return '0x' + crypto.createHash('sha256').update(entropy).digest('hex');
  }

  /**
   * Get the latest block hash for chain linking
   */
  async getLatestBlockHash(batchId) {
    const latest = await BlockchainLog.findOne({ batchId }).sort({ timestamp: -1 });
    return latest ? latest.dataHash : '0x' + '0'.repeat(64);
  }

  /**
   * Record an event on the blockchain (simulated or real)
   * This is the main entry point - all events go through here
   */
  async recordEvent({ eventType, batchId, batchRef, userId, userRole, userName, payload }) {
    if (this.provider === 'simulated') {
      return this._recordSimulated({ eventType, batchId, batchRef, userId, userRole, userName, payload });
    } else if (this.provider === 'polygon') {
      return this._recordPolygon({ eventType, batchId, batchRef, userId, userRole, userName, payload });
    } else if (this.provider === 'hyperledger') {
      return this._recordHyperledger({ eventType, batchId, batchRef, userId, userRole, userName, payload });
    }
    throw new Error(`Unsupported blockchain provider: ${this.provider}`);
  }

  /**
   * SIMULATED BLOCKCHAIN (Phase 1)
   * Creates realistic blockchain-like records with real cryptographic hashing
   */
  async _recordSimulated({ eventType, batchId, batchRef, userId, userRole, userName, payload }) {
    const timestamp = new Date();
    const previousHash = await this.getLatestBlockHash(batchId);
    const txHash = this.generateTxHash();
    const blockNumber = Math.floor(Math.random() * 9000000) + 1000000;

    const hashInput = {
      previousHash,
      eventType,
      batchId,
      userId: userId?.toString(),
      payload,
      timestamp: timestamp.toISOString(),
      txHash,
    };
    const dataHash = this.generateDataHash(hashInput);

    const log = await BlockchainLog.create({
      txHash,
      blockNumber,
      blockHash: '0x' + this.generateDataHash({ blockNumber, txHash, timestamp }),
      eventType,
      batchId,
      batchRef,
      userId,
      userRole,
      userName,
      network: 'simulated',
      payload,
      previousHash,
      dataHash,
      timestamp,
      gasUsed: Math.floor(Math.random() * 50000) + 21000,
      confirmations: 12,
      status: 'confirmed',
    });

    return {
      success: true,
      txHash,
      blockNumber,
      dataHash,
      timestamp,
      network: 'simulated',
      log,
    };
  }

  /**
   * POLYGON BLOCKCHAIN (Phase 2 - Real)
   * Uncomment and configure when switching to real blockchain
   */
  async _recordPolygon({ eventType, batchId, batchRef, userId, userRole, userName, payload }) {
    // TODO: Phase 2 - Real Polygon integration
    // const { ethers } = require('ethers');
    // const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    // const wallet = new ethers.Wallet(process.env.POLYGON_PRIVATE_KEY, provider);
    // const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);
    // const tx = await contract.recordEvent(eventType, batchId, JSON.stringify(payload));
    // const receipt = await tx.wait();
    // return { txHash: receipt.hash, blockNumber: receipt.blockNumber, ... };
    throw new Error('Polygon integration not yet configured. Set BLOCKCHAIN_PROVIDER=simulated for Phase 1.');
  }

  /**
   * HYPERLEDGER FABRIC (Phase 2 Alternative)
   */
  async _recordHyperledger({ eventType, batchId, batchRef, userId, userRole, userName, payload }) {
    // TODO: Phase 2 - Hyperledger Fabric SDK integration
    // const { Gateway, Wallets } = require('fabric-network');
    // ... Hyperledger Fabric connection and transaction submission
    throw new Error('Hyperledger integration not yet configured. Set BLOCKCHAIN_PROVIDER=simulated for Phase 1.');
  }

  /**
   * Verify a transaction hash exists and is valid
   */
  async verifyTransaction(txHash) {
    const log = await BlockchainLog.findOne({ txHash });
    if (!log) return { valid: false, reason: 'Transaction not found' };

    // Verify chain integrity
    const isValid = await this.verifyChainIntegrity(log.batchId);

    return {
      valid: isValid,
      log,
      network: log.network,
      timestamp: log.timestamp,
      blockNumber: log.blockNumber,
      confirmations: log.confirmations,
    };
  }

  /**
   * Verify all blockchain records for a batch (tamper detection)
   */
  async verifyChainIntegrity(batchId) {
    const logs = await BlockchainLog.find({ batchId }).sort({ timestamp: 1 });
    if (logs.length === 0) return true;

    // Verify hash chain (each block links to previous)
    for (let i = 1; i < logs.length; i++) {
      if (logs[i].previousHash !== logs[i - 1].dataHash) {
        // Mark as invalid
        await BlockchainLog.updateOne({ _id: logs[i]._id }, { isValid: false, validatedAt: new Date() });
        return false;
      }
    }

    return true;
  }

  /**
   * Get all blockchain records for a batch
   */
  async getBatchHistory(batchId) {
    return BlockchainLog.find({ batchId })
      .populate('userId', 'name email role')
      .sort({ timestamp: 1 });
  }

  /**
   * Get recent blockchain transactions (explorer)
   */
  async getRecentTransactions(limit = 20) {
    return BlockchainLog.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}

module.exports = new BlockchainService();
