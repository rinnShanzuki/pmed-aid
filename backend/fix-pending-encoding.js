/**
 * Fix: Change Cha Gonz prescription from pending_encoding to active
 * or delete empty pending_encoding prescriptions
 */

const { Prescription, PrescriptionItem } = require('./src/models');
const sequelize = require('./src/config/db');

async function fixPendingEncoding() {
  try {
    console.log('🔧 Fixing pending_encoding prescriptions...');
    
    // Find all pending_encoding prescriptions
    const prescriptions = await Prescription.findAll({
      where: { status: 'pending_encoding' },
      include: [{ model: PrescriptionItem, as: 'items' }]
    });

    console.log(`Found ${prescriptions.length} pending_encoding prescriptions`);

    for (const rx of prescriptions) {
      // If no items, delete it
      if (!rx.items || rx.items.length === 0) {
        console.log(`Deleting empty prescription for patient ${rx.patient_id}...`);
        await Prescription.destroy({ where: { id: rx.id } });
      } else {
        // If has items, change to active
        console.log(`Changing prescription ${rx.id} to active...`);
        await rx.update({ status: 'active' });
      }
    }

    console.log('✅ Fixed all pending_encoding prescriptions');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPendingEncoding();
