const { QrCode, Patient, Admission, User, Prescription } = require('../models');
const { generateQRDataURL } = require('../utils/qrGenerator');

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patient_id) where.patient_id = req.query.patient_id;
    if (req.query.admission_id) where.admission_id = req.query.admission_id;
    if (req.query.status === 'active') where.is_active = true;
    if (req.query.status === 'inactive') where.is_active = false;
    if (req.query.type) where.type = req.query.type;

    const qrCodes = await QrCode.findAll({
      where,
      include: [
        { model: Patient, as: 'patient' },
        { model: Admission, as: 'admission' },
        { model: Prescription, as: 'prescription', attributes: ['id', 'type', 'status'] },
        { model: User, as: 'boundUser', attributes: ['id', 'email', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    const data = await Promise.all(qrCodes.map(async qr => {
      const json = qr.toJSON();
      return {
        ...json,
        status: json.is_active ? (json.is_bound ? 'bound' : 'active') : 'inactive',
        qr_image: await generateQRDataURL(json.code),
      };
    }));

    res.json({ success: true, data });
  } catch (error) { next(error); }
};

exports.generate = async (req, res, next) => {
  try {
    const { patient_id, admission_id, type } = req.body;
    
    // Invalidate existing active QR codes for this admission
    if (admission_id) {
      await QrCode.update(
        { is_active: false },
        { where: { admission_id, is_active: true } }
      );
    }

    const qrCode = await QrCode.create({
      patient_id,
      admission_id,
      prescription_id: req.body.prescription_id || null,
      type: type || 'discharge',
    });

    const fullQr = await QrCode.findByPk(qrCode.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Admission, as: 'admission' }
      ]
    });

    res.status(201).json({ success: true, data: { ...fullQr.toJSON(), qr_image: await generateQRDataURL(fullQr.code) } });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const qrCode = await QrCode.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Admission, as: 'admission' },
        { model: User, as: 'boundUser', attributes: ['id', 'email', 'first_name', 'last_name'] }
      ]
    });
    if (!qrCode) return res.status(404).json({ success: false, message: 'QR Code not found.' });
    res.json({ success: true, data: qrCode });
  } catch (error) { next(error); }
};
