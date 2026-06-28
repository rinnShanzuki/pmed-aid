/**
 * Schedule Generator Utility
 * 
 * Generates individual dose schedule entries from a prescription item.
 * Distributes doses evenly across waking hours (6:00 AM - 10:00 PM).
 */

/**
 * Generate medication schedule entries for a single prescription item.
 * @param {Object} item - Prescription item data
 * @param {number} item.id - Prescription item ID
 * @param {number} item.prescription_id - Prescription ID
 * @param {number} item.admission_id - Admission ID
 * @param {number} item.patient_id - Patient ID
 * @param {number} item.frequency - Number of doses per frequency_unit
 * @param {string} item.frequency_unit - 'hourly', 'daily', or 'weekly'
 * @param {number} item.duration - Duration value
 * @param {string} item.duration_unit - 'days', 'weeks', or 'months'
 * @param {Date} [startDate] - When to start the schedule (defaults to now)
 * @returns {Array} Array of schedule entry objects
 */
function generateSchedule(item, startDate = new Date()) {
  const entries = [];

  // Calculate total days
  let totalDays;
  switch (item.duration_unit) {
    case 'weeks':
      totalDays = item.duration * 7;
      break;
    case 'months':
      totalDays = item.duration * 30;
      break;
    case 'days':
    default:
      totalDays = item.duration;
      break;
  }

  // Calculate doses per day
  let dosesPerDay;
  switch (item.frequency_unit) {
    case 'hourly':
      dosesPerDay = Math.min(item.frequency, 16); // Cap at waking hours
      break;
    case 'weekly':
      dosesPerDay = item.frequency / 7;
      break;
    case 'daily':
    default:
      dosesPerDay = item.frequency;
      break;
  }

  // Ensure at least 1 dose per day (round up for weekly)
  dosesPerDay = Math.max(1, Math.ceil(dosesPerDay));

  // Calculate times for each dose within a day
  const doseTimes = []; // Elements will be objects: { hour, minute }
  
  if (item.start_time) {
    const [startHourStr, startMinStr] = item.start_time.split(':');
    let currentHour = parseInt(startHourStr, 10);
    let currentMinute = parseInt(startMinStr, 10);
    const intervalHrs = item.interval_hours ? parseFloat(item.interval_hours) : (24 / dosesPerDay);
    
    for (let i = 0; i < dosesPerDay; i++) {
      doseTimes.push({ hour: currentHour, minute: currentMinute });
      
      // Calculate next time
      const totalMinutes = currentMinute + (intervalHrs * 60);
      currentHour = (currentHour + Math.floor(totalMinutes / 60)) % 24;
      currentMinute = Math.round(totalMinutes % 60);
    }
  } else {
    // Legacy fallback: Distribute evenly between 6:00 AM and 10:00 PM (16 hours)
    const startHour = 6;   // 6:00 AM
    const endHour = 22;    // 10:00 PM
    const wakingHours = endHour - startHour;
    
    if (dosesPerDay === 1) {
      doseTimes.push({ hour: 8, minute: 0 }); // Single dose at 8:00 AM
    } else if (dosesPerDay === 2) {
      doseTimes.push({ hour: 8, minute: 0 }, { hour: 20, minute: 0 }); // 8:00 AM and 8:00 PM
    } else if (dosesPerDay === 3) {
      doseTimes.push({ hour: 8, minute: 0 }, { hour: 14, minute: 0 }, { hour: 20, minute: 0 }); // 8 AM, 2 PM, 8 PM
    } else if (dosesPerDay === 4) {
      doseTimes.push({ hour: 6, minute: 0 }, { hour: 12, minute: 0 }, { hour: 18, minute: 0 }, { hour: 22, minute: 0 }); // 6 AM, 12 PM, 6 PM, 10 PM
    } else {
      // Evenly distribute
      const interval = wakingHours / dosesPerDay;
      for (let i = 0; i < dosesPerDay; i++) {
        doseTimes.push({ hour: Math.round(startHour + (interval * i)), minute: 0 });
      }
    }
  }

  // Generate entries for each day
  for (let day = 0; day < totalDays; day++) {
    for (const time of doseTimes) {
      const scheduledTime = new Date(startDate);
      scheduledTime.setDate(scheduledTime.getDate() + day);
      scheduledTime.setHours(time.hour, time.minute, 0, 0);

      // Skip if the scheduled time is in the past
      if (scheduledTime <= new Date()) continue;

      entries.push({
        prescription_item_id: item.id,
        prescription_id: item.prescription_id,
        admission_id: item.admission_id,
        patient_id: item.patient_id,
        scheduled_time: scheduledTime,
      });
    }
  }

  return entries;
}

/**
 * Generate schedules for multiple prescription items.
 * @param {Array} items - Array of prescription items
 * @param {Date} [startDate] - Start date for all schedules
 * @returns {Array} Combined array of all schedule entries
 */
function generateSchedulesForItems(items, startDate = new Date()) {
  const allEntries = [];
  for (const item of items) {
    const entries = generateSchedule(item, startDate);
    allEntries.push(...entries);
  }
  return allEntries;
}

module.exports = { generateSchedule, generateSchedulesForItems };
