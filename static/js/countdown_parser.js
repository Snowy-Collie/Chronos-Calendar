/**
 * Countdown Parser Utility
 */

const UNIT_SECONDS = {
  y: 365 * 24 * 60 * 60,
  d: 24 * 60 * 60,
  h: 60 * 60,
  m: 60,
  s: 1
};

/**
 * Calculates remaining time broken down by enabled units.
 * If a unit is disabled, its value rolls down to the next smaller active unit.
 * 
 * @param {string} targetTimeStr - ISO string or YYYY-MM-DD
 * @param {boolean} isAllDay - Whether it is an all-day event
 * @param {string[]} enabledUnits - Array of active units (e.g., ['y', 'd', 'h', 'm', 's'])
 * @returns {object} Calculated values for enabled units, status, and total diff in ms
 */
function calculateRemainingTime(targetTimeStr, isAllDay, enabledUnits = ['y', 'd', 'h', 'm', 's']) {
  const now = new Date();
  let targetDate;

  if (isAllDay) {
    // Parse all-day date at midnight of local time
    // targetTimeStr is YYYY-MM-DD
    const parts = targetTimeStr.split('-');
    targetDate = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
  } else {
    // Parse full datetime
    // targetTimeStr is YYYY-MM-DDTHH:MM or YYYY-MM-DD HH:MM:SS
    const cleanStr = targetTimeStr.replace('T', ' ');
    const parts = cleanStr.split(/[- :]/);
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const hour = parseInt(parts[3], 10) || 0;
    const minute = parseInt(parts[4], 10) || 0;
    const second = parseInt(parts[5], 10) || 0;
    
    targetDate = new Date(year, month, day, hour, minute, second);
  }

  const diffMs = targetDate.getTime() - now.getTime();
  
  // Status: 'future', 'today', 'past'
  let status = 'future';
  
  if (isAllDay) {
    // For all-day events, check if it's the exact calendar day
    const isToday = now.getFullYear() === targetDate.getFullYear() &&
                    now.getMonth() === targetDate.getMonth() &&
                    now.getDate() === targetDate.getDate();
    if (isToday) {
      status = 'today';
    } else if (diffMs < 0) {
      status = 'past';
    }
  } else {
    // For specific-time events, if it is within 1 minute of current time, or passed
    // But let's define 'today' for specific-time as the same calendar day
    const isSameDay = now.getFullYear() === targetDate.getFullYear() &&
                      now.getMonth() === targetDate.getMonth() &&
                      now.getDate() === targetDate.getDate();
    
    if (isSameDay && Math.abs(diffMs) < 60000) { // within 1 minute
      status = 'today';
    } else if (diffMs < 0) {
      status = 'past';
    }
  }

  // Define ordered units list
  const orderedUnits = ['y', 'd', 'h', 'm', 's'];
  
  // Filter active units in order
  const activeUnits = orderedUnits.filter(u => enabledUnits.includes(u));

  if (activeUnits.length === 0) {
    // If no units enabled, default to showing days
    activeUnits.push('d');
  }

  const result = {
    y: 0,
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    status: status,
    totalDiffMs: diffMs
  };

  // Check if the smallest active unit is 'd' or 'y' (i.e. no hours, minutes, seconds)
  const hasTimeUnits = activeUnits.includes('h') || activeUnits.includes('m') || activeUnits.includes('s');

  if (!hasTimeUnits) {
    // Calculate calendar days difference (midnight to midnight)
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((targetMidnight.getTime() - nowMidnight.getTime()) / (24 * 60 * 60 * 1000));
    let absDays = Math.abs(diffDays);

    if (activeUnits.includes('y') && activeUnits.includes('d')) {
      result.y = Math.floor(absDays / 365);
      result.d = absDays % 365;
    } else if (activeUnits.includes('y')) {
      result.y = Math.round(absDays / 365);
    } else {
      result.d = absDays;
    }
  } else {
    // Distribute remaining seconds mathematically among active units
    let remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
    if (diffMs < 0) {
      remainingSeconds = Math.abs(Math.floor(diffMs / 1000));
    }

    for (let i = 0; i < activeUnits.length; i++) {
      const unit = activeUnits[i];
      const unitSec = UNIT_SECONDS[unit];
      
      if (i === activeUnits.length - 1) {
        // Last active unit gets all remaining seconds
        result[unit] = Math.floor(remainingSeconds / unitSec);
      } else {
        result[unit] = Math.floor(remainingSeconds / unitSec);
        remainingSeconds = remainingSeconds % unitSec;
      }
    }
  }

  return result;
}

/**
 * Compiles a countdown template string with values.
 * Evaluates escaped characters using backslashes.
 * 
 * @param {string} template - The template pattern containing placeholders like [title], [d], etc.
 * @param {object} values - Dictionary containing event title and computed units (y, d, h, m, s)
 * @returns {string} Fully parsed and compiled string
 */
function parseCountdownTemplate(template, values) {
  if (!template) return '';
  
  let result = '';
  let i = 0;
  
  while (i < template.length) {
    const char = template[i];
    
    if (char === '\\') {
      // Escape character
      if (i + 1 < template.length) {
        result += template[i + 1];
        i += 2;
      } else {
        result += '\\';
        i++;
      }
    } else if (char === '[') {
      // Find matching close bracket ']'
      let j = i + 1;
      let found = false;
      
      while (j < template.length) {
        if (template[j] === '\\') {
          j += 2; // skip escaped contents inside bracket
        } else if (template[j] === ']') {
          found = true;
          break;
        } else {
          j++;
        }
      }
      
      if (found) {
        const tag = template.substring(i + 1, j);
        if (values.hasOwnProperty(tag)) {
          result += values[tag];
        } else {
          // If tag name is unrecognized, preserve it literally
          result += '[' + tag + ']';
        }
        i = j + 1;
      } else {
        // No matching closing bracket, treat as literal
        result += '[';
        i++;
      }
    } else {
      result += char;
      i++;
    }
  }
  
  return result;
}

// Export functions to window scope for easy global usage in client files
window.calculateRemainingTime = calculateRemainingTime;
window.parseCountdownTemplate = parseCountdownTemplate;
