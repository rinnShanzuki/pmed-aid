const QRCode = require('qrcode');

/**
 * Generate a QR code as a Data URL (base64-encoded PNG image).
 * @param {string} data - The data to encode in the QR code
 * @param {Object} [options] - QR code options
 * @returns {Promise<string>} Data URL of the QR code image
 */
async function generateQRDataURL(data, options = {}) {
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

  return QRCode.toDataURL(data, defaultOptions);
}

/**
 * Generate a QR code as a Buffer (for file saving or HTTP response).
 * @param {string} data - The data to encode
 * @param {Object} [options] - QR code options
 * @returns {Promise<Buffer>} QR code image buffer
 */
async function generateQRBuffer(data, options = {}) {
  const defaultOptions = {
    type: 'png',
    width: 300,
    margin: 2,
    ...options,
  };

  return QRCode.toBuffer(data, defaultOptions);
}

/**
 * Generate a QR code as an SVG string.
 * @param {string} data - The data to encode
 * @param {Object} [options] - QR code options
 * @returns {Promise<string>} SVG string of the QR code
 */
async function generateQRSVG(data, options = {}) {
  return QRCode.toString(data, { type: 'svg', ...options });
}

module.exports = {
  generateQRDataURL,
  generateQRBuffer,
  generateQRSVG,
};
