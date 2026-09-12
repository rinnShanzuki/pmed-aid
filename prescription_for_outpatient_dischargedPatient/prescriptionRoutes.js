const express = require("express");
const router = express.Router();
const {
  getDischargeDocument,
  linkPortalToken,
} = require("../controllers/prescriptionController");

// GET the printable discharge document (prescription list + QR code)
router.get("/prescriptions/:patientId/discharge", getDischargeDocument);

// POST called by the patient portal after login/register/Google sign-in
// to permanently link the scanned QR code to the patient's account
router.post("/portal/link", /* authMiddleware, */ linkPortalToken);

module.exports = router;

/**
 * In your main server file (e.g. server.js / app.js):
 *
 *   const prescriptionRoutes = require("./routes/prescriptionRoutes");
 *   app.use("/api", prescriptionRoutes);
 *
 * Install the one extra dependency this needs:
 *   npm install qrcode
 */
