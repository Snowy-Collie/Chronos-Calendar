/**
 * Desktop Application Controller
 */

let events = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
let selectedDateStr = null; // YYYY-MM-DD
let activeEditEvent = null; // Event object being edited, null for create
let activePreviewEvent = null; // Event object currently previewed
let countdownInterval = null;

// DOM Elements
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarWeekdays = document.getElementById('calendar-weekdays');
const calendarDays = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

const addEventBtn = document.getElementById('add-event-btn');
const eventModal = document.getElementById('event-overlay' || 'event-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');
const deleteEventModalBtn = document.getElementById('delete-event-modal-btn');
const eventForm = document.getElementById('event-form');

const eventIdInput = document.getElementById('event-id');
const eventTitleInput = document.getElementById('event-title-input');
const eventDateInput = document.getElementById('event-date-input');
const eventTimeInput = document.getElementById('event-time-input');
const eventAlldayCheckbox = document.getElementById('event-allday-checkbox');
const eventCountdownCheckbox = document.getElementById('event-countdown-checkbox');
const countdownSettingsSection = document.getElementById('countdown-settings-section');

const uploadZone = document.getElementById('upload-zone');
const bgFileInput = document.getElementById('bg-file-input');
const uploadPreview = document.getElementById('upload-preview');
const previewImg = document.getElementById('preview-img');
const removeBgBtn = document.getElementById('remove-bg-btn');
const eventBgImage = document.getElementById('event-bg-image');

const eventBgEffect = document.getElementById('event-bg-effect');
const eventBgOpacity = document.getElementById('event-bg-opacity');
const opacityVal = document.getElementById('opacity-val');
const eventBgColor = document.getElementById('event-bg-color');
const colorHexVal = document.getElementById('color-hex-val');
const unitCheckboxes = document.querySelectorAll('.unit-checkbox');
const eventTemplateInput = document.getElementById('event-template-input');
const resetTemplateBtn = document.getElementById('reset-template-btn');
const tagButtons = document.querySelectorAll('.tag-btn:not(#reset-template-btn)');

const eventCardEffect = document.getElementById('event-card-effect');
const eventCardOpacity = document.getElementById('event-card-opacity');
const cardOpacityVal = document.getElementById('card-opacity-val');
const eventCardColor = document.getElementById('event-card-color');
const cardColorHexVal = document.getElementById('card-color-hex-val');
const eventTextColor = document.getElementById('event-text-color');
const textColorHexVal = document.getElementById('text-color-hex-val');

const eventsContainer = document.getElementById('events-container');
const emptyState = document.getElementById('empty-state');
const toastContainer = document.getElementById('toast-container');

const previewOverlay = document.getElementById('preview-overlay');
const closePreviewBtn = document.getElementById('close-preview-btn');
const savePhotoBtn = document.getElementById('save-photo-btn');
const previewEventTitle = document.getElementById('preview-event-title');
const previewEventCountdown = document.getElementById('preview-event-countdown');
const previewBgLayer = document.getElementById('preview-bg-layer');
const previewOverlayLayer = document.getElementById('preview-overlay-layer');

// Load initial data
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  // Setup event listeners
  prevMonthBtn.addEventListener('click', () => changeMonth(-1));
  nextMonthBtn.addEventListener('click', () => changeMonth(1));
  addEventBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  deleteEventModalBtn.addEventListener('click', deleteActiveEvent);
  eventForm.addEventListener('submit', handleFormSubmit);

  closePreviewBtn.addEventListener('click', closePreview);
  savePhotoBtn.addEventListener('click', savePreviewAsPhoto);
  previewOverlay.addEventListener('click', (e) => {
    if (e.target === previewOverlay) {
      closePreview();
    }
  });

  // Card Opacity, Color & Text Color sliders
  eventCardOpacity.addEventListener('input', (e) => {
    cardOpacityVal.textContent = `${e.target.value}%`;
  });
  eventCardColor.addEventListener('input', (e) => {
    cardColorHexVal.textContent = e.target.value.toUpperCase();
  });
  eventTextColor.addEventListener('input', (e) => {
    textColorHexVal.textContent = e.target.value.toUpperCase();
  });

  // All day toggle details
  eventAlldayCheckbox.addEventListener('change', toggleAllDayFields);
  eventCountdownCheckbox.addEventListener('change', toggleCountdownFields);

  // Background Opacity & Color sliders
  eventBgOpacity.addEventListener('input', (e) => {
    opacityVal.textContent = `${e.target.value}%`;
  });
  eventBgColor.addEventListener('input', (e) => {
    colorHexVal.textContent = e.target.value.toUpperCase();
  });

  // Template custom tags
  tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag');
      const startPos = eventTemplateInput.selectionStart;
      const endPos = eventTemplateInput.selectionEnd;
      const text = eventTemplateInput.value;
      eventTemplateInput.value = text.substring(0, startPos) + tag + text.substring(endPos);
      eventTemplateInput.focus();
      // Move cursor after the tag
      eventTemplateInput.selectionStart = eventTemplateInput.selectionEnd = startPos + tag.length;
    });
  });

  resetTemplateBtn.addEventListener('click', () => {
    eventTemplateInput.value = t('defaultTemplate');
  });

  // Language buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });

  // Upload Background Image Handlers
  uploadZone.addEventListener('click', (e) => {
    if (e.target !== removeBgBtn && !removeBgBtn.contains(e.target)) {
      bgFileInput.click();
    }
  });

  bgFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      uploadImageFile(e.target.files[0]);
    }
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      uploadImageFile(e.dataTransfer.files[0]);
    }
  });

  removeBgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    removeUploadedBackground();
  });

  // Listen to i18n language change events
  window.addEventListener('languagechanged', () => {
    renderCalendar();
    renderEventsFeed();
    if (!activeEditEvent) {
      eventTemplateInput.value = t('defaultTemplate');
    }
  });

  // Load events
  fetchEvents();

  // Run countdown loop
  countdownInterval = setInterval(updateCountdowns, 1000);
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

// Render Calendar Grid
function renderCalendar() {
  calendarMonthYear.textContent = `${t('months')[currentMonth]} ${currentYear}`;
  
  // Clear grid headers
  calendarWeekdays.innerHTML = '';
  t('weeks').forEach(w => {
    const dayHeader = document.createElement('div');
    dayHeader.textContent = w;
    calendarWeekdays.appendChild(dayHeader);
  });

  // Clear cells
  calendarDays.innerHTML = '';

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Add empty spaces for previous month's trailing days
  for (let i = firstDayIndex; i > 0; i--) {
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day-cell', 'other-month');
    dayCell.textContent = prevMonthTotalDays - i + 1;
    calendarDays.appendChild(dayCell);
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

    // Event markers
    const dayEvents = events.filter(e => {
      const eDate = e.time.split(/[T ]/)[0];
      return eDate === currentFormattedDate;
    });

    if (dayEvents.length > 0) {
      const markerContainer = document.createElement('div');
      markerContainer.classList.add('cell-markers');
      
      // Limit to 3 dots
      dayEvents.slice(0, 3).forEach(e => {
        const dot = document.createElement('span');
        dot.classList.add('cell-dot');
        if (e.bg_color) {
          dot.style.backgroundColor = e.bg_color;
          dot.style.boxShadow = `0 0 5px ${e.bg_color}`;
        }
        markerContainer.appendChild(dot);
      });
      dayCell.appendChild(markerContainer);
    }

    dayCell.addEventListener('click', () => {
      selectedDateStr = currentFormattedDate;
      // Re-draw cells to update selection ring
      document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
      dayCell.classList.add('selected');
      
      // Open modal with this date
      openModal(null, currentFormattedDate);
    });

    calendarDays.appendChild(dayCell);
  }

  // Fill in the remaining slots of the 6-week calendar grid (42 cells total)
  const populatedCells = firstDayIndex + totalDays;
  const remainingCells = 42 - populatedCells;
  if (remainingCells > 0 && remainingCells < 14) {
    for (let day = 1; day <= remainingCells; day++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar-day-cell', 'other-month');
      dayCell.textContent = day;
      calendarDays.appendChild(dayCell);
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

// Render Event Feed
function renderEventsFeed() {
  eventsContainer.innerHTML = '';
  
  if (events.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';

  // Sort events: future events first, ordered ascending by time; then past/today events ordered descending
  const sortedEvents = [...events].sort((a, b) => {
    const tA = new Date(a.time.replace(' ', 'T')).getTime();
    const tB = new Date(b.time.replace(' ', 'T')).getTime();
    const now = Date.now();
    
    const isPastA = tA < now;
    const isPastB = tB < now;

    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;
    
    // If both future, ascending (soonest first)
    if (!isPastA && !isPastB) return tA - tB;
    // If both past, descending (most recent first)
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

    // Overlay layer (color overlay with opacity)
    const overlayLayer = document.createElement('div');
    overlayLayer.classList.add('event-card-overlay-layer');
    
    // Parse color overlay
    const colorHex = event.bg_color || '#1e1e2e';
    const opacity = event.bg_opacity !== undefined ? event.bg_opacity : 1.0;
    
    // Convert hex to rgb
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
    
    // Apply glass effect class
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
    countdownEl.id = `countdown-${event.id}`;
    // Initial display
    countdownEl.textContent = getCountdownString(event);
    content.appendChild(countdownEl);
    
    card.appendChild(content);

    // Hover actions panel
    const actions = document.createElement('div');
    actions.classList.add('event-card-actions');

    const editBtn = document.createElement('button');
    editBtn.classList.add('action-btn', 'edit-btn');
    editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(event);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('action-btn', 'delete-btn');
    deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDeleteEvent(event.id);
    });
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    
    // Add click to open magnification preview
    card.addEventListener('click', (e) => {
      if (e.target.closest('.event-card-actions')) return;
      openPreview(event);
    });

    // Add double-click to edit
    card.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openModal(event);
    });

    eventsContainer.appendChild(card);
  });
}

// Compute the parsed countdown string for an event card
function getCountdownString(event) {
  if (!event.countdown_enabled) {
    // If countdown is disabled, show event date/time as subtitle
    if (event.is_all_day) {
      return event.time;
    } else {
      return event.time.replace('T', ' ');
    }
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

// Update countdowns in real-time
function updateCountdowns() {
  events.forEach(event => {
    const el = document.getElementById(`countdown-${event.id}`);
    if (el) {
      el.textContent = getCountdownString(event);
    }
  });

  if (activePreviewEvent) {
    if (previewEventCountdown) {
      previewEventCountdown.textContent = getCountdownString(activePreviewEvent);
    }
  }
}

// Open Fullscreen Preview Poster
function openPreview(event) {
  activePreviewEvent = event;
  
  previewEventTitle.textContent = event.title;
  previewEventCountdown.textContent = getCountdownString(event);
  
  if (event.bg_image) {
    previewBgLayer.style.backgroundImage = `url(${event.bg_image})`;
  } else {
    previewBgLayer.style.backgroundImage = 'none';
  }
  
  // Background blur scaling depending on effect
  if (event.bg_effect === 'glass') {
    previewBgLayer.style.filter = 'blur(10px) scale(1.05)';
  } else {
    previewBgLayer.style.filter = 'none';
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
  previewOverlayLayer.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
  
  // Centered card styles (Glass or Solid overlay + font color)
  const previewContentBox = document.querySelector('.preview-content-box');
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
  previewEventTitle.style.color = txtColor;
  previewEventCountdown.style.color = txtColor;

  previewOverlay.classList.add('open');
}

function closePreview() {
  previewOverlay.classList.remove('open');
  activePreviewEvent = null;
}

// Save Fullscreen Preview Box as Photo
function savePreviewAsPhoto() {
  if (!activePreviewEvent) return;
  
  const captureBox = document.getElementById('preview-capture-box');
  const previewContentBox = document.querySelector('.preview-content-box');
  
  // Cache original styles
  const originalBackground = previewContentBox.style.background;
  const originalBorder = previewContentBox.style.border;
  const originalBackdropFilter = previewContentBox.style.backdropFilter;
  const originalWebkitBackdropFilter = previewContentBox.style.webkitBackdropFilter;
  
  // Calculate temporary style for html2canvas (bumping opacity to display the card clearly without backdrop-filter)
  const cardHex = activePreviewEvent.card_color || '#ffffff';
  const cardAlpha = activePreviewEvent.card_opacity !== undefined ? activePreviewEvent.card_opacity : 0.05;
  
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

  // Temporarily disable backdrop filter for html2canvas compatibility
  previewContentBox.style.backdropFilter = 'none';
  previewContentBox.style.webkitBackdropFilter = 'none';

  if (activePreviewEvent.card_effect === 'glass') {
    // Increase alpha to make the card shape visible
    const captureAlpha = Math.max(0.25, cardAlpha * 2.0);
    previewContentBox.style.background = getRgba(cardHex, captureAlpha);
    previewContentBox.style.border = '1.5px solid rgba(255, 255, 255, 0.25)';
  } else {
    const captureAlpha = Math.max(0.3, cardAlpha);
    previewContentBox.style.background = getRgba(cardHex, captureAlpha);
    previewContentBox.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  }

  // Notify user
  showToast("Rendering image, please wait...", 'success');
  
  html2canvas(captureBox, {
    useCORS: true,
    allowTaint: true,
    scale: 2, // Higher export resolution
    scrollX: 0,
    scrollY: 0,
    width: captureBox.clientWidth,
    height: captureBox.clientHeight,
    windowWidth: captureBox.clientWidth,
    windowHeight: captureBox.clientHeight,
    x: 0,
    y: 0
  }).then(canvas => {
    // Restore original styles immediately
    previewContentBox.style.background = originalBackground;
    previewContentBox.style.border = originalBorder;
    previewContentBox.style.backdropFilter = originalBackdropFilter;
    previewContentBox.style.webkitBackdropFilter = originalWebkitBackdropFilter;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `countdown-${activePreviewEvent.title.replace(/\s+/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
    showToast(t('saveSuccess'), 'success');
  }).catch(err => {
    // Restore original styles in case of error
    previewContentBox.style.background = originalBackground;
    previewContentBox.style.border = originalBorder;
    previewContentBox.style.backdropFilter = originalBackdropFilter;
    previewContentBox.style.webkitBackdropFilter = originalWebkitBackdropFilter;

    console.error("Canvas export failure:", err);
    showToast(t('uploadError'), 'error');
  });
}

// Open Event Editor Modal
function openModal(event = null, prefillDate = null) {
  activeEditEvent = event;
  
  // Reset form inputs
  eventForm.reset();
  removeUploadedBackground();
  
  if (event) {
    // Edit mode
    document.getElementById('modal-title').textContent = t('editEvent');
    eventIdInput.value = event.id;
    eventTitleInput.value = event.title;
    
    // Parse time
    if (event.is_all_day) {
      eventDateInput.value = event.time;
      eventTimeInput.value = '';
    } else {
      const parts = event.time.split(/[T ]/);
      eventDateInput.value = parts[0];
      eventTimeInput.value = parts[1] ? parts[1].substring(0, 8) : '';
    }
    
    eventAlldayCheckbox.checked = event.is_all_day;
    eventCountdownCheckbox.checked = event.countdown_enabled;
    
    // Background styles
    eventBgImage.value = event.bg_image || '';
    if (event.bg_image) {
      previewImg.src = event.bg_image;
      uploadPreview.style.display = 'block';
    }
    
    eventBgEffect.value = event.bg_effect || 'normal';
    eventBgOpacity.value = event.bg_opacity !== undefined ? Math.round(event.bg_opacity * 100) : 100;
    opacityVal.textContent = `${eventBgOpacity.value}%`;
    
    eventBgColor.value = event.bg_color || '#1e1e2e';
    colorHexVal.textContent = eventBgColor.value.toUpperCase();
    
    // Display units
    const units = event.display_units || ['y', 'd', 'h', 'm', 's'];
    unitCheckboxes.forEach(cb => {
      cb.checked = units.includes(cb.value);
    });
    
    eventTemplateInput.value = event.template || t('defaultTemplate');

    eventCardEffect.value = event.card_effect || 'glass';
    eventCardOpacity.value = event.card_opacity !== undefined ? Math.round(event.card_opacity * 100) : 5;
    cardOpacityVal.textContent = `${eventCardOpacity.value}%`;
    eventCardColor.value = event.card_color || '#ffffff';
    cardColorHexVal.textContent = eventCardColor.value.toUpperCase();
    eventTextColor.value = event.text_color || '#ffffff';
    textColorHexVal.textContent = eventTextColor.value.toUpperCase();

    deleteEventModalBtn.style.display = 'block';
  } else {
    // Create mode
    document.getElementById('modal-title').textContent = t('addEvent');
    eventIdInput.value = '';
    deleteEventModalBtn.style.display = 'none';
    
    // Set default date
    if (prefillDate) {
      eventDateInput.value = prefillDate;
    } else {
      const today = new Date();
      eventDateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    // Default time is next hour
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    eventTimeInput.value = `${String(nextHour.getHours()).padStart(2, '0')}:00:00`;
    
    eventAlldayCheckbox.checked = false;
    eventCountdownCheckbox.checked = true;
    
    // Reset background customizations
    eventBgImage.value = '';
    eventBgEffect.value = 'normal';
    eventBgOpacity.value = 100;
    opacityVal.textContent = '100%';
    eventBgColor.value = '#1e1e2e';
    colorHexVal.textContent = '#1E1E2E';
    
    unitCheckboxes.forEach(cb => cb.checked = true);
    eventTemplateInput.value = t('defaultTemplate');

    eventCardEffect.value = 'glass';
    eventCardOpacity.value = 5;
    cardOpacityVal.textContent = '5%';
    eventCardColor.value = '#ffffff';
    cardColorHexVal.textContent = '#FFFFFF';
    eventTextColor.value = '#ffffff';
    textColorHexVal.textContent = '#FFFFFF';
  }
  
  toggleAllDayFields();
  toggleCountdownFields();
  
  // Show modal
  const modalOverlay = document.getElementById('event-modal');
  modalOverlay.classList.add('open');
}

function closeModal() {
  const modalOverlay = document.getElementById('event-modal');
  modalOverlay.classList.remove('open');
  activeEditEvent = null;
}

// Enable/Disable time input based on All Day Checkbox
function toggleAllDayFields() {
  if (eventAlldayCheckbox.checked) {
    eventTimeInput.style.display = 'none';
    eventTimeInput.removeAttribute('required');
  } else {
    eventTimeInput.style.display = 'block';
    eventTimeInput.setAttribute('required', 'required');
  }
}

// Collapsible countdown panel
function toggleCountdownFields() {
  if (eventCountdownCheckbox.checked) {
    countdownSettingsSection.style.display = 'flex';
  } else {
    countdownSettingsSection.style.display = 'none';
  }
}

// Upload Background Image File to Flask API
async function uploadImageFile(file) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    showToast(t('uploadError') + ": Only image files allowed.", 'error');
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
    
    // Set field and preview
    eventBgImage.value = result.url;
    previewImg.src = result.url;
    uploadPreview.style.display = 'block';
    
    showToast(t('uploadSuccess'), 'success');
  } catch (error) {
    console.error("Upload failed:", error);
    showToast(t('uploadError'), 'error');
  }
}

function removeUploadedBackground() {
  eventBgImage.value = '';
  previewImg.src = '';
  uploadPreview.style.display = 'none';
  bgFileInput.value = '';
}

// Submit Form (Save/Update event)
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const title = eventTitleInput.value.trim();
  const isAllDay = eventAlldayCheckbox.checked;
  const dateStr = eventDateInput.value;
  
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
    let timeStr = eventTimeInput.value;
    if (timeStr.length === 5) { // HH:MM
      timeStr += ':00'; // Make it HH:MM:SS
    }
    finalTimeStr = `${dateStr}T${timeStr}`;
  }

  // Range validation: from now - 16 days to now + 2 years
  const now = new Date();
  const targetDate = new Date(finalTimeStr.replace('T', ' '));
  const timeDiffMs = targetDate.getTime() - now.getTime();
  
  const maxFutureMs = 2 * 365 * 24 * 60 * 60 * 1000;
  const maxPastMs = -16 * 24 * 60 * 60 * 1000;
  
  if (timeDiffMs > maxFutureMs || timeDiffMs < maxPastMs) {
    showToast(t('errorDateRange'), 'error');
    return;
  }

  // Enabled units array
  const displayUnits = [];
  unitCheckboxes.forEach(cb => {
    if (cb.checked) displayUnits.push(cb.value);
  });

  if (displayUnits.length === 0 && eventCountdownCheckbox.checked) {
    // Must check at least one unit
    displayUnits.push('d');
  }

  const payload = {
    id: eventIdInput.value || null,
    title: title,
    time: finalTimeStr,
    is_all_day: isAllDay,
    countdown_enabled: eventCountdownCheckbox.checked,
    bg_image: eventBgImage.value || null,
    bg_effect: eventBgEffect.value,
    bg_opacity: parseFloat((eventBgOpacity.value / 100).toFixed(2)),
    bg_color: eventBgColor.value,
    display_units: displayUnits,
    template: eventTemplateInput.value,
    card_effect: eventCardEffect.value,
    card_color: eventCardColor.value,
    card_opacity: parseFloat((eventCardOpacity.value / 100).toFixed(2)),
    text_color: eventTextColor.value
  };

  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Save error");
    
    closeModal();
    fetchEvents();
    showToast(t('saveSuccess'), 'success');
  } catch (error) {
    console.error("Save failed:", error);
    showToast(t('saveError'), 'error');
  }
}

// Delete Event
async function deleteActiveEvent() {
  const eventId = eventIdInput.value;
  if (eventId) {
    confirmDeleteEvent(eventId);
  }
}

function confirmDeleteEvent(eventId) {
  if (confirm(t('confirmDelete'))) {
    deleteEvent(eventId);
  }
}

async function deleteEvent(eventId) {
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error("Delete error");
    
    closeModal();
    fetchEvents();
    showToast(t('deleteEvent') + " " + t('saveSuccess'), 'success');
  } catch (error) {
    console.error("Delete failed:", error);
    showToast(t('saveError'), 'error');
  }
}

// Toast Alert System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.classList.add('toast', `toast-${type}`);
  
  const icon = document.createElement('span');
  if (type === 'success') {
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else {
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
  }
  
  const text = document.createElement('span');
  text.textContent = message;
  
  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);
  
  // Fade out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}
