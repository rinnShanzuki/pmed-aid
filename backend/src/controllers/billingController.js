const { Bill, BillItem, Admission, Patient, Room, Prescription, PrescriptionItem, Medication } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.patient_id) where.patient_id = req.query.patient_id;
    if (req.query.admission_id) where.admission_id = req.query.admission_id;
    if (req.query.status) where.status = req.query.status;

    const bills = await Bill.findAll({
      where,
      include: [
        { model: Patient, as: 'patient' },
        { model: Admission, as: 'admission', include: [{ model: Room, as: 'room' }] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: bills });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const bill = await Bill.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Admission, as: 'admission', include: [{ model: Room, as: 'room' }] },
        { model: BillItem, as: 'items' }
      ]
    });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, data: bill });
  } catch (error) { next(error); }
};

exports.generateBill = async (req, res, next) => {
  try {
    const { admission_id } = req.body;
    
    const admission = await Admission.findByPk(admission_id, {
      include: [
        { model: Room, as: 'room' },
        { model: Patient, as: 'patient' },
        { 
          model: Prescription, 
          as: 'prescriptions',
          include: [{ model: PrescriptionItem, as: 'items' }]
        }
      ]
    });

    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found.' });

    // Check if bill already exists
    let bill = await Bill.findOne({ where: { admission_id, status: 'unpaid' } });
    if (bill) {
      // Destroy old items to regenerate
      await BillItem.destroy({ where: { bill_id: bill.id } });
    } else {
      bill = await Bill.create({
        patient_id: admission.patient_id,
        admission_id: admission.id,
        status: 'unpaid'
      });
    }

    const items = [];
    let total_amount = 0;

    // Calculate room charges
    const endDate = admission.discharge_date || new Date();
    const startDate = admission.admission_date;
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
    
    if (admission.room && admission.room.price_per_day > 0) {
      const roomTotal = diffDays * admission.room.price_per_day;
      items.push({
        bill_id: bill.id,
        description: `Room Charge (${admission.room.room_type} - ${diffDays} days)`,
        item_type: 'room_charge',
        quantity: diffDays,
        unit_price: admission.room.price_per_day,
        total_price: roomTotal
      });
      total_amount += roomTotal;
    }

    // Calculate medication charges by looking up Medication by name
    if (admission.prescriptions) {
      for (const p of admission.prescriptions) {
        for (const pItem of p.items) {
          // Look up the medication by name to get the unit_price
          const med = await Medication.findOne({ where: { name: pItem.medication_name } });
          const unitPrice = med?.unit_price || 0;
          if (unitPrice > 0) {
            const qty = pItem.frequency * pItem.duration; // total doses
            const medTotal = qty * unitPrice;
            items.push({
              bill_id: bill.id,
              description: `Medication: ${pItem.medication_name}`,
              item_type: 'medication',
              quantity: qty,
              unit_price: unitPrice,
              total_price: medTotal
            });
            total_amount += medTotal;
          }
        }
      }
    }

    if (items.length > 0) {
      await BillItem.bulkCreate(items);
    }

    await bill.update({ total_amount });

    const fullBill = await Bill.findByPk(bill.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: BillItem, as: 'items' }
      ]
    });

    res.status(201).json({ success: true, data: fullBill });
  } catch (error) { next(error); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    
    const updateData = { status };
    if (notes) updateData.notes = notes;
    if (status === 'paid') updateData.payment_date = new Date();

    await bill.update(updateData);
    res.json({ success: true, data: bill });
  } catch (error) { next(error); }
};
