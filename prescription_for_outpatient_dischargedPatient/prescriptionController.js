const QRCode = require("qrcode");
const crypto = require("crypto");

// Replace these with your real DB models (e.g. Mongoose/Sequelize)
// const Patient = require("../models/Patient");
// const Prescription = require("../models/Prescription");

/**
 * GET /api/prescriptions/:patientId/discharge
 *
 * Returns everything the printable discharge document needs:
 *  - patient + admission info
 *  - the list of take-home prescriptions
 *  - a QR code (as a base64 data URL) that links to the patient portal
 *
 * The QR code encodes a one-time linking token, NOT the medication data
 * itself. That token is what the patient portal uses to permanently bind
 * the QR to the patient's account on first scan (see linkPortalToken below).
 */
async function getDischargeDocument(req, res) {
  try {
    const { patientId } = req.params;

    // 1. Fetch patient + prescriptions from your DB.
    // Swap this block for real queries, e.g.:
    // const patient = await Patient.findById(patientId);
    // const prescriptions = await Prescription.find({ patientId, takeHome: true });
    const patient = await findPatientById(patientId);
    const prescriptions = await findTakeHomePrescriptions(patientId);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // 2. Create (or reuse) a secure, unguessable linking token for this
    // discharge document. Store it so /api/portal/link can verify it later.
    const linkToken = await getOrCreateLinkToken(patientId);

    // 3. Build the URL the QR code will point to. Scanning it opens the
    // patient portal, which exchanges the token for a permanent account link.
    const portalUrl = `${process.env.PATIENT_PORTAL_URL}/link?token=${linkToken}`;

    // 4. Render the QR code server-side as a PNG data URL so the frontend
    // can just drop it into an <img src="..."> with no extra QR library.
    const qrCodeDataUrl = await QRCode.toDataURL(portalUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 260,
      color: { dark: "#12213A", light: "#FFFFFF" },
    });

    return res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        patientCode: patient.patientCode, // e.g. hospital MRN
        room: patient.room,
        attendingPhysician: patient.attendingPhysician,
        dateOfBirth: patient.dateOfBirth,
      },
      dischargeDate: new Date().toISOString(),
      prescriptions: prescriptions.map((p) => ({
        id: p.id,
        medicineName: p.medicineName,
        dosage: p.dosage,
        frequency: p.frequency,
        durationDays: p.durationDays,
        instructions: p.instructions,
      })),
      qrCodeDataUrl,
      portalUrl,
    });
  } catch (err) {
    console.error("getDischargeDocument error:", err);
    return res.status(500).json({ error: "Failed to build discharge document" });
  }
}

/**
 * POST /api/portal/link
 * Body: { token }
 *
 * Called by the patient portal after the patient logs in / registers /
 * signs in with Google, right after scanning the QR code. Permanently
 * binds the token (and therefore the prescription record) to that
 * patient's portal account, and invalidates the token for future reuse.
 */
async function linkPortalToken(req, res) {
  try {
    const { token } = req.body;
    const userId = req.user?.id; // set by your auth middleware

    if (!token || !userId) {
      return res.status(400).json({ error: "Missing token or authenticated user" });
    }

    const tokenRecord = await findLinkToken(token);

    if (!tokenRecord) {
      return res.status(404).json({ error: "Invalid or expired code" });
    }
    if (tokenRecord.linkedUserId && tokenRecord.linkedUserId !== userId) {
      return res.status(403).json({ error: "This code is already linked to another account" });
    }

    await bindTokenToUser(token, userId);

    return res.json({ success: true, patientId: tokenRecord.patientId });
  } catch (err) {
    console.error("linkPortalToken error:", err);
    return res.status(500).json({ error: "Failed to link account" });
  }
}

// ---- Stubs below: replace with real DB calls ----

async function findPatientById(id) {
  return {
    id,
    name: "Juan Dela Cruz",
    patientCode: "MRN-2026-00481",
    room: "Ward 3 - Bed 12",
    attendingPhysician: "Dr. Maria Santos",
    dateOfBirth: "1988-04-12",
  };
}

async function findTakeHomePrescriptions(patientId) {
  return [
    {
      id: "rx1",
      medicineName: "Amoxicillin",
      dosage: "500 mg",
      frequency: "3x a day",
      durationDays: 7,
      instructions: "Take after meals",
    },
    {
      id: "rx2",
      medicineName: "Paracetamol",
      dosage: "500 mg",
      frequency: "Every 4-6 hrs as needed",
      durationDays: 5,
      instructions: "For fever above 38°C",
    },
  ];
}

async function getOrCreateLinkToken(patientId) {
  // In production: look up an existing unused token for this discharge
  // record, or create + persist a new one.
  return crypto.randomBytes(16).toString("hex");
}

async function findLinkToken(token) {
  return { token, patientId: "demo-patient-id", linkedUserId: null };
}

async function bindTokenToUser(token, userId) {
  // Persist: UPDATE link_tokens SET linkedUserId = ? WHERE token = ?
  return true;
}

module.exports = { getDischargeDocument, linkPortalToken };
