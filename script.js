/* ============================================
   DIGITAL CLOCK - JAVASCRIPT
   ============================================ */

// ============ STATE MANAGEMENT ============

// Array to store selected time zones
let selectedTimezones = [];

// Local storage key
const STORAGE_KEY = 'digitalClockTimezones';

// Current time format (24 or 12 hour)
let timeFormat = '24';

// ============ DOM ELEMENTS ============

const formatToggle = document.getElementById('formatToggle');
const timezoneSelect = document.getElementById('timezoneSelect');
const addBtn = document.getElementById('addBtn');
const clocksContainer = document.getElementById('clocksContainer');
const localTime = document.getElementById('localTime');
const localTimezone = document.getElementById('localTimezone');
const localDate = document.getElementById('localDate');

// ============ INITIALIZATION ============

/**
 * Initialize the application on page load
 */
function init() {
    loadFromStorage();
    attachEventListeners();
    updateAllClocks();
    // Update clocks every second
    setInterval(updateAllClocks, 1000);
    console.log('✅ Digital Clock initialized');
}

// ============ EVENT LISTENERS ============

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Format toggle
    formatToggle.addEventListener('change', (e) => {
        timeFormat = e.target.value;
        updateAllClocks();
    });

    // Add timezone button
    addBtn.addEventListener('click', handleAddTimezone);

    // Enter key to add timezone
    timezoneSelect.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTimezone();
        }
    });
}

// ============ TIMEZONE MANAGEMENT ============

/**
 * Handle adding a new timezone
 */
function handleAddTimezone() {
    const selectedTimezone = timezoneSelect.value;

    // Check if timezone already exists
    if (selectedTimezones.includes(selectedTimezone)) {
        showNotification('This timezone is already added', 'warning');
        return;
    }

    // Add to array
    selectedTimezones.push(selectedTimezone);

    // Save to storage
    saveToStorage();

    // Reset select
    timezoneSelect.value = timezoneSelect.options[0].value;

    // Update display
    renderTimezones();
    updateAllClocks();

    showNotification('✅ Timezone added successfully', 'success');
}

/**
 * Remove a timezone
 * @param {string} timezone - Timezone to remove
 */
function removeTimezone(timezone) {
    selectedTimezones = selectedTimezones.filter(tz => tz !== timezone);
    saveToStorage();
    renderTimezones();
    showNotification('🗑️ Timezone removed', 'info');
}

/**
 * Render timezone cards
 */
function renderTimezones() {
    clocksContainer.innerHTML = '';

    if (selectedTimezones.length === 0) {
        clocksContainer.innerHTML = '<p class="empty-message">No time zones added yet. Select and add one above!</p>';
        return;
    }

    selectedTimezones.forEach(timezone => {
        const card = createTimezoneCard(timezone);
        clocksContainer.appendChild(card);
    });
}

/**
 * Create a timezone card element
 * @param {string} timezone - Timezone identifier
 * @returns {HTMLElement} Card element
 */
function createTimezoneCard(timezone) {
    const div = document.createElement('div');
    div.className = 'timezone-card';
    div.id = `card-${timezone.replace(/\//g, '-')}`;

    // Format timezone name for display
    const displayName = timezone.replace(/_/g, ' ').split('/')[1] || timezone;
    const countryCode = getCountryCode(timezone);

    div.innerHTML = `
        <div class="card-header" style="background: linear-gradient(135deg, ${getGradientColor(timezone)} 0%, ${getGradientColor(timezone, true)} 100%);">
            <h3>${countryCode} ${displayName}</h3>
            <button class="remove-btn" onclick="removeTimezone('${timezone}')" title="Remove">✕</button>
        </div>
        <div class="clock-display">
            <div class="time" id="time-${timezone.replace(/\//g, '-')}">00:00:00</div>
            <div class="timezone">${timezone}</div>
            <div class="date" id="date-${timezone.replace(/\//g, '-')}">Loading...</div>
        </div>
    `;

    return div;
}

// ============ CLOCK UPDATES ============

/**
 * Update all clocks
 */
function updateAllClocks() {
    updateLocalClock();
    updateTimezoneClock();
}

/**
 * Update local time clock
 */
function updateLocalClock() {
    const now = new Date();
    const timeString = formatTime(now, timeFormat);
    const dateString = formatDate(now);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    localTime.textContent = timeString;
    localDate.textContent = dateString;
    localTimezone.textContent = timezone;
}

/**
 * Update timezone clocks
 */
function updateTimezoneClock() {
    selectedTimezones.forEach(timezone => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(now);
        let timeString = '';
        parts.forEach(part => {
            if (part.type !== 'literal') {
                timeString += part.value;
            } else if (part.value === ':') {
                timeString += ':';
            }
        });

        // Format time based on selected format
        if (timeFormat === '12') {
            timeString = convertTo12Hour(timeString);
        }

        // Update DOM
        const timeEl = document.getElementById(`time-${timezone.replace(/\//g, '-')}`);
        const dateEl = document.getElementById(`date-${timezone.replace(/\//g, '-')}`);

        if (timeEl) {
            timeEl.textContent = timeString;
        }

        if (dateEl) {
            const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
            dateEl.textContent = formatDate(tzDate);
        }
    });
}

// ============ TIME FORMATTING ============

/**
 * Format time based on selected format
 * @param {Date} date - Date object
 * @param {string} format - '24' or '12'
 * @returns {string} Formatted time
 */
function formatTime(date, format) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    let timeString = `${hours}:${minutes}:${seconds}`;

    if (format === '12') {
        timeString = convertTo12Hour(timeString);
    }

    return timeString;
}

/**
 * Convert 24-hour format to 12-hour format
 * @param {string} timeStr - Time in HH:MM:SS format
 * @returns {string} Time in 12-hour format with AM/PM
 */
function convertTo12Hour(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12;
    hour = hour ? hour : 12; // Convert 0 to 12
    const hour12 = String(hour).padStart(2, '0');

    return `${hour12}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get country code emoji based on timezone
 * @param {string} timezone - Timezone identifier
 * @returns {string} Country code emoji
 */
function getCountryCode(timezone) {
    const countryMap = {
        'America/New_York': '🇺🇸',
        'America/Chicago': '🇺🇸',
        'America/Denver': '🇺🇸',
        'America/Los_Angeles': '🇺🇸',
        'America/Anchorage': '🇺🇸',
        'Pacific/Honolulu': '🇺🇸',
        'America/Toronto': '🇨🇦',
        'America/Mexico_City': '🇲🇽',
        'America/Sao_Paulo': '🇧🇷',
        'America/Buenos_Aires': '🇦🇷',
        'Europe/London': '🇬🇧',
        'Europe/Paris': '🇫🇷',
        'Europe/Berlin': '🇩🇪',
        'Europe/Madrid': '🇪🇸',
        'Europe/Rome': '🇮🇹',
        'Europe/Athens': '🇬🇷',
        'Europe/Moscow': '🇷🇺',
        'Europe/Istanbul': '🇹🇷',
        'Asia/Dubai': '🇦🇪',
        'Asia/Kolkata': '🇮🇳',
        'Asia/Bangkok': '🇹🇭',
        'Asia/Shanghai': '🇨🇳',
        'Asia/Tokyo': '🇯🇵',
        'Asia/Seoul': '🇰🇷',
        'Asia/Hong_Kong': '🇭🇰',
        'Asia/Singapore': '🇸🇬',
        'Australia/Sydney': '🇦🇺',
        'Australia/Melbourne': '🇦🇺',
        'Australia/Brisbane': '🇦🇺',
        'Pacific/Auckland': '🇳🇿',
        'Pacific/Fiji': '🇫🇯',
        'Africa/Cairo': '🇪🇬',
        'Africa/Lagos': '🇳🇬',
        'Africa/Johannesburg': '🇿🇦',
        'Africa/Nairobi': '🇰🇪'
    };

    return countryMap[timezone] || '🌍';
}

/**
 * Get gradient color based on timezone
 * @param {string} timezone - Timezone identifier
 * @param {boolean} secondary - Get secondary color
 * @returns {string} Hex color
 */
function getGradientColor(timezone, secondary = false) {
    const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#30cfd0', '#330867'],
        ['#a8edea', '#fed6e3'],
        ['#ff9a56', '#ff6a88']
    ];

    const index = selectedTimezones.indexOf(timezone) % colors.length;
    return colors[index][secondary ? 1 : 0];
}

/**
 * Refresh all clocks manually
 */
function refreshClock() {
    updateAllClocks();
    showNotification('🔄 Clocks refreshed', 'info');
}

/**
 * Show notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type
 */
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ============ LOCAL STORAGE ============

/**
 * Save selected timezones to local storage
 */
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTimezones));
        console.log('💾 Timezones saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving to localStorage:', error);
    }
}

/**
 * Load timezones from local storage
 */
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            selectedTimezones = JSON.parse(data);
            renderTimezones();
            console.log(`📂 Loaded ${selectedTimezones.length} timezones from localStorage`);
        }
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        selectedTimezones = [];
    }
}

// ============ INITIALIZE APP ============

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
