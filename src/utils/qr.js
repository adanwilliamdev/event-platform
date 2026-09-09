'use strict';
/**
 * Geração de QR Code para ingressos (equivalente a app/qr.py).
 */
const QRCode = require('qrcode');

/**
 * Gera um QR code em PNG codificado como base64 (sem o prefixo data URI),
 * igual ao retorno de generate_qr_code_base64 no backend Python.
 * @param {string} data
 * @returns {Promise<string>}
 */
async function generateQrCodeBase64(data) {
  const buffer = await QRCode.toBuffer(data, {
    type: 'png',
    width: 8 * 37, // aproxima o box_size=8 usado no qrcode Python
    margin: 2,
  });
  return buffer.toString('base64');
}

module.exports = { generateQrCodeBase64 };
