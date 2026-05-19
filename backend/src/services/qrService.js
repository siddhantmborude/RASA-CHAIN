const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

class QRService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', 'qr');
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generate QR code as base64 data URL
   */
  async generateQRBase64(data, options = {}) {
    const qrOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      width: 300,
      errorCorrectionLevel: 'H',
      ...options,
    };
    return await QRCode.toDataURL(data, qrOptions);
  }

  /**
   * Generate QR code for a product batch
   * QR encodes the public verification URL
   */
  async generateBatchQR(batchId) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${batchId}`;
    const qrData = JSON.stringify({
      batchId,
      url: verificationUrl,
      platform: 'RASA-CHAIN',
      timestamp: new Date().toISOString(),
    });

    const base64 = await this.generateQRBase64(qrData);
    return { base64, verificationUrl };
  }

  /**
   * Save QR code to disk
   */
  async saveQRToFile(batchId) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${batchId}`;
    const filePath = path.join(this.uploadDir, `${batchId}.png`);

    await QRCode.toFile(filePath, verificationUrl, {
      color: { dark: '#1a1a2e', light: '#ffffff' },
      width: 400,
      errorCorrectionLevel: 'H',
    });

    return `/uploads/qr/${batchId}.png`;
  }
}

module.exports = new QRService();
