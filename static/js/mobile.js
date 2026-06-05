/**
 * Mobile Application Controller
 */

let events = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDateStr = null;
let activeEditEvent = null;
let activePreviewEvent = null; // Event object currently previewed
let countdownInterval = null;

// DOM Elements
const currentLangText = document.getElementById('current-lang-text');
const langTriggerBtn = document.getElementById('lang-trigger-btn');
const langSheet = document.getElementById('lang-sheet');
const langOptionBtns = document.querySelectorAll('.lang-option-btn');

const calendarDrawerToggle = document.getElementById('calendar-drawer-toggle');
const drawerArrow = document.getElementById('drawer-arrow');
const calendarDrawerBody = document.getElementById('calendar-drawer-body');
const mobileMonthYear = document.getElementById('mobile-month-year');
const mobilePrevMonth = document.getElementById('mobile-prev-month');
const mobileNextMonth = document.getElementById('mobile-next-month');
const mobileWeekdays = document.getElementById('mobile-weekdays');
const mobileDays = document.getElementById('mobile-days');

const mobileEventsContainer = document.getElementById('mobile-events-container');
const mobileEmptyState = document.getElementById('mobile-empty-state');
const mobileFab = document.getElementById('mobile-fab');

const eventSheet = document.getElementById('event-sheet');
const sheetTitle = document.getElementById('sheet-title');
const closeSheetBtn = document.getElementById('close-sheet-btn');
const cancelSheetBtn = document.getElementById('m-cancel-sheet-btn');
const deleteEventBtn = document.getElementById('m-delete-event-btn');
const mobileEventForm = document.getElementById('mobile-event-form');

const mEventIdInput = document.getElementById('m-event-id');
const mEventTitleInput = document.getElementById('m-event-title-input');
const mEventDateInput = document.getElementById('m-event-date-input');
const mEventTimeInput = document.getElementById('m-event-time-input');
const mEventAlldayCheckbox = document.getElementById('m-event-allday-checkbox');
const mEventCountdownCheckbox = document.getElementById('m-event-countdown-checkbox');
const mCountdownSettingsSection = document.getElementById('m-countdown-settings-section');

const mUploadZone = document.getElementById('m-upload-zone');
const mBgFileInput = document.getElementById('m-bg-file-input');
const mUploadPreview = document.getElementById('m-upload-preview');
const mPreviewImg = document.getElementById('m-preview-img');
const mRemoveBgBtn = document.getElementById('m-remove-bg-btn');
const mEventBgImage = document.getElementById('m-event-bg-image');

const mEventBgEffect = document.getElementById('m-event-bg-effect');
const mEventBgColor = document.getElementById('m-event-bg-color');
const mEventBgOpacity = document.getElementById('m-event-bg-opacity');
const mOpacityVal = document.getElementById('m-opacity-val');
const mUnitCheckboxes = document.querySelectorAll('.m-unit-checkbox');
const mEventTemplateInput = document.getElementById('m-event-template-input');
const mResetTemplateBtn = document.getElementById('m-reset-template-btn');
const mTagButtons = document.querySelectorAll('.m-tag-btn:not(#m-reset-template-btn)');

const mPreviewOverlay = document.getElementById('m-preview-overlay');
const mSavePhotoBtn = document.getElementById('m-save-photo-btn');
const mPreviewEditBtn = document.getElementById('m-preview-edit-btn');
const mClosePreviewBtn = document.getElementById('m-close-preview-btn');
const mPreviewEventTitle = document.getElementById('m-preview-event-title');
const mPreviewEventCountdown = document.getElementById('m-preview-event-countdown');
const mPreviewBgLayer = document.getElementById('m-preview-bg-layer');
const mPreviewOverlayLayer = document.getElementById('m-preview-overlay-layer');

const mToastContainer = document.getElementById('m-toast-container');

const mEventCardEffect = document.getElementById('m-event-card-effect');
const mEventCardOpacity = document.getElementById('m-event-card-opacity');
const mCardOpacityVal = document.getElementById('m-card-opacity-val');
const mEventCardColor = document.getElementById('m-event-card-color');
const mEventTextColor = document.getElementById('m-event-text-color');

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  // Update header lang text based on localStorage
  updateLangText();

  // Setup Event Listeners
  langTriggerBtn.addEventListener('click', () => openSheet(langSheet));
  
  langOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      updateLangText();
      closeSheet(langSheet);
    });
  });

  // Calendar Drawer Toggle
  calendarDrawerToggle.addEventListener('click', toggleCalendarDrawer);
  mobilePrevMonth.addEventListener('click', (e) => { e.stopPropagation(); changeMonth(-1); });
  mobileNextMonth.addEventListener('click', (e) => { e.stopPropagation(); changeMonth(1); });

  // FAB button click
  mobileFab.addEventListener('click', () => openEventSheet());
  closeSheetBtn.addEventListener('click', () => closeSheet(eventSheet));
  cancelSheetBtn.addEventListener('click', () => closeSheet(eventSheet));
  deleteEventBtn.addEventListener('click', deleteActiveEvent);
  mobileEventForm.addEventListener('submit', handleFormSubmit);

  // Form toggles
  mEventAlldayCheckbox.addEventListener('change', toggleAllDayFields);
  mEventCountdownCheckbox.addEventListener('change', toggleCountdownFields);

  // Opacity slider
  mEventBgOpacity.addEventListener('input', (e) => {
    mOpacityVal.textContent = `${e.target.value}%`;
  });

  // Card styling sliders
  mEventCardOpacity.addEventListener('input', (e) => {
    mCardOpacityVal.textContent = `${e.target.value}%`;
  });

  // Template tag buttons
  mTagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      const startPos = mEventTemplateInput.selectionStart;
      const endPos = mEventTemplateInput.selectionEnd;
      const text = mEventTemplateInput.value;
      mEventTemplateInput.value = text.substring(0, startPos) + tag + text.substring(endPos);
      mEventTemplateInput.focus();
      mEventTemplateInput.selectionStart = mEventTemplateInput.selectionEnd = startPos + tag.length;
    });
  });

  mResetTemplateBtn.addEventListener('click', () => {
    mEventTemplateInput.value = t('defaultTemplate');
  });

  mClosePreviewBtn.addEventListener('click', closePreview);
  mSavePhotoBtn.addEventListener('click', savePreviewAsPhoto);
  mPreviewEditBtn.addEventListener('click', () => {
    if (activePreviewEvent) {
      const eToEdit = activePreviewEvent;
      closePreview();
      openEventSheet(eToEdit);
    }
  });

  // Upload image events
  mUploadZone.addEventListener('click', (e) => {
    if (e.target !== mRemoveBgBtn && !mRemoveBgBtn.contains(e.target)) {
      mBgFileInput.click();
    }
  });

  mBgFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      uploadImageFile(e.target.files[0]);
    }
  });

  mRemoveBgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeUploadedBackground();
  });

  // Close sheets when clicking on the overlay
  document.querySelectorAll('.sheet-overlay').forEach(sheet => {
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) {
        closeSheet(sheet);
      }
    });
  });

  // Listen to i18n language change events
  window.addEventListener('languagechanged', () => {
    renderCalendar();
    renderEventsFeed();
    if (!activeEditEvent) {
      mEventTemplateInput.value = t('defaultTemplate');
    }
  });

  // Fetch initial events
  fetchEvents();

  // Run countdown loop
  countdownInterval = setInterval(updateCountdowns, 1000);
}

function updateLangText() {
  const currentLang = localStorage.getItem('calendar_lang') || 'zh';
  const labels = { zh: '繁中', en: 'EN', ja: '日本語' };
  currentLangText.textContent = labels[currentLang] || '繁中';

  // Highlight active language button in sheets
  langOptionBtns.forEach(btn => {
    if (btn.getAttribute('data-lang') === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Collapsible calendar drawer
function toggleCalendarDrawer() {
  const isExpanded = calendarDrawerBody.style.display !== 'none';
  if (isExpanded) {
    calendarDrawerBody.style.display = 'none';
    drawerArrow.classList.remove('open');
  } else {
    calendarDrawerBody.style.display = 'flex';
    drawerArrow.classList.add('open');
    renderCalendar();
  }
}

// Bottom sheets utilities
function openSheet(sheet) {
  sheet.classList.add('open');
}

function closeSheet(sheet) {
  sheet.classList.remove('open');
  activeEditEvent = null;
}

// Fetch events from server
async function fetchEvents() {
  try {
    const response = await fetch('/api/events');
    if (!response.ok) throw new Error("Fetch error");
    events = await response.json();
    
    renderCalendar();
    renderEventsFeed();
  } catch (error) {
    console.error("Failed to load events:", error);
    showToast(t('saveError'), 'error');
  }
}

// Render Calendar Grid (Mini-version for mobile drawer)
function renderCalendar() {
  mobileMonthYear.textContent = `${t('months')[currentMonth]} ${currentYear}`;
  
  // Render Weekdays
  mobileWeekdays.innerHTML = '';
  t('weeks').forEach(w => {
    const dayHeader = document.createElement('div');
    dayHeader.textContent = w;
    mobileWeekdays.appendChild(dayHeader);
  });

  // Clear days
  mobileDays.innerHTML = '';

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Add trailing days from previous month
  for (let i = firstDayIndex; i > 0; i--) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day-cell', 'other-month');
    dayCell.textContent = prevMonthTotalDays - i + 1;
    mobileDays.appendChild(dayCell);
  }

  // Populate active month's days
  for (let day = 1; day <= totalDays; day++) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day-cell');
    dayCell.textContent = day;

    const currentFormattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Mark today
    if (currentFormattedDate === todayStr) {
      dayCell.classList.add('today');
    }

    // Highlight selected cell
    if (selectedDateStr === currentFormattedDate) {
      dayCell.classList.add('selected');
    }

    // Event markers (dots)
    const dayEvents = events.filter(e => {
      const eDate = e.time.split(/[T ]/)[0];
      return eDate === currentFormattedDate;
    });

    if (dayEvents.length > 0) {
      const markerContainer = document.createElement('div');
      markerContainer.classList.add('cell-markers');
      
      dayEvents.slice(0, 3).forEach(e => {
        const dot = document.createElement('span');
        dot.classList.add('cell-dot');
        if (e.bg_color) {
          dot.style.backgroundColor = e.bg_color;
        }
        markerContainer.appendChild(dot);
      });
      dayCell.appendChild(markerContainer);
    }

    dayCell.addEventListener('click', () => {
      selectedDateStr = currentFormattedDate;
      document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
      dayCell.classList.add('selected');
      
      // Close calendar body for cleanliness and open event creator
      calendarDrawerBody.style.display = 'none';
      drawerArrow.classList.remove('open');
      
      openEventSheet(null, currentFormattedDate);
    });

    mobileDays.appendChild(dayCell);
  }

  // Fill in the remaining slots to complete grid
  const populatedCells = firstDayIndex + totalDays;
  const remainingCells = 42 - populatedCells;
  if (remainingCells > 0 && remainingCells < 14) {
    for (let day = 1; day <= remainingCells; day++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar-day-cell', 'other-month');
      dayCell.textContent = day;
      mobileDays.appendChild(dayCell);
    }
  }
}

function changeMonth(direction) {
  currentMonth += direction;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear -= 1;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear += 1;
  }
  renderCalendar();
}

// Render Mobile Event Cards List
function renderEventsFeed() {
  mobileEventsContainer.innerHTML = '';
  
  if (events.length === 0) {
    mobileEmptyState.style.display = 'flex';
    return;
  }
  
  mobileEmptyState.style.display = 'none';

  // Sort events: future events first, ordered ascending by time; then past/today events ordered descending
  const sortedEvents = [...events].sort((a, b) => {
    const tA = new Date(a.time.replace(' ', 'T')).getTime();
    const tB = new Date(b.time.replace(' ', 'T')).getTime();
    const now = Date.now();
    
    const isPastA = tA < now;
    const isPastB = tB < now;

    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;
    
    if (!isPastA && !isPastB) return tA - tB;
    return tB - tA;
  });

  sortedEvents.forEach(event => {
    const card = document.createElement('div');
    card.classList.add('event-card', 'glass-card');
    card.setAttribute('data-id', event.id);

    // Apply Background styles
    const bgLayer = document.createElement('div');
    bgLayer.classList.add('event-card-bg-layer');
    if (event.bg_image) {
      bgLayer.style.backgroundImage = `url(${event.bg_image})`;
    }
    card.appendChild(bgLayer);

    const overlayLayer = document.createElement('div');
    overlayLayer.classList.add('event-card-overlay-layer');
    
    const colorHex = event.bg_color || '#1e1e2e';
    const opacity = event.bg_opacity !== undefined ? event.bg_opacity : 1.0;
    
    let r = 30, g = 30, b = 46;
    if (colorHex.startsWith('#')) {
      const cleanHex = colorHex.substring(1);
      if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
      } else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.substring(0, 2), 16);
        g = parseInt(cleanHex.substring(2, 4), 16);
        b = parseInt(cleanHex.substring(4, 6), 16);
      }
    }
    
    overlayLayer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    
    if (event.bg_effect === 'glass') {
      card.classList.add('effect-glass');
    }
    card.appendChild(overlayLayer);

    // Content Layer
    const content = document.createElement('div');
    content.classList.add('event-card-content');

    const titleEl = document.createElement('div');
    titleEl.classList.add('event-card-title');
    titleEl.textContent = event.title;
    content.appendChild(titleEl);

    const countdownEl = document.createElement('div');
    countdownEl.classList.add('event-card-countdown');
    countdownEl.id = `m-countdown-${event.id}`;
    countdownEl.textContent = getCountdownString(event);
    content.appendChild(countdownEl);
    
    card.appendChild(content);
    
    // Tap to open preview poster on mobile (and let the user edit from there!)
    card.addEventListener('click', () => {
      openPreview(event);
    });

    mobileEventsContainer.appendChild(card);
  });
}

function getCountdownString(event) {
  if (!event.countdown_enabled) {
    return event.is_all_day ? event.time : event.time.replace('T', ' ');
  }

  const timeData = calculateRemainingTime(event.time, event.is_all_day, event.display_units);
  const values = {
    title: event.title,
    y: timeData.y,
    d: timeData.d,
    h: timeData.h,
    m: timeData.m,
    s: timeData.s
  };

  if (timeData.status === 'today') {
    return parseCountdownTemplate(t('defaultTemplateToday'), values);
  } else if (timeData.status === 'past') {
    return parseCountdownTemplate(t('defaultTemplatePast'), values);
  } else {
    return parseCountdownTemplate(event.template || t('defaultTemplate'), values);
  }
}

function updateCountdowns() {
  events.forEach(event => {
    const el = document.getElementById(`m-countdown-${event.id}`);
    if (el) {
      el.textContent = getCountdownString(event);
    }
  });

  if (activePreviewEvent) {
    if (mPreviewEventCountdown) {
      mPreviewEventCountdown.textContent = getCountdownString(activePreviewEvent);
    }
  }
}

// Open Fullscreen Mobile Preview
function openPreview(event) {
  activePreviewEvent = event;
  
  mPreviewEventTitle.textContent = event.title;
  mPreviewEventCountdown.textContent = getCountdownString(event);
  
  if (event.bg_image) {
    mPreviewBgLayer.style.backgroundImage = `url(${event.bg_image})`;
  } else {
    mPreviewBgLayer.style.backgroundImage = 'none';
  }
  
  // Background blur scaling depending on effect
  if (event.bg_effect === 'glass') {
    mPreviewBgLayer.style.filter = 'blur(8px) scale(1.05)';
  } else {
    mPreviewBgLayer.style.filter = 'none';
  }

  // Parse color overlay
  const colorHex = event.bg_color || '#1e1e2e';
  const opacity = event.bg_opacity !== undefined ? event.bg_opacity : 1.0;
  
  let r = 30, g = 30, b = 46;
  if (colorHex.startsWith('#')) {
    const cleanHex = colorHex.substring(1);
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
  }
  mPreviewOverlayLayer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  
  // Centered card styles (Glass or Solid overlay + font color)
  const previewContentBox = document.querySelector('#m-preview-overlay .m-preview-content-box');
  const cardHex = event.card_color || '#ffffff';
  const cardAlpha = event.card_opacity !== undefined ? event.card_opacity : 0.05;
  
  function getRgba(hex, alpha) {
    let red = 255, green = 255, blue = 255;
    if (hex.startsWith('#')) {
      const cleanHex = hex.substring(1);
      if (cleanHex.length === 3) {
        red = parseInt(cleanHex[0] + cleanHex[0], 16);
        green = parseInt(cleanHex[1] + cleanHex[1], 16);
        blue = parseInt(cleanHex[2] + cleanHex[2], 16);
      } else if (cleanHex.length === 6) {
        red = parseInt(cleanHex.substring(0, 2), 16);
        green = parseInt(cleanHex.substring(2, 4), 16);
        blue = parseInt(cleanHex.substring(4, 6), 16);
      }
    }
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  previewContentBox.style.background = getRgba(cardHex, cardAlpha);
  if (event.card_effect === 'solid') {
    previewContentBox.style.backdropFilter = 'none';
    previewContentBox.style.webkitBackdropFilter = 'none';
  } else {
    previewContentBox.style.backdropFilter = 'blur(25px)';
    previewContentBox.style.webkitBackdropFilter = 'blur(25px)';
  }

  // Apply custom text colors
  const txtColor = event.text_color || '#ffffff';
  mPreviewEventTitle.style.color = txtColor;
  mPreviewEventCountdown.style.color = txtColor;

  openSheet(mPreviewOverlay);
}

function closePreview() {
  closeSheet(mPreviewOverlay);
}

// Save Mobile Preview Box as Photo
// Save Mobile Preview Box as Photo
function savePreviewAsPhoto() {
  if (!activePreviewEvent) return;

  const event = activePreviewEvent;
  showToast("Saving image...", 'success');

  // Helper function to build off-screen poster DOM, run html2canvas, and download
  function generateAndDownloadPoster(w, h) {
    const posterContainer = document.createElement('div');
    posterContainer.style.position = 'fixed';
    posterContainer.style.left = '-9999px';
    posterContainer.style.top = '-9999px';
    posterContainer.style.width = w + 'px';
    posterContainer.style.height = h + 'px';
    posterContainer.style.zIndex = '-9999';
    posterContainer.style.overflow = 'hidden';
    posterContainer.style.fontFamily = getComputedStyle(document.body).fontFamily || "'Outfit', sans-serif";

    // Background Layer
    const bgLayer = document.createElement('div');
    bgLayer.style.position = 'absolute';
    bgLayer.style.top = '0';
    bgLayer.style.left = '0';
    bgLayer.style.width = '100%';
    bgLayer.style.height = '100%';
    bgLayer.style.backgroundSize = 'cover';
    bgLayer.style.backgroundPosition = 'center';
    bgLayer.style.backgroundRepeat = 'no-repeat';
    if (event.bg_image) {
      bgLayer.style.backgroundImage = `url(${event.bg_image})`;
    } else {
      bgLayer.style.backgroundColor = event.bg_color || '#1e1e2e';
    }
    posterContainer.appendChild(bgLayer);

    // Overlay color layer
    const overlayLayer = document.createElement('div');
    overlayLayer.style.position = 'absolute';
    overlayLayer.style.top = '0';
    overlayLayer.style.left = '0';
    overlayLayer.style.width = '100%';
    overlayLayer.style.height = '100%';
    overlayLayer.style.zIndex = '2';

    const bgOverlayColor = event.bg_color || '#1e1e2e';
    const bgOverlayOpacity = event.bg_opacity !== undefined ? event.bg_opacity : 1.0;

    let r = 30, g = 30, b = 46;
    if (bgOverlayColor.startsWith('#')) {
      const clean = bgOverlayColor.substring(1);
      if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
      } else if (clean.length === 6) {
        r = parseInt(clean.substring(0, 2), 16);
        g = parseInt(clean.substring(2, 4), 16);
        b = parseInt(clean.substring(4, 6), 16);
      }
    }
    overlayLayer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${bgOverlayOpacity})`;
    posterContainer.appendChild(overlayLayer);

    // Card Container
    const card = document.createElement('div');
    card.style.position = 'absolute';
    card.style.top = '50%';
    card.style.left = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.style.zIndex = '3';
    card.style.textAlign = 'center';
    card.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.4)';

    // Proportional scale factor based on width
    // Base standard size: 1080 for portrait, 1920 for landscape (if background image is landscape)
    const isLandscape = w > h;
    const baselineWidth = isLandscape ? 1920 : 1080;
    const scale = w / baselineWidth;

    const cardWidth = isLandscape ? Math.round(500 * scale) : Math.round(310 * scale);
    card.style.width = cardWidth + 'px';
    card.style.maxWidth = '85%';
    card.style.borderRadius = Math.round(20 * scale) + 'px';
    card.style.padding = Math.round(50 * scale) + 'px ' + Math.round(24 * scale) + 'px';

    const cardHex = event.card_color || '#ffffff';
    const cardAlpha = event.card_opacity !== undefined ? event.card_opacity : 0.05;

    let cr = 255, cg = 255, cb = 255;
    if (cardHex.startsWith('#')) {
      const clean = cardHex.substring(1);
      if (clean.length === 3) {
        cr = parseInt(clean[0] + clean[0], 16);
        cg = parseInt(clean[1] + clean[1], 16);
        cb = parseInt(clean[2] + clean[2], 16);
      } else if (clean.length === 6) {
        cr = parseInt(clean.substring(0, 2), 16);
        cg = parseInt(clean.substring(2, 4), 16);
        cb = parseInt(clean.substring(4, 6), 16);
      }
    }

    let finalAlpha = cardAlpha;
    if (event.card_effect === 'glass') {
      finalAlpha = Math.max(0.25, cardAlpha * 2.0);
      card.style.border = `${1.5 * scale}px solid rgba(255, 255, 255, 0.25)`;
    } else {
      finalAlpha = Math.max(0.3, cardAlpha);
      card.style.border = `${1 * scale}px solid rgba(255, 255, 255, 0.1)`;
    }
    card.style.backgroundColor = `rgba(${cr}, ${cg}, ${cb}, ${finalAlpha})`;

    // Title Elements
    const titleEl = document.createElement('h2');
    titleEl.textContent = event.title;
    titleEl.style.fontSize = Math.round(20 * scale) + 'px';
    titleEl.style.fontWeight = '500';
    titleEl.style.marginBottom = Math.round(20 * scale) + 'px';
    titleEl.style.letterSpacing = (0.5 * scale) + 'px';
    titleEl.style.color = event.text_color || '#ffffff';
    titleEl.style.marginTop = '0';

    // Countdown Elements
    const countdownEl = document.createElement('div');
    countdownEl.textContent = getCountdownString(event);
    countdownEl.style.fontSize = (isLandscape ? Math.round(48 * scale) : Math.round(35 * scale)) + 'px';
    countdownEl.style.fontWeight = '700';
    countdownEl.style.letterSpacing = (-0.5 * scale) + 'px';
    countdownEl.style.lineHeight = '1.25';
    countdownEl.style.textShadow = `0 ${3 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.5)`;
    countdownEl.style.color = event.text_color || '#ffffff';

    card.appendChild(titleEl);
    card.appendChild(countdownEl);
    posterContainer.appendChild(card);

    document.body.appendChild(posterContainer);

    setTimeout(() => {
      html2canvas(posterContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 1, // Scaled manually by w/h absolute dimensions
        scrollX: 0,
        scrollY: 0,
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        x: 0,
        y: 0
      }).then(canvas => {
        document.body.removeChild(posterContainer);

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `countdown-${event.title.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        showToast(t('saveSuccess'), 'success');
      }).catch(err => {
        if (posterContainer.parentNode) {
          document.body.removeChild(posterContainer);
        }
        console.error("Poster export failure:", err);
        showToast(t('uploadError'), 'error');
      });
    }, 50);
  }

  if (event.bg_image) {
    const img = new Image();
    img.src = event.bg_image;
    img.onload = function() {
      let w = img.naturalWidth || 1080;
      let h = img.naturalHeight || 1920;
      // Cap the max dimension to 2000px to prevent memory limits
      const maxDim = 2000;
      if (w > maxDim || h > maxDim) {
        const ratio = w / h;
        if (w > h) {
          w = maxDim;
          h = Math.round(maxDim / ratio);
        } else {
          h = maxDim;
          w = Math.round(maxDim * ratio);
        }
      }
      generateAndDownloadPoster(w, h);
    };
    img.onerror = function() {
      // Fallback to iPhone portrait size if image fails to load
      generateAndDownloadPoster(1080, 1920);
    };
  } else {
    // If no background image, use iPhone portrait 1080x1920 as requested
    generateAndDownloadPoster(1080, 1920);
  }
}

// Open Event Editor Sheet (Bottom Drawer)
function openEventSheet(event = null, prefillDate = null) {
  activeEditEvent = event;
  
  // Reset form inputs
  mobileEventForm.reset();
  removeUploadedBackground();
  
  if (event) {
    // Edit mode
    sheetTitle.textContent = t('editEvent');
    mEventIdInput.value = event.id;
    mEventTitleInput.value = event.title;
    
    if (event.is_all_day) {
      mEventDateInput.value = event.time;
      mEventTimeInput.value = '';
    } else {
      const parts = event.time.split(/[T ]/);
      mEventDateInput.value = parts[0];
      mEventTimeInput.value = parts[1] ? parts[1].substring(0, 8) : '';
    }
    
    mEventAlldayCheckbox.checked = event.is_all_day;
    mEventCountdownCheckbox.checked = event.countdown_enabled;
    
    // Background properties
    mEventBgImage.value = event.bg_image || '';
    if (event.bg_image) {
      mPreviewImg.src = event.bg_image;
      mUploadPreview.style.display = 'block';
    }
    
    mEventBgEffect.value = event.bg_effect || 'normal';
    mEventBgOpacity.value = event.bg_opacity !== undefined ? Math.round(event.bg_opacity * 100) : 100;
    mOpacityVal.textContent = `${mEventBgOpacity.value}%`;
    mEventBgColor.value = event.bg_color || '#1e1e2e';
    
    // Display units
    const units = event.display_units || ['y', 'd', 'h', 'm', 's'];
    mUnitCheckboxes.forEach(cb => {
      cb.checked = units.includes(cb.value);
    });
    
    mEventTemplateInput.value = event.template || t('defaultTemplate');

    mEventCardEffect.value = event.card_effect || 'glass';
    mEventCardOpacity.value = event.card_opacity !== undefined ? Math.round(event.card_opacity * 100) : 5;
    mCardOpacityVal.textContent = `${mEventCardOpacity.value}%`;
    mEventCardColor.value = event.card_color || '#ffffff';
    mEventTextColor.value = event.text_color || '#ffffff';

    deleteEventBtn.style.display = 'block';
  } else {
    // Create mode
    sheetTitle.textContent = t('addEvent');
    mEventIdInput.value = '';
    deleteEventBtn.style.display = 'none';
    
    // Date prefill
    if (prefillDate) {
      mEventDateInput.value = prefillDate;
    } else {
      const today = new Date();
      mEventDateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    // Time prefill
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    mEventTimeInput.value = `${String(nextHour.getHours()).padStart(2, '0')}:00:00`;
    
    mEventAlldayCheckbox.checked = false;
    mEventCountdownCheckbox.checked = true;
    
    // Background styling defaults
    mEventBgImage.value = '';
    mEventBgEffect.value = 'normal';
    mEventBgOpacity.value = 100;
    mOpacityVal.textContent = '100%';
    mEventBgColor.value = '#1e1e2e';
    
    mUnitCheckboxes.forEach(cb => cb.checked = true);
    mEventTemplateInput.value = t('defaultTemplate');

    mEventCardEffect.value = 'glass';
    mEventCardOpacity.value = 5;
    mCardOpacityVal.textContent = '5%';
    mEventCardColor.value = '#ffffff';
    mEventTextColor.value = '#ffffff';
  }
  
  toggleAllDayFields();
  toggleCountdownFields();
  
  openSheet(eventSheet);
}

function toggleAllDayFields() {
  if (mEventAlldayCheckbox.checked) {
    mEventTimeInput.style.display = 'none';
    mEventTimeInput.removeAttribute('required');
  } else {
    mEventTimeInput.style.display = 'block';
    mEventTimeInput.setAttribute('required', 'required');
  }
}

function toggleCountdownFields() {
  if (mEventCountdownCheckbox.checked) {
    mCountdownSettingsSection.style.display = 'flex';
  } else {
    mCountdownSettingsSection.style.display = 'none';
  }
}

// Upload image file
async function uploadImageFile(file) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    showToast(t('uploadError') + ": Only images allowed", 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("Upload error");
    const result = await response.json();
    
    mEventBgImage.value = result.url;
    mPreviewImg.src = result.url;
    mUploadPreview.style.display = 'block';
    
    showToast(t('uploadSuccess'), 'success');
  } catch (error) {
    console.error("Upload error:", error);
    showToast(t('uploadError'), 'error');
  }
}

function removeUploadedBackground() {
  mEventBgImage.value = '';
  mPreviewImg.src = '';
  mUploadPreview.style.display = 'none';
  mBgFileInput.value = '';
}

// Submit Form (Save/Update event)
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const title = mEventTitleInput.value.trim();
  const isAllDay = mEventAlldayCheckbox.checked;
  const dateStr = mEventDateInput.value;
  
  if (!title) {
    showToast(t('invalidTitle'), 'error');
    return;
  }
  if (!dateStr) {
    showToast(t('invalidTime'), 'error');
    return;
  }

  let finalTimeStr = dateStr;
  if (!isAllDay) {
    let timeStr = mEventTimeInput.value;
    if (timeStr.length === 5) {
      timeStr += ':00';
    }
    finalTimeStr = `${dateStr}T${timeStr}`;
  }

  // Validation: now - 16 days to now + 2 years
  const now = new Date();
  const targetDate = new Date(finalTimeStr.replace('T', ' '));
  const timeDiffMs = targetDate.getTime() - now.getTime();
  
  const maxFutureMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const maxPastMs = -16 * 24 * 60 * 60 * 1000;
  
  if (timeDiffMs > maxFutureMs || timeDiffMs < maxPastMs) {
    showToast(t('errorDateRange'), 'error');
    return;
  }

  const displayUnits = [];
  mUnitCheckboxes.forEach(cb => {
    if (cb.checked) displayUnits.push(cb.value);
  });

  if (displayUnits.length === 0 && mEventCountdownCheckbox.checked) {
    displayUnits.push('d');
  }

  const payload = {
    id: mEventIdInput.value || null,
    title: title,
    time: finalTimeStr,
    is_all_day: isAllDay,
    countdown_enabled: mEventCountdownCheckbox.checked,
    bg_image: mEventBgImage.value || null,
    bg_effect: mEventBgEffect.value,
    bg_opacity: parseFloat((mEventBgOpacity.value / 100).toFixed(2)),
    bg_color: mEventBgColor.value,
    display_units: displayUnits,
    template: mEventTemplateInput.value,
    card_effect: mEventCardEffect.value,
    card_color: mEventCardColor.value,
    card_opacity: parseFloat((mEventCardOpacity.value / 100).toFixed(2)),
    text_color: mEventTextColor.value
  };

  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Save error");
    
    closeSheet(eventSheet);
    fetchEvents();
    showToast(t('saveSuccess'), 'success');
  } catch (error) {
    console.error("Save failed:", error);
    showToast(t('saveError'), 'error');
  }
}

// Delete active event
async function deleteActiveEvent() {
  const eventId = mEventIdInput.value;
  if (eventId && confirm(t('confirmDelete'))) {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error("Delete error");
      
      closeSheet(eventSheet);
      fetchEvents();
      showToast(t('deleteEvent') + " " + t('saveSuccess'), 'success');
    } catch (error) {
      console.error("Delete failed:", error);
      showToast(t('saveError'), 'error');
    }
  }
}

// Mobile top-centered Toast system
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  
  const icon = document.createElement('span');
  if (type === 'success') {
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else {
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  }
  
  const text = document.createElement('span');
  text.textContent = message;
  
  toast.appendChild(icon);
  toast.appendChild(text);
  mToastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 2500);
}
