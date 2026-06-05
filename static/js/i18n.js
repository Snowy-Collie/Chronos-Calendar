/**
 * Internationalization (i18n) Translations
 */

const TRANSLATIONS = {
  zh: {
    title: "時光倒數曆",
    subtitle: "記錄生活中的重要時刻",
    addEvent: "添加事件",
    editEvent: "編輯事件",
    deleteEvent: "刪除事件",
    settings: "倒數設置",
    eventTitle: "事件名稱",
    eventTitlePlaceholder: "例如：我的生日",
    eventTime: "日期與時間",
    allDay: "全天事件",
    countdownToggle: "開啟倒數計時",
    bgImage: "背景圖片",
    uploadPlaceholder: "拖拽圖片至此，或點擊上傳",
    bgEffect: "背景效果",
    effectNormal: "正常",
    effectGlass: "毛玻璃",
    opacity: "背景透明度",
    bgColor: "背景顏色 overlay",
    cardEffect: "卡片效果",
    cardColor: "卡片顏色",
    cardOpacity: "卡片透明度",
    textColor: "字體顏色",
    effectSolid: "實體填充",
    displayUnits: "顯示時間單位",
    displayTemplate: "自定義顯示內容",
    templateHint: "提示：使用 [y][d][h][m][s] 作為時間占位符，[title] 為事件名。使用 \\ 可轉義括號。",
    save: "保存",
    cancel: "取消",
    delete: "刪除",
    confirmDelete: "確定要刪除這個事件嗎？此操作不可撤銷。",
    invalidTitle: "請輸入事件名稱",
    invalidTime: "請選擇正確的日期與時間",
    errorDateRange: "事件日期必須在當前時間的 16 天前至 2 年以內",
    uploadSuccess: "圖片上傳成功！",
    uploadError: "圖片上傳失敗，請重試",
    saveSuccess: "事件保存成功！",
    saveError: "事件保存失敗，請重試",
    noEvents: "暫無事件，快去創建一個吧！",
    today: "今天",
    daysShort: "天",
    hoursShort: "時",
    minutesShort: "分",
    secondsShort: "秒",
    yearsShort: "年",
    weeks: ["日", "一", "二", "三", "四", "五", "六"],
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    // Default Template Values
    defaultTemplate: "[title] 還有 [d] 天",
    defaultTemplateToday: "[title] 就是今天！",
    defaultTemplatePast: "[title] 已經過去 [d] 天",
    autoCleanNotice: "* 過去超過 16 天的事件將會被自動清理"
  },
  en: {
    title: "Chronos Calendar",
    subtitle: "Chronicle the milestones of your life",
    addEvent: "Add Event",
    editEvent: "Edit Event",
    deleteEvent: "Delete Event",
    settings: "Countdown Settings",
    eventTitle: "Event Name",
    eventTitlePlaceholder: "e.g., My Birthday",
    eventTime: "Date & Time",
    allDay: "All Day Event",
    countdownToggle: "Enable Countdown",
    bgImage: "Background Image",
    uploadPlaceholder: "Drag & drop an image, or click to browse",
    bgEffect: "Background Effect",
    effectNormal: "Normal",
    effectGlass: "Glassmorphism",
    opacity: "Background Opacity",
    bgColor: "Background Color Overlay",
    cardEffect: "Card Effect",
    cardColor: "Card Color",
    cardOpacity: "Card Opacity",
    textColor: "Font Color",
    effectSolid: "Solid Fill",
    displayUnits: "Time Units to Display",
    displayTemplate: "Custom Display Content",
    templateHint: "Hint: Use [y][d][h][m][s] as time placeholders, [title] for event name. Use \\ to escape brackets.",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this event? This action cannot be undone.",
    invalidTitle: "Please enter an event name",
    invalidTime: "Please select a valid date and time",
    errorDateRange: "Event date must be between 16 days in the past and 2 years in the future",
    uploadSuccess: "Image uploaded successfully!",
    uploadError: "Failed to upload image, please try again",
    saveSuccess: "Event saved successfully!",
    saveError: "Failed to save event, please try again",
    noEvents: "No events yet, go ahead and create one!",
    today: "Today",
    daysShort: "d",
    hoursShort: "h",
    minutesShort: "m",
    secondsShort: "s",
    yearsShort: "y",
    weeks: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    // Default Template Values
    defaultTemplate: "[title] is in [d] days",
    defaultTemplateToday: "[title] is today!",
    defaultTemplatePast: "[title] passed [d] days ago",
    autoCleanNotice: "* Events passed by more than 16 days are automatically cleaned up"
  },
  ja: {
    title: "クロノス・カレンダー",
    subtitle: "人生の大切な瞬間を記録する",
    addEvent: "イベント追加",
    editEvent: "イベント編集",
    deleteEvent: "イベント削除",
    settings: "カウントダウン設定",
    eventTitle: "イベント名",
    eventTitlePlaceholder: "例：私の誕生日",
    eventTime: "日付と時間",
    allDay: "終日イベント",
    countdownToggle: "カウントダウンを有効にする",
    bgImage: "背景画像",
    uploadPlaceholder: "画像をドラッグ＆ドロップ、またはクリックして選択",
    bgEffect: "背景エフェクト",
    effectNormal: "通常",
    effectGlass: "グラスモーフィズム",
    opacity: "背景の不透明度",
    bgColor: "背景色オーバーレイ",
    cardEffect: "カードエフェクト",
    cardColor: "カード色",
    cardOpacity: "カード不透明度",
    textColor: "文字色",
    effectSolid: "ソリッド塗りつぶし",
    displayUnits: "表示する時間の単位",
    displayTemplate: "カスタム表示内容",
    templateHint: "ヒント: [y][d][h][m][s] を時間のプレースホルダーとして、[title] をイベント名として使用します。括弧をエスケープするには \\ を使用します。",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    confirmDelete: "このイベントを削除してもよろしいですか？この操作は取り消せません。",
    invalidTitle: "イベント名を入力してください",
    invalidTime: "有効な日付と時間を選択してください",
    errorDateRange: "イベント日は現在から16日前から2年以内の範囲である必要があります",
    uploadSuccess: "画像をアップロードしました！",
    uploadError: "画像のアップロードに失敗しました。もう一度お試しください",
    saveSuccess: "イベントを保存しました！",
    saveError: "イベントの保存に失敗しました。もう一度お試しください",
    noEvents: "イベントがありません。新しく作成しましょう！",
    today: "今日",
    daysShort: "日",
    hoursShort: "時間",
    minutesShort: "分",
    secondsShort: "秒",
    yearsShort: "年",
    weeks: ["日", "月", "火", "水", "木", "金", "土"],
    months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
    // Default Template Values
    defaultTemplate: "[title] まであと [d] 日",
    defaultTemplateToday: "[title] は今日です！",
    defaultTemplatePast: "[title] は [d] 日前に過ぎました",
    autoCleanNotice: "* 16日以上経過したイベントは自動的に削除されます"
  }
};

// Default language state
let currentLanguage = localStorage.getItem('calendar_lang') || 'zh';
if (!TRANSLATIONS[currentLanguage]) {
  currentLanguage = 'zh';
}

/**
 * Gets a translation string for a given key in the current language.
 * 
 * @param {string} key - Translation key
 * @returns {string} Translated text
 */
function t(key) {
  const dict = TRANSLATIONS[currentLanguage];
  return dict[key] || TRANSLATIONS['zh'][key] || key;
}

/**
 * Changes the current language and stores it in localStorage.
 * Triggers a DOM update for elements with `data-i18n` attribute.
 * 
 * @param {string} lang - Language code ('zh', 'en', 'ja')
 */
function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    currentLanguage = lang;
    localStorage.setItem('calendar_lang', lang);
    updateUILocalization();
    
    // Dispatch custom event for page controllers to refresh dynamic layouts (e.g. calendar grid)
    window.dispatchEvent(new CustomEvent('languagechanged', { detail: lang }));
  }
}

/**
 * Helper to update localization of static elements in the DOM.
 * Scans for elements containing `data-i18n` and replaces their text.
 * Also checks `data-i18n-placeholder` for inputs.
 */
function updateUILocalization() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.setAttribute('placeholder', t(key));
  });
  
  // Set active class on language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === currentLanguage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Set html lang attribute
  document.documentElement.setAttribute('lang', currentLanguage);
}

// Initialize localization on DOM load
document.addEventListener('DOMContentLoaded', () => {
  updateUILocalization();
});

// Export variables and functions globally
window.TRANSLATIONS = TRANSLATIONS;
window.currentLanguage = currentLanguage;
window.t = t;
window.setLanguage = setLanguage;
window.updateUILocalization = updateUILocalization;
