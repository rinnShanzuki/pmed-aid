const sequelize = require('./src/config/db');

async function migrate() {
  try {
    console.log('Starting data spec migrations...');

    // 1. Consultations
    console.log('Updating consultations...');
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN department VARCHAR(255) NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN chief_complaint TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN hpi TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN symptoms TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN findings TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN vital_signs JSON NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN assessment TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE consultations ADD COLUMN follow_up_date DATE NULL"); } catch (e) { console.log(e.message); }

    // 2. Admissions
    console.log('Updating admissions...');
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN department VARCHAR(255) NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN reason_for_admission TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN treatment_plan TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN progress_notes TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN nurse_notes TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN final_diagnosis TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN condition_at_discharge VARCHAR(255) NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN discharge_summary TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN discharge_assessment TEXT NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN follow_up_date DATE NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE admissions ADD COLUMN follow_up_instructions TEXT NULL"); } catch (e) { console.log(e.message); }

    // 3. PrescriptionItems
    console.log('Updating prescription_items...');
    try { await sequelize.query("ALTER TABLE prescription_items ADD COLUMN start_date DATE NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE prescription_items ADD COLUMN end_date DATE NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE prescription_items ADD COLUMN status ENUM('active', 'completed', 'discontinued') NOT NULL DEFAULT 'active'"); } catch (e) { console.log(e.message); }

    // 4. MedicationSchedules
    console.log('Updating medication_schedules...');
    try { await sequelize.query("ALTER TABLE medication_schedules MODIFY COLUMN status ENUM('pending', 'completed', 'missed', 'skipped', 'administered', 'refused') NOT NULL DEFAULT 'pending'"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE medication_schedules ADD COLUMN qr_scan_reference VARCHAR(255) NULL"); } catch (e) { console.log(e.message); }

    // 5. QrCodes
    console.log('Updating qr_codes...');
    try { await sequelize.query("ALTER TABLE qr_codes ADD COLUMN expiration_date DATE NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE qr_codes ADD COLUMN first_scan_date DATETIME NULL"); } catch (e) { console.log(e.message); }
    try { await sequelize.query("ALTER TABLE qr_codes ADD COLUMN last_scan_date DATETIME NULL"); } catch (e) { console.log(e.message); }

    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
