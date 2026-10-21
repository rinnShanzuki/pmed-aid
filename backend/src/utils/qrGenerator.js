const QRCode = require('qrcode');

/**
 * Format a QR payload to a full clickable portal URL if it's a PMED code.
 * @param {string} data - raw code or existing URL
 * @returns {string} full registration/binding URL
 */
function formatQRPayload(data) {
  if (!data || typeof data !== 'string') return data;
  if (data.startsWith('http://') || data.startsWith('https://')) {
    return data;
  }
  const frontendUrl = (process.env.FRONTEND_URL || 'https://pmed.rvrnn.online').replace(/\/+$/, '');
  return `${frontendUrl}/register?code=${encodeURIComponent(data)}`;
}

/**
 * Generate a QR code as a Data URL (base64-encoded PNG image).
 * Encodes full portal registration URL so standard phone cameras open the signup page.
 * @param {string} data - The data to encode in the QR code
 * @param {Object} [options] - QR code options
 * @returns {Promise<string>} Data URL of the QR code image
 */
async function generateQRDataURL(data, options = {}) {
  const payload = formatQRPayload(data);
  const defaultOptions = {
    type: 'image/png',
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    ...options,
  };

  return QRCode.toDataURL(payload, defaultOptions);
}

/**
 * Generate a QR code as a Buffer (for file saving or HTTP response).
 * @param {string} data - The data to encode
 * @param {Object} [options] - QR code options
 * @returns {Promise<Buffer>} QR code image buffer
 */
async function generateQRBuffer(data, options = {}) {
  const payload = formatQRPayload(data);
  const defaultOptions = {
    type: 'png',
    width: 300,
    margin: 2,
    ...options,
  };

  return QRCode.toBuffer(payload, defaultOptions);
}

/**
 * Generate a QR code as an SVG string.
 * @param {string} data - The data to encode
 * @param {Object} [options] - QR code options
 * @returns {Promise<string>} SVG string of the QR code
 */
async function generateQRSVG(data, options = {}) {
  const payload = formatQRPayload(data);
  return QRCode.toString(payload, { type: 'svg', ...options });
}

module.exports = {
  formatQRPayload,
  generateQRDataURL,
  generateQRBuffer,
  generateQRSVG,
};
