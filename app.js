const STORAGE_KEY = "moire-oracle-state-v1";
const VAULT_DB_NAME = "moire-oracle-vault";
const VAULT_DB_VERSION = 1;
const VAULT_STORE_NAME = "snapshots";
const VAULT_RECORD_KEY = "latest";
const BACKUP_FORMAT = "moire-oracle-backup";
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const HOLD_DURATION = 1800;
const placeSearchCache = new Map();
let lastNominatimRequestAt = 0;
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

const defaults = {
  profile: { name: "", birthDate: "", birthTime: "" },
  soundEnabled: true,
  soundPreferenceSet: false,
  installDismissed: false,
  daily: {},
  chronicle: []
};

const forecastBank = {
  titles: [
    "Тихая гравитация",
    "Сдвиг орбиты",
    "Свет между событиями",
    "Нулевая тень",
    "Точка возвращения",
    "Незамкнутый круг"
  ],
  gravity: [
    "Первый сложный разговор окажется легче, если ты начнёшь его до того, как успеешь отрепетировать.",
    "Сегодня твоё внимание дороже скорости. Одна замеченная деталь сэкономит больше времени, чем поспешный ответ.",
    "Задача, которую ты откладываешь, уже стала тяжелее самой работы. Дай ей ровно двенадцать минут.",
    "Не улучшай то, что ещё не существует. Сначала создай грубую версию — ясность догонит действие.",
    "Человек рядом даст тебе больше информации интонацией, чем словами. Не заполняй паузу первым.",
    "День склоняет тебя к лишнему согласию. Одно спокойное «не сейчас» вернёт собственную траекторию."
  ],
  gravityWindows: [
    "СИЛЬНОЕ ОКНО · 09:40—11:20",
    "СИЛЬНОЕ ОКНО · 12:10—13:30",
    "СИЛЬНОЕ ОКНО · 15:20—17:05",
    "СИЛЬНОЕ ОКНО · 18:10—19:40"
  ],
  orbit: [
    "Меркурий ничего не решает, но сегодня хорошо изображает твою потребность перепроверить очевидное.",
    "Луна проходит через вымышленный дом мелких обещаний. Не давай то, что завтра придётся отнимать.",
    "Венера склоняется к красивому решению. Проверь, не маскирует ли эстетика лишнюю сложность.",
    "Сатурн символически напоминает: граница — тоже форма заботы, особенно если её произнести спокойно.",
    "Марс проходит рядом с кнопкой «отправить». Пусть сообщение полежит одну минуту перед касанием."
  ],
  comet: [
    "Открой третье непрочитанное сообщение — не первое.",
    "Если увидишь число 17, заметь, о чём думал секунду назад.",
    "Поменяй привычный маршрут на один безопасный квартал.",
    "Спроси человека о детали, которую обычно пропускают.",
    "Выбери сегодня второй вариант из двух почти равных.",
    "Положи один старый предмет на новое место."
  ],
  eclipseTitles: [
    "След из другого дня",
    "Слово, которого не ждали",
    "Двойное эхо",
    "Сломанная симметрия",
    "Чужая мелодия"
  ],
  eclipse: [
    "До полуночи вернётся тема, которую ты считал закрытой. Узнай её не по словам, а по повторившейся детали.",
    "Кто-то рядом произнесёт редкое для твоего дня слово дважды. Не ищи его — только отметь, если услышишь.",
    "Два несвязанных источника покажут один и тот же образ. Запиши оба до того, как объяснишь совпадение.",
    "Обычная вещь окажется не на своём месте и на секунду изменит смысл происходящего.",
    "Мелодия из прошлого появится без твоего выбора. Важно не какая, а о ком она напомнит."
  ],
  revealTitles: [
    "Контур совпал.",
    "Орбита замкнулась.",
    "Печать принята.",
    "Сигнал вернулся.",
    "Случайность заметила выбор."
  ],
  omens: {
    quiet: [
      "круг внутри прямоугольника",
      "маленький предмет ярко-синего цвета",
      "три одинаковых звука подряд",
      "слово, написанное от руки",
      "отражение, в котором отсутствует источник"
    ],
    strange: [
      "одинокую перчатку",
      "число с двумя одинаковыми цифрами",
      "стрелку, указывающую не туда",
      "закрытую дверь необычного цвета",
      "изображение глаза не на лице"
    ],
    warm: [
      "красную нить или ленту",
      "след чьей-то маленькой заботы",
      "жёлтый цветок вне клумбы",
      "слово благодарности",
      "предмет, оставленный для незнакомца"
    ]
  }
};

const ECHO_DELAY_MS = 18 * 60 * 1000;
const sigilMeta = {
  circle: { symbol: "◯", label: "Круг" },
  rift: { symbol: "⌁", label: "Разлом" },
  three: { symbol: "∴", label: "Три точки" }
};
const missionBank = {
  circle: [
    "В следующие 18 минут поймай одно повторение: слово, жест или форму. Не ищи специально — отметь первое.",
    "Заметь предмет, который образует круг внутри другой формы. Не фотографируй: удержи его в памяти до Эха.",
    "Прислушайся к фразе, которая прозвучит дважды из разных источников. Первое повторение считается."
  ],
  rift: [
    "Измени одну безопасную мелочь привычного порядка: другую руку, дверь или последовательность. Заметь, что сдвинется следом.",
    "Найди единственную деталь, которая нарушает симметрию. Не исправляй её до открытия Эха.",
    "На ближайшей развилке между двумя равными вариантами выбери второй. Наблюдай без попытки объяснить."
  ],
  three: [
    "Отметь третью вещь в первой случайной последовательности: третье слово, звук или объект. Не выбирай удобную.",
    "Найди три несвязанные детали одного цвета. Эхо спросит не о цвете, а о том, что было между ними.",
    "После трёх одинаковых импульсов — уведомлений, шагов или звуков — остановись на один вдох и заметь мысль."
  ]
};
const echoBank = [
  "Повторение было не ответом. Оно показало мысль, которую ты уже носил с собой.",
  "То, что выбилось из ритма, важнее самого ритма. Вспомни первую секунду после сбоя.",
  "Ты заметил не знак, а собственный фильтр внимания. Сегодня он указывает на незакрытый выбор.",
  "Совпадение становится личным только в момент узнавания. Что именно ты хотел услышать от него?",
  "Между первым сигналом и вторым была короткая пауза. Решение прячется не в знаках, а в этой паузе.",
  "Если ничего не произошло, это тоже результат: сегодня ожидание было сильнее наблюдения.",
  "Знак не предсказывает событие. Он отмечает место, где твоя интуиция опередила объяснение.",
  "Первое объяснение слишком гладкое. Сохрани второе — оно будет честнее к вечеру.",
  "Случайность не обязана иметь смысл. Но выбранная тобой деталь уже изменила рисунок дня."
];
const fragmentCopyBank = [
  "Сохранён след между ожиданием и совпадением.",
  "Хроника приняла наблюдение без исправлений.",
  "Незакрытый контур стал частью личного рисунка.",
  "Ты вернулся к сигналу — именно это завершило цепь."
];

const initialLocalState = readLocalState();
let state = initialLocalState.state;
let currentRitual = { energy: "", card: null, holdMs: 0, seal: "", forecast: null };
let currentThreshold = { radius: 1200, tone: "quiet", seal: "", omen: "", intention: "" };
let holdTimer = null;
let holdStartedAt = 0;
let holdFrame = null;
let toastTimer = null;
let audioContext = null;
let ambientNodes = [];
let echoTimer = null;
let ambientStarted = false;
let ambientStarting = false;
let vaultWriteQueue = Promise.resolve(true);
let persistenceRequested = false;
let storageProtection = {
  localFound: initialLocalState.found,
  localCorrupt: initialLocalState.corrupt,
  mirror: "pending",
  persisted: null,
  recovered: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeState(saved) {
  const source = isPlainObject(saved) ? saved : {};
  const sourceProfile = isPlainObject(source.profile) ? source.profile : {};
  const hasSoundPreference = source.soundPreferenceSet === true;

  return {
    profile: {
      name: typeof sourceProfile.name === "string" ? sourceProfile.name.slice(0, 24) : "",
      birthDate: typeof sourceProfile.birthDate === "string" ? sourceProfile.birthDate : "",
      birthTime: typeof sourceProfile.birthTime === "string" ? sourceProfile.birthTime : ""
    },
    soundEnabled: hasSoundPreference ? source.soundEnabled !== false : true,
    soundPreferenceSet: hasSoundPreference,
    installDismissed: source.installDismissed === true,
    daily: isPlainObject(source.daily) ? source.daily : {},
    chronicle: Array.isArray(source.chronicle) ? source.chronicle : []
  };
}

function readLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state: structuredClone(defaults), found: false, corrupt: false };
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) throw new Error("Invalid local state");
    return { state: normalizeState(parsed), found: true, corrupt: false };
  } catch {
    return { state: structuredClone(defaults), found: false, corrupt: true };
  }
}

function openVault() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(VAULT_STORE_NAME)) {
        database.createObjectStore(VAULT_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Vault unavailable"));
    request.onblocked = () => reject(new Error("Vault blocked"));
  });
}

async function readVaultSnapshot() {
  const database = await openVault();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(VAULT_STORE_NAME, "readonly");
      const request = transaction.objectStore(VAULT_STORE_NAME).get(VAULT_RECORD_KEY);
      request.onsuccess = () => resolve(request.result?.state ? normalizeState(request.result.state) : null);
      request.onerror = () => reject(request.error || new Error("Vault read failed"));
    });
  } finally {
    database.close();
  }
}

async function writeVaultSnapshot(snapshot) {
  const database = await openVault();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(VAULT_STORE_NAME, "readwrite");
      transaction.objectStore(VAULT_STORE_NAME).put({
        id: VAULT_RECORD_KEY,
        version: BACKUP_VERSION,
        updatedAt: new Date().toISOString(),
        state: normalizeState(snapshot)
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Vault write failed"));
      transaction.onabort = () => reject(transaction.error || new Error("Vault write aborted"));
    });
  } finally {
    database.close();
  }
}

async function deleteVaultSnapshot() {
  await vaultWriteQueue.catch(() => false);
  const database = await openVault();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(VAULT_STORE_NAME, "readwrite");
      transaction.objectStore(VAULT_STORE_NAME).delete(VAULT_RECORD_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Vault delete failed"));
      transaction.onabort = () => reject(transaction.error || new Error("Vault delete aborted"));
    });
  } finally {
    database.close();
  }
}

function queueVaultSnapshot(snapshot = state) {
  const copy = normalizeState(structuredClone(snapshot));
  vaultWriteQueue = vaultWriteQueue
    .catch(() => false)
    .then(() => writeVaultSnapshot(copy))
    .then(() => {
      storageProtection.mirror = "ready";
      updateStorageStatusUI();
      return true;
    })
    .catch(() => {
      storageProtection.mirror = "unavailable";
      updateStorageStatusUI();
      return false;
    });
  return vaultWriteQueue;
}

function saveState() {
  let localSaved = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localSaved = true;
    storageProtection.localFound = true;
    storageProtection.localCorrupt = false;
  } catch {
    storageProtection.localFound = false;
  }

  return queueVaultSnapshot(state).then((mirrored) => localSaved || mirrored);
}

async function restoreStateBeforeInit() {
  if (initialLocalState.found) {
    queueVaultSnapshot(state);
  } else {
    try {
      const snapshot = await readVaultSnapshot();
      if (snapshot) {
        state = snapshot;
        storageProtection.recovered = true;
        storageProtection.mirror = "ready";
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          storageProtection.localFound = true;
          storageProtection.localCorrupt = false;
        } catch {
          storageProtection.localFound = false;
        }
      } else {
        storageProtection.mirror = "ready";
      }
    } catch {
      storageProtection.mirror = "unavailable";
    }
  }

  if (navigator.storage?.persisted) {
    try {
      storageProtection.persisted = await navigator.storage.persisted();
    } catch {
      storageProtection.persisted = null;
    }
  }
}

async function requestPersistentStorage() {
  if (persistenceRequested) return storageProtection.persisted;
  persistenceRequested = true;
  if (!navigator.storage?.persist) return null;

  try {
    storageProtection.persisted = await navigator.storage.persist();
  } catch {
    storageProtection.persisted = null;
  }
  updateStorageStatusUI();
  return storageProtection.persisted;
}

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(new Date());
}

function localDateLabel() {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long"
  })
    .format(new Date())
    .replace(/^./, (char) => char.toUpperCase());
}

function timePhase() {
  const hour = new Date().getHours();
  if (hour < 6) return "НОЧНОЙ КОНТУР";
  if (hour < 11) return "УТРЕННЯЯ ОРБИТА";
  if (hour < 17) return "ПОЛЕ ДНЕВНОГО СВЕТА";
  if (hour < 22) return "СУМЕРЕЧНЫЙ ПОРОГ";
  return "ТИХАЯ ОРБИТА";
}

function stringHash(input) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

async function sha256(input) {
  const data = new TextEncoder().encode(input);
  if (crypto.subtle) {
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return stringHash(input).toString(16).padStart(8, "0").repeat(8);
}

function vibrate(pattern = 12) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(kind = "tap") {
  if (!state.soundEnabled) return;
  const context = initAudioContext();
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);

  const notes = {
    tap: [330, 0.08, "sine", 0.022],
    select: [440, 0.14, "sine", 0.035],
    seal: [196, 0.65, "sine", 0.05],
    reveal: [261.63, 1.2, "sine", 0.065],
    miss: [146.83, 0.35, "triangle", 0.025]
  };
  const [frequency, duration, type, volume] = notes[kind] || notes.tap;

  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (kind === "reveal") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);
  if (kind === "seal") oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.74, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.05);
}

function startProceduralAmbient() {
  if (!state.soundEnabled || ambientNodes.length) return;
  const context = initAudioContext();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const lfo = context.createOscillator();
  const lfoGain = context.createGain();

  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.022, context.currentTime + 2.5);
  filter.type = "lowpass";
  filter.frequency.value = 310;
  filter.Q.value = 2.4;
  lfo.type = "sine";
  lfo.frequency.value = 0.055;
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  filter.connect(master);
  master.connect(context.destination);

  const voices = [
    { frequency: 55, type: "sine", detune: -4 },
    { frequency: 82.41, type: "sine", detune: 3 },
    { frequency: 110, type: "triangle", detune: -7 }
  ].map((voice, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = voice.type;
    oscillator.frequency.value = voice.frequency;
    oscillator.detune.value = voice.detune;
    gain.gain.value = index === 2 ? 0.11 : 0.22;
    oscillator.connect(gain);
    gain.connect(filter);
    oscillator.start();
    return { oscillator, gain };
  });

  lfo.start();
  ambientNodes = [{ master, filter, lfo, lfoGain }, ...voices];
}

function stopProceduralAmbient() {
  if (!ambientNodes.length) return;
  const context = initAudioContext();
  const root = ambientNodes[0];
  root.master.gain.cancelScheduledValues(context.currentTime);
  root.master.gain.setTargetAtTime(0.0001, context.currentTime, 0.22);
  setTimeout(() => {
    ambientNodes.slice(1).forEach(({ oscillator }) => {
      try {
        oscillator.stop();
      } catch {
        // Already stopped.
      }
    });
    try {
      root.lfo.stop();
    } catch {
      // Already stopped.
    }
    ambientNodes = [];
  }, 1200);
}

async function startAmbientSound() {
  if (!state.soundEnabled || ambientStarting) return;
  const ambient = $("#ambient-audio");
  if (!ambient) return;
  if (!ambient.paused) {
    ambientStarted = true;
    return;
  }
  ambientStarting = true;
  ambient.volume = 0.34;
  try {
    await ambient.play();
    ambientStarted = true;
    stopProceduralAmbient();
  } catch {
    startProceduralAmbient();
    ambientStarted = true;
  } finally {
    ambientStarting = false;
  }
}

function stopAmbientSound() {
  const ambient = $("#ambient-audio");
  if (ambient) {
    ambient.pause();
    ambient.currentTime = 0;
  }
  ambientStarted = false;
  ambientStarting = false;
  stopProceduralAmbient();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 3200);
}

function setView(target) {
  $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === target));
  $$(".nav-item").forEach((item) => {
    const active = item.dataset.target === target;
    item.classList.toggle("is-active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (target === "chronicle") renderChronicle();
  playTone("tap");
}

function openLayer(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  const focusable = element.querySelector("button, input, textarea, a");
  setTimeout(() => focusable?.focus({ preventScroll: true }), 30);
}

function closeLayer(element) {
  const layer = element.closest(".modal, .sheet");
  if (!layer) return;
  layer.classList.add("hidden");
  document.body.style.overflow = "";
}

function updateProfileUI() {
  const { name, birthDate, birthTime } = state.profile;
  $("#avatar-letter").textContent = name ? name.trim()[0].toUpperCase() : "○";
  $("#name-input").value = name;
  $("#birth-date-input").value = birthDate;
  $("#birth-time-input").value = birthTime;
  $("#personal-greeting").textContent = name
    ? `${name.toUpperCase()}, ТВОЙ ДЕНЬ ЕЩЁ НЕ ОТКРЫТ`
    : "ТВОЙ ДЕНЬ ЕЩЁ НЕ ОТКРЫТ";
  updateStorageStatusUI();
}

function hasPersonalData() {
  return Boolean(
    state.profile.name ||
      state.profile.birthDate ||
      state.profile.birthTime ||
      Object.keys(state.daily).length ||
      state.chronicle.length
  );
}

function updateStorageStatusUI() {
  const status = $("#vault-status");
  const detail = $("#vault-status-detail");
  const recoveryNote = $("#vault-recovery-note");
  if (!status || !detail || !recoveryNote) return;

  if (storageProtection.recovered) {
    status.textContent = "Данные восстановлены из зеркала";
  } else if (storageProtection.persisted === true) {
    status.textContent = "Хранилище закреплено на устройстве";
  } else if (storageProtection.mirror === "ready") {
    status.textContent = "Двойное локальное сохранение работает";
  } else if (storageProtection.mirror === "unavailable") {
    status.textContent = storageProtection.localFound
      ? "Доступна одна локальная копия"
      : "Локальное хранилище заблокировано";
  } else {
    status.textContent = "Создаём защитное зеркало…";
  }

  detail.textContent =
    storageProtection.persisted === true
      ? "Основная запись и защитное зеркало обновляются автоматически. Отдельный файл всё равно нужен для переноса между Safari и иконкой «Домой»."
      : "Основная запись и защитное зеркало обновляются автоматически. iOS всё равно может очистить оба — сохрани отдельный файл в «Файлы» или iCloud.";

  const shouldShowRecovery = !hasPersonalData() && !storageProtection.recovered;
  recoveryNote.classList.toggle("hidden", !shouldShowRecovery);
  if (shouldShowRecovery) {
    recoveryNote.textContent = storageProtection.localCorrupt
      ? "Локальная запись повреждена, а восстановить её из зеркала не удалось. Если MOIRÉ раньше открывался в Safari, проверь ту же ссылку там и создай резервную копию."
      : "В этом контуре данных не найдено. Если раньше открывал MOIRÉ в Safari, проверь ту же ссылку там: Safari и иконка «Домой» могут хранить данные раздельно.";
  }
}

function createBackupEnvelope() {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appState: normalizeState(state)
  };
}

function downloadBackupFile(file) {
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = file.name;
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function exportBackup() {
  await requestPersistentStorage();
  await saveState();

  const payload = JSON.stringify(createBackupEnvelope(), null, 2);
  const file = new File([payload], `moire-backup-${todayKey()}.json`, {
    type: "application/json"
  });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Резервная копия MOIRÉ",
        text: "Сохрани этот файл в «Файлы» или iCloud."
      });
      showToast("Резервная копия передана в меню «Поделиться».");
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  downloadBackupFile(file);
  showToast("Резервная копия создана. Сохрани файл в надёжном месте.");
}

function readBackupState(parsed) {
  if (!isPlainObject(parsed) || parsed.format !== BACKUP_FORMAT) {
    throw new Error("Это не резервная копия MOIRÉ.");
  }
  if (parsed.version !== BACKUP_VERSION || !isPlainObject(parsed.appState)) {
    throw new Error("Версия резервной копии не поддерживается.");
  }
  return normalizeState(parsed.appState);
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > MAX_BACKUP_BYTES) {
    throw new Error("Файл слишком большой для резервной копии MOIRÉ.");
  }

  const importedState = readBackupState(JSON.parse(await file.text()));
  const importedName = importedState.profile.name ? ` для ${importedState.profile.name}` : "";
  if (!window.confirm(`Восстановить данные${importedName}? Текущая запись на этом устройстве будет заменена.`)) {
    return;
  }

  state = importedState;
  storageProtection.recovered = true;
  const saved = await saveState();
  if (!saved) throw new Error("Браузер не разрешил сохранить восстановленные данные.");
  updateProfileUI();
  showToast("Данные восстановлены. MOIRÉ перезапускает контур…");
  window.setTimeout(() => window.location.reload(), 900);
}

function showRitualStep(step) {
  $$(".ritual-step").forEach((element) => {
    element.classList.toggle("is-active", Number(element.dataset.step) === step);
  });
  $$(".ritual-progress span").forEach((element, index) => {
    element.classList.toggle("is-active", index < Math.min(step, 3));
  });
  $(".ritual-progress").classList.toggle("hidden", step === 4);
}

function resetRitual() {
  currentRitual = { energy: "", card: null, holdMs: 0, seal: "", forecast: null };
  $("#hold-button").className = "hold-button";
  $("#hold-button").style.removeProperty("--hold-progress");
  $("#hold-hint").textContent = "1,8 секунды";
  showRitualStep(1);
}

function startHold(event) {
  event.preventDefault();
  const button = $("#hold-button");
  holdStartedAt = performance.now();
  button.classList.add("is-holding");
  vibrate(8);
  playTone("seal");

  const animate = () => {
    const elapsed = performance.now() - holdStartedAt;
    const progress = Math.min(elapsed / HOLD_DURATION, 1);
    button.style.setProperty("--hold-progress", `${progress * 360}deg`);
    $("#hold-hint").textContent = progress < 1 ? `${(1.8 - elapsed / 1000).toFixed(1).replace(".", ",")} секунды` : "печать замкнулась";
    if (progress < 1) holdFrame = requestAnimationFrame(animate);
  };
  holdFrame = requestAnimationFrame(animate);

  holdTimer = setTimeout(() => {
    currentRitual.holdMs = Math.round(performance.now() - holdStartedAt);
    button.classList.remove("is-holding");
    button.classList.add("is-complete");
    $("#hold-hint").textContent = "печать замкнулась";
    vibrate([18, 45, 24]);
    playTone("select");
    setTimeout(() => showRitualStep(3), 550);
  }, HOLD_DURATION);
}

function cancelHold() {
  if (!holdStartedAt || currentRitual.holdMs) return;
  clearTimeout(holdTimer);
  cancelAnimationFrame(holdFrame);
  const elapsed = Math.max(1, performance.now() - holdStartedAt);
  currentRitual.holdMs = Math.round(elapsed);
  const button = $("#hold-button");
  button.classList.remove("is-holding");
  button.style.removeProperty("--hold-progress");
  $("#hold-hint").textContent = "круг изменился — попробуй ещё";
  holdStartedAt = 0;
  playTone("miss");
}

function personalKeyMaterial(profile = state.profile) {
  return [
    profile.name.trim().toLocaleLowerCase("ru-RU") || "anonymous",
    profile.birthDate || "no-birth-date",
    profile.birthTime || timePhase()
  ].join("|");
}

function ritualSealMaterial({ energy, holdMs, card }, profile = state.profile) {
  return [todayKey(), personalKeyMaterial(profile), energy, holdMs, card].join("|");
}

async function chooseCard(cardIndex) {
  currentRitual.card = cardIndex;
  currentRitual.seal = await sha256(
    ritualSealMaterial({
      energy: currentRitual.energy,
      holdMs: currentRitual.holdMs,
      card: cardIndex
    })
  );
  currentRitual.forecast = buildForecast(currentRitual.seal);

  $("#ritual-seal").textContent = currentRitual.seal.slice(0, 16).toUpperCase();
  $("#reveal-title").textContent = currentRitual.forecast.revealTitle;
  $("#reveal-copy").textContent =
    state.profile.name
      ? `${state.profile.name}, текст уже связан с печатью ${currentRitual.seal.slice(0, 6).toUpperCase()}.`
      : `Текст уже связан с печатью ${currentRitual.seal.slice(0, 6).toUpperCase()}.`;
  showRitualStep(4);
  playTone("reveal");
  vibrate([20, 50, 35]);
}

function buildForecast(seal) {
  const random = mulberry32(stringHash(seal));
  return {
    title: pick(forecastBank.titles, random),
    gravity: pick(forecastBank.gravity, random),
    gravityWindow: pick(forecastBank.gravityWindows, random),
    orbit: pick(forecastBank.orbit, random),
    comet: pick(forecastBank.comet, random),
    eclipseTitle: pick(forecastBank.eclipseTitles, random),
    eclipse: pick(forecastBank.eclipse, random),
    revealTitle: pick(forecastBank.revealTitles, random),
    strength: 61 + Math.floor(random() * 28)
  };
}

function persistDailyForecast() {
  const key = todayKey();
  state.daily[key] = {
    ...currentRitual.forecast,
    seal: currentRitual.seal,
    energy: currentRitual.energy,
    holdMs: currentRitual.holdMs,
    card: currentRitual.card,
    revision: 1,
    createdAt: new Date().toISOString()
  };

  if (!state.chronicle.some((item) => item.id === `daily-${key}`)) {
    state.chronicle.unshift({
      id: `daily-${key}`,
      type: "daily",
      title: currentRitual.forecast.eclipseTitle,
      copy: currentRitual.forecast.eclipse,
      createdAt: new Date().toISOString(),
      outcome: "open"
    });
  }
  saveState();
}

async function regenerateTodayForProfile(previousProfile) {
  const key = todayKey();
  const existing = state.daily[key];
  if (!existing || personalKeyMaterial(previousProfile) === personalKeyMaterial(state.profile)) return false;

  const seal = await sha256(
    ritualSealMaterial({
      energy: existing.energy || "steady",
      holdMs: existing.holdMs || HOLD_DURATION,
      card: Number.isInteger(existing.card) ? existing.card : 0
    })
  );
  if (seal === existing.seal) return false;

  const rebuilt = buildForecast(seal);
  state.daily[key] = {
    ...existing,
    ...rebuilt,
    seal,
    loop: null,
    revision: (existing.revision || 1) + 1,
    regeneratedAt: new Date().toISOString()
  };

  const chronicleItem = state.chronicle.find((entry) => entry.id === `daily-${key}`);
  if (chronicleItem) {
    chronicleItem.title = rebuilt.eclipseTitle;
    chronicleItem.copy = rebuilt.eclipse;
    chronicleItem.outcome = "open";
    chronicleItem.revisedAt = new Date().toISOString();
  }
  state.chronicle = state.chronicle.filter((entry) => entry.id !== `echo-${key}`);
  saveState();
  renderExistingDaily();
  if (!$("#forecast-section").classList.contains("hidden")) renderForecast(state.daily[key]);
  renderChronicle();
  return true;
}

function renderForecast(forecast) {
  $("#forecast-title").textContent = forecast.title;
  $("#gravity-copy").textContent = forecast.gravity;
  $("#gravity-window").textContent = forecast.gravityWindow;
  $("#gravity-strength").textContent = `${forecast.strength}% резонанса`;
  $("#orbit-copy").textContent = forecast.orbit;
  $("#comet-copy").textContent = forecast.comet;
  $("#eclipse-title").textContent = forecast.eclipseTitle;
  $("#eclipse-copy").textContent = forecast.eclipse;
  $("#forecast-seal-short").textContent = forecast.seal.slice(0, 8).toUpperCase();
  $("#full-forecast-seal").textContent = forecast.seal.toUpperCase();
  $("#outcome-question").textContent = forecast.eclipse;
  $("#forecast-section").classList.remove("hidden");
  $(".oracle-hero").classList.add("hidden");
  renderDailyLoop(forecast);
}

function revealForecast() {
  persistDailyForecast();
  closeLayer($("#ritual-modal"));
  renderForecast(state.daily[todayKey()]);
  playTone("reveal");
  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
}

function updateReturnCue(forecast = state.daily[todayKey()]) {
  const loop = forecast?.loop;
  const needsReturn = Boolean(loop && !loop.closedAt && (loop.revealedAt || Date.now() >= loop.unlockAt));
  $("#echo-nav-alert").classList.toggle("hidden", !needsReturn);
  $("#today-nav-label").textContent = needsReturn ? "Эхо" : "Сегодня";
}

function renderExistingDaily() {
  const forecast = state.daily[todayKey()];
  updateReturnCue(forecast);
  if (!forecast) return;
  $("#open-day-button").classList.add("hidden");
  $("#show-forecast-button").classList.remove("hidden");
  $("#personal-greeting").textContent = state.profile.name
    ? `${state.profile.name.toUpperCase()}, ДЕНЬ УЖЕ ЗАПЕЧАТАН`
    : "ДЕНЬ УЖЕ ЗАПЕЧАТАН";
  const loop = forecast.loop;
  if (loop?.closedAt) {
    $("#hero-copy").textContent = `Петля замкнута. Фрагмент ${loop.fragmentId} уже лежит в Хронике.`;
    $("#show-forecast-button").textContent = "Вернуться к печати";
  } else if (loop && Date.now() >= loop.unlockAt) {
    $("#hero-copy").textContent = "Запечатанное Эхо созрело. Оно не откроется без твоего возвращения.";
    $("#show-forecast-button").textContent = "Открыть созревшее Эхо";
  } else if (loop) {
    $("#hero-copy").textContent = "Контракт внимания действует. Эхо откроется после короткой паузы.";
    $("#show-forecast-button").textContent = "Проверить Эхо";
  } else {
    $("#hero-copy").textContent = "Прогноз сохранён. Выбери личный символ, чтобы день продолжил отвечать без геопозиции.";
    $("#show-forecast-button").textContent = "Продолжить прогноз";
  }
}

function formatEchoCountdown(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function previousEchoEntry() {
  return state.chronicle.find((entry) => entry.type === "echo" && entry.id !== `echo-${todayKey()}`) || null;
}

function renderDailyLoop(forecast = state.daily[todayKey()]) {
  if (!forecast) return;
  updateReturnCue(forecast);
  clearInterval(echoTimer);
  echoTimer = null;

  const loop = forecast.loop;
  const symbolStage = $("#loop-symbol-stage");
  const missionStage = $("#loop-mission-stage");
  const echoStage = $("#loop-echo-stage");
  const completeStage = $("#loop-complete-stage");
  [symbolStage, missionStage, echoStage, completeStage].forEach((stage) => stage.classList.add("hidden"));

  if (!loop) {
    const previous = previousEchoEntry();
    const previousId = previous?.title.match(/Φ-\d{3}/u)?.[0];
    symbolStage.classList.remove("hidden");
    $("#loop-progress").textContent = "0/3";
    $("#daily-loop-title").textContent = previous ? "Вчерашний фрагмент снова на линии." : "Оставь дню незакрытый вопрос.";
    $("#loop-symbol-copy").textContent = previous
      ? `${previousId || "Прошлый фрагмент"} изменит сегодняшнюю цепь. Выбери новый знак первым импульсом.`
      : "Не анализируй. Выбери знак, который первым показался знакомым.";
    return;
  }

  if (loop.closedAt) {
    completeStage.classList.remove("hidden");
    $("#loop-progress").textContent = "3/3";
    $("#daily-loop-title").textContent = "Контур замкнулся.";
    $("#fragment-mark").textContent = loop.fragmentId;
    $("#fragment-title").textContent = `${loop.rarityLabel} сохранён в Хронике.`;
    $("#fragment-copy").textContent = loop.fragmentCopy;
    return;
  }

  if (loop.revealedAt) {
    echoStage.classList.remove("hidden");
    $("#loop-progress").textContent = "2/3";
    $("#daily-loop-title").textContent = "Сверь Эхо с реальностью.";
    $("#echo-copy").textContent = loop.echo;
    return;
  }

  missionStage.classList.remove("hidden");
  $("#loop-progress").textContent = "1/3";
  $("#daily-loop-title").textContent = "Контракт внимания действует.";
  $("#mission-sigil").textContent = sigilMeta[loop.sigil]?.symbol || "◯";
  $("#mission-copy").textContent = loop.mission;

  const lock = $("#echo-lock");
  const revealButton = $("#reveal-echo-button");
  const updateCountdown = () => {
    const remaining = loop.unlockAt - Date.now();
    $("#echo-countdown").textContent = formatEchoCountdown(remaining);
    const ready = remaining <= 0;
    lock.classList.toggle("hidden", ready);
    revealButton.classList.toggle("hidden", !ready);
    if (ready && echoTimer) {
      clearInterval(echoTimer);
      echoTimer = null;
      updateReturnCue(forecast);
      renderExistingDaily();
    }
  };
  updateCountdown();
  if (loop.unlockAt > Date.now()) echoTimer = window.setInterval(updateCountdown, 1000);
}

function selectDailySigil(sigil) {
  const forecast = state.daily[todayKey()];
  if (!forecast || forecast.loop || !sigilMeta[sigil]) return;
  const random = mulberry32(stringHash(`${forecast.seal}|${sigil}|daily-echo-v1`));
  const rarityRoll = random();
  const rarityLabel =
    rarityRoll < 0.08 ? "АНОМАЛЬНЫЙ ФРАГМЕНТ" : rarityRoll < 0.34 ? "РЕДКИЙ ФРАГМЕНТ" : "ФРАГМЕНТ";
  const fragmentId = `Φ-${String(Math.floor(random() * 1000)).padStart(3, "0")}`;
  const previous = previousEchoEntry();
  const baseFragmentCopy = pick(fragmentCopyBank, random);
  forecast.loop = {
    sigil,
    mission: pick(missionBank[sigil], random),
    echo: pick(echoBank, random),
    parentFragmentId: previous?.title.match(/Φ-\d{3}/u)?.[0] || null,
    startedAt: new Date().toISOString(),
    unlockAt: Date.now() + ECHO_DELAY_MS,
    revealedAt: null,
    closedAt: null,
    outcome: null,
    fragmentId,
    rarityLabel,
    fragmentCopy: previous
      ? `${baseFragmentCopy} Связь с ${previous.title.match(/Φ-\d{3}/u)?.[0] || "прошлым фрагментом"} сохранена.`
      : baseFragmentCopy
  };
  saveState();
  renderDailyLoop(forecast);
  renderExistingDaily();
  playTone("seal");
  vibrate([15, 35, 18]);
  showToast("Контракт принят. Эхо созреет через 18 минут — возвращение завершит цепь.");
}

function revealDailyEcho() {
  const forecast = state.daily[todayKey()];
  const loop = forecast?.loop;
  if (!loop || loop.revealedAt) return;
  if (Date.now() < loop.unlockAt) {
    showToast(`Эхо ещё запечатано: ${formatEchoCountdown(loop.unlockAt - Date.now())}.`);
    return;
  }
  loop.revealedAt = new Date().toISOString();
  saveState();
  renderDailyLoop(forecast);
  renderExistingDaily();
  playTone("reveal");
  vibrate([20, 45, 30]);
}

function closeDailyLoop(outcome) {
  const key = todayKey();
  const forecast = state.daily[key];
  const loop = forecast?.loop;
  if (!loop || !loop.revealedAt || loop.closedAt) return;
  loop.outcome = outcome;
  loop.closedAt = new Date().toISOString();

  const entry = {
    id: `echo-${key}`,
    type: "echo",
    title: `${loop.rarityLabel} ${loop.fragmentId}`,
    copy: loop.echo,
    createdAt: loop.closedAt,
    outcome
  };
  const existingIndex = state.chronicle.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) state.chronicle.splice(existingIndex, 1, entry);
  else state.chronicle.unshift(entry);

  saveState();
  renderDailyLoop(forecast);
  renderExistingDaily();
  renderChronicle();
  playTone(outcome === "miss" ? "miss" : "reveal");
  vibrate(outcome === "miss" ? 14 : [16, 35, 16, 35, 28]);
  showToast(`${loop.fragmentId} сохранён. Завтра рисунок продолжится.`);
}

function openOutcomeModal() {
  const item = state.chronicle.find((entry) => entry.id === `daily-${todayKey()}`);
  if (item?.outcome && item.outcome !== "open") {
    showToast("Ты уже отметил исход этого события.");
    return;
  }
  const forecast = state.daily[todayKey()];
  if (forecast) $("#outcome-question").textContent = forecast.eclipse;
  openLayer("outcome-modal");
}

function recordOutcome(outcome) {
  const item = state.chronicle.find((entry) => entry.id === `daily-${todayKey()}`);
  if (item) item.outcome = outcome;
  saveState();
  closeLayer($("#outcome-modal"));
  renderChronicle();
  const messages = {
    exact: "Точное совпадение сохранено. Но печать помнит и будущие промахи.",
    near: "Почти — тоже сохранено без приукрашивания.",
    miss: "Промах сохранён. Честная хроника сильнее красивой легенды."
  };
  showToast(messages[outcome]);
  playTone(outcome === "miss" ? "miss" : "select");
}

function formatShortDate(iso) {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(iso));
}

function renderChronicle() {
  const entries = state.chronicle;
  $("#chronicle-count").textContent = String(entries.length).padStart(2, "0");
  $("#chronicle-empty").classList.toggle("hidden", entries.length > 0);
  $("#chronicle-content").classList.toggle("hidden", entries.length === 0);
  $("#stat-observed").textContent = entries.length;
  $("#stat-exact").textContent = entries.filter((entry) => entry.outcome === "exact").length;
  $("#stat-streak").textContent = calculateStreak(entries);
  const list = $("#chronicle-list");
  list.innerHTML = "";

  const outcomeLabels = { exact: "ТОЧНО", near: "ПОЧТИ", miss: "НЕТ", open: "ОТКРЫТО" };
  const typeLabels = { threshold: "Порог", echo: "Эхо", daily: "Затмение" };
  const typeSymbols = { threshold: "⌖", echo: "∴", daily: "✦" };
  entries.slice(0, 24).forEach((entry) => {
    const article = document.createElement("article");
    article.className = "chronicle-item";
    const symbol = typeSymbols[entry.type] || "✦";
    article.innerHTML = `
      <span class="chronicle-symbol" aria-hidden="true">${symbol}</span>
      <span>
        <strong>${escapeHTML(entry.title)}</strong>
        <small>${formatShortDate(entry.createdAt)} · ${typeLabels[entry.type] || "След"}</small>
      </span>
      <span class="outcome-badge">${outcomeLabels[entry.outcome] || "СЛЕД"}</span>
    `;
    list.append(article);
  });
}

function calculateStreak(entries) {
  const days = [...new Set(entries.map((entry) => entry.createdAt.slice(0, 10)))].sort().reverse();
  if (!days.length) return 0;
  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T12:00:00`);
    const current = new Date(`${days[index]}T12:00:00`);
    if ((previous - current) / 86400000 === 1) streak += 1;
    else break;
  }
  return streak;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectChip(groupId, button) {
  $$(`#${groupId} .choice-chip`).forEach((chip) => chip.classList.remove("is-selected"));
  button.classList.add("is-selected");
  if (groupId === "radius-choices") currentThreshold.radius = Number(button.dataset.value);
  if (groupId === "tone-choices") currentThreshold.tone = button.dataset.value;
  playTone("tap");
}

async function sealIntention(event) {
  event.preventDefault();
  const intention = $("#intention-input").value.trim();
  if (!intention) return;
  if (!$("#safety-confirm").checked) {
    showToast("Сначала подтверди правила безопасного Порога.");
    return;
  }

  const material = [
    todayKey(),
    state.profile.birthDate || "unkeyed",
    intention.toLocaleLowerCase("ru-RU"),
    currentThreshold.radius,
    currentThreshold.tone
  ].join("|");
  currentThreshold.intention = intention;
  currentThreshold.seal = await sha256(material);
  const random = mulberry32(stringHash(currentThreshold.seal));
  currentThreshold.omen = pick(forecastBank.omens[currentThreshold.tone], random);

  $("#intention-seal").textContent = currentThreshold.seal.slice(0, 16).toUpperCase();
  $("#omen-copy").textContent = currentThreshold.omen;
  $("#threshold-form").classList.add("hidden");
  $("#threshold-result").classList.remove("hidden");
  updateThresholdAvailability();
  playTone("seal");
  vibrate([18, 40, 18]);
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation-unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000
    });
  });
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const radius = 6371000;
  const toRad = (degree) => (degree * Math.PI) / 180;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

function overpassQuery(latitude, longitude, radius) {
  return `
    [out:json][timeout:8];
    (
      nwr(around:${radius},${latitude},${longitude})["name"]["tourism"="artwork"];
      nwr(around:${radius},${latitude},${longitude})["name"]["leisure"="park"];
    );
    out center tags 50;
  `.trim();
}

function extractPlaces(elements, origin, radius) {
  const permitted = new Set(["artwork", "viewpoint", "memorial", "monument", "park", "library", "community_centre"]);
  const blockedAccess = new Set(["private", "no", "customers"]);
  return elements
    .map((element) => {
      const latitude = Number(element.lat ?? element.center?.lat);
      const longitude = Number(element.lon ?? element.center?.lon);
      const tags = element.tags || {};
      const category = tags.tourism || tags.historic || tags.leisure || tags.amenity;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !tags.name ||
        !permitted.has(category) ||
        blockedAccess.has(tags.access)
      ) {
        return null;
      }
      const distance = Math.round(haversineMeters(origin.latitude, origin.longitude, latitude, longitude));
      if (distance < 100 || distance > radius * 1.12) return null;
      return {
        id: `${element.type}-${element.id}`,
        name: tags.name,
        category,
        latitude,
        longitude,
        distance
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function nominatimViewbox(origin, radius) {
  const latitudeDelta = radius / 111320;
  const longitudeScale = Math.max(Math.cos((origin.latitude * Math.PI) / 180), 0.2);
  const longitudeDelta = radius / (111320 * longitudeScale);
  return [
    origin.longitude - longitudeDelta,
    origin.latitude + latitudeDelta,
    origin.longitude + longitudeDelta,
    origin.latitude - latitudeDelta
  ].join(",");
}

function extractNominatimPlaces(results, origin, radius) {
  return results
    .map((result) => {
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      const category =
        result.category === "leisure" && result.type === "park"
          ? "park"
          : result.category === "historic" && ["memorial", "monument"].includes(result.type)
            ? result.type
            : result.category === "tourism" && ["artwork", "viewpoint"].includes(result.type)
              ? result.type
              : null;
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !result.name ||
        !category
      ) {
        return null;
      }
      const distance = Math.round(haversineMeters(origin.latitude, origin.longitude, latitude, longitude));
      if (distance < 100 || distance > radius * 1.12) return null;
      return {
        id: `${result.osm_type || "place"}-${result.osm_id || result.place_id}`,
        name: result.name,
        category,
        latitude,
        longitude,
        distance
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchJsonWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`place-service-${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) throw new Error("place-service-invalid-response");
    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("place-service-timeout");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function searchNominatim(origin, radius, query = "[park]") {
  const rateLimitWait = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
  if (rateLimitWait) await new Promise((resolve) => window.setTimeout(resolve, rateLimitWait));
  lastNominatimRequestAt = Date.now();

  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    viewbox: nominatimViewbox(origin, radius),
    bounded: "1",
    limit: "30",
    "accept-language": "ru,en"
  });
  const data = await fetchJsonWithTimeout(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      cache: "no-store",
      headers: { Accept: "application/json" }
    },
    8000
  );
  return extractNominatimPlaces(Array.isArray(data) ? data : [], origin, radius);
}

async function searchOverpass(origin, radius) {
  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const data = await fetchJsonWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
          },
          body: new URLSearchParams({ data: overpassQuery(origin.latitude, origin.longitude, radius) })
        },
        6500
      );
      return extractPlaces(data.elements || [], origin, radius);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("place-service-unavailable");
}

async function searchPublicPlaces(origin, radius) {
  const cacheKey = `${origin.latitude.toFixed(4)}:${origin.longitude.toFixed(4)}:${radius}`;
  if (placeSearchCache.has(cacheKey)) return placeSearchCache.get(cacheKey);

  let nominatimAnswered = false;
  for (const query of ["[park]", "[monument]", "[artwork]"]) {
    try {
      const places = await searchNominatim(origin, radius, query);
      nominatimAnswered = true;
      if (places.length) {
        placeSearchCache.set(cacheKey, places);
        return places;
      }
    } catch {
      break;
    }
  }

  $("#threshold-status").textContent = "ПРОБУЮ РЕЗЕРВНЫЙ КАРТОГРАФИЧЕСКИЙ УЗЕЛ";
  try {
    const places = await searchOverpass(origin, radius);
    if (places.length) placeSearchCache.set(cacheKey, places);
    return places;
  } catch (error) {
    if (nominatimAnswered) return [];
    throw error;
  }
}

function thresholdIsOpen(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 21;
}

function updateThresholdAvailability() {
  const button = $("#find-threshold-button");
  const notice = $("#threshold-availability");
  if (!button || !notice) return;
  const open = thresholdIsOpen();
  notice.classList.toggle("hidden", open);
  notice.textContent = open
    ? ""
    : "Городской слой отдыхает с 21:00 до 07:00. Печать сохранена: утром достаточно вернуться и нажать кнопку.";

  if (!$("#threshold-result").classList.contains("hidden") && !button.classList.contains("hidden")) {
    if (!open) {
      button.disabled = true;
      button.querySelector("span").textContent = "Порог откроется в 07:00";
    } else if (!$("#map-oracle").classList.contains("is-searching")) {
      button.disabled = false;
      if (button.querySelector("span").textContent === "Порог откроется в 07:00") {
        button.querySelector("span").textContent = "Найти безопасный Порог";
      }
    }
  }
}

async function findThreshold() {
  if (!thresholdIsOpen()) {
    updateThresholdAvailability();
    showToast("Городской Порог открывается только с 07:00 до 21:00. Ночью выбирай домашний ритуал.");
    return;
  }

  const button = $("#find-threshold-button");
  const map = $("#map-oracle");
  button.disabled = true;
  button.querySelector("span").textContent = "Слушаю город…";
  map.classList.add("is-searching");
  $("#threshold-status").textContent = "ПОЛУЧАЮ ПУБЛИЧНЫЕ МЕСТА";
  playTone("seal");

  try {
    const position = await getPosition();
    const origin = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    const places = await searchPublicPlaces(origin, currentThreshold.radius);
    if (!places.length) throw new Error("no-public-places");

    const choiceSeed = stringHash(`${currentThreshold.seal}|${places.map((place) => place.id).join(",")}`);
    const place = places[choiceSeed % places.length];
    revealThresholdPlace(place);
  } catch (error) {
    map.classList.remove("is-searching");
    button.disabled = false;
    button.querySelector("span").textContent = "Попробовать ещё раз";
    $("#threshold-status").textContent = "ТОЧКА НЕ РАСКРЫЛАСЬ";
    if (error?.code === 1) {
      showToast("Без доступа к геопозиции MOIRÉ не может выбрать публичное место рядом.");
    } else if (error?.message === "no-public-places") {
      showToast("В этом радиусе не нашлось подходящих публичных мест. Выбери больший радиус.");
    } else if (error?.message === "place-service-timeout") {
      showToast("Картографические узлы не ответили вовремя. Интернет есть, но слой перегружен — попробуй ещё раз.");
    } else {
      showToast("Городской слой сейчас молчит. Проверь интернет и попробуй снова.");
    }
    playTone("miss");
  }
}

function categoryLabel(category) {
  return {
    artwork: "публичный арт-объект",
    viewpoint: "смотровая точка",
    memorial: "мемориал",
    monument: "памятник",
    park: "публичный парк",
    library: "библиотека",
    community_centre: "общественный центр"
  }[category] || "публичное место";
}

function revealThresholdPlace(place) {
  $("#map-oracle").classList.remove("is-searching");
  $("#map-oracle").classList.add("has-point");
  $("#threshold-status").textContent = "ПОРОГ ВЫБРАН ИЗ ПУБЛИЧНЫХ POI";
  $("#place-name").textContent = place.name;
  $("#place-meta").textContent = `${categoryLabel(place.category)} · около ${place.distance} м · данные © участники OpenStreetMap · проверь доступность и маршрут`;
  $("#find-threshold-button").classList.add("hidden");
  const link = $("#open-map-link");
  link.href = `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`;
  link.classList.remove("hidden");

  const entryId = `threshold-${currentThreshold.seal.slice(0, 12)}`;
  if (!state.chronicle.some((entry) => entry.id === entryId)) {
    state.chronicle.unshift({
      id: entryId,
      type: "threshold",
      title: place.name,
      copy: currentThreshold.omen,
      createdAt: new Date().toISOString(),
      outcome: "open"
    });
    saveState();
  }
  playTone("reveal");
  vibrate([22, 50, 22, 50, 35]);
}

function resetThreshold() {
  currentThreshold = { radius: 1200, tone: "quiet", seal: "", omen: "", intention: "" };
  $("#threshold-form").reset();
  $("#intention-count").textContent = "0/64";
  $("#safety-confirm").checked = false;
  $$("#radius-choices .choice-chip").forEach((chip) =>
    chip.classList.toggle("is-selected", chip.dataset.value === "1200")
  );
  $$("#tone-choices .choice-chip").forEach((chip) =>
    chip.classList.toggle("is-selected", chip.dataset.value === "quiet")
  );
  $("#threshold-form").classList.remove("hidden");
  $("#threshold-result").classList.add("hidden");
  $("#map-oracle").classList.remove("is-searching", "has-point");
  $("#find-threshold-button").classList.remove("hidden");
  $("#find-threshold-button").disabled = false;
  $("#find-threshold-button span").textContent = "Найти безопасный Порог";
  $("#open-map-link").classList.add("hidden");
  updateThresholdAvailability();
}

async function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  state.soundPreferenceSet = true;
  saveState();
  updateSoundUI();
  if (state.soundEnabled) {
    await startAmbientSound();
    playTone("reveal");
    showToast("Звук включён. Наушники усиливают эффект.");
  } else {
    stopAmbientSound();
    showToast("Звук выключен.");
  }
}

function updateSoundUI() {
  const button = $("#sound-toggle");
  button.classList.toggle("is-muted", !state.soundEnabled);
  $(".sound-glyph").textContent = state.soundEnabled ? "🔊" : "🔇";
  $(".sound-label").textContent = state.soundEnabled ? "ЗВУК" : "ВЫКЛ";
  button.setAttribute("aria-label", state.soundEnabled ? "Выключить звук" : "Включить звук");
  button.title = state.soundEnabled ? "Звук включён" : "Звук выключен";
}

function detectInstallPrompt() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isiOS && !standalone && !state.installDismissed) {
    setTimeout(() => $("#install-banner").classList.remove("hidden"), 4200);
  }
}

function init() {
  $("#day-label").textContent = localDateLabel().toUpperCase();
  $("#day-phase").textContent = timePhase();
  updateProfileUI();
  updateSoundUI();
  renderExistingDaily();
  renderChronicle();
  updateThresholdAvailability();
  detectInstallPrompt();

  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.target)));
  $$("[data-open]").forEach((button) => button.addEventListener("click", () => openLayer(button.dataset.open)));
  $$("[data-close]").forEach((button) => button.addEventListener("click", () => closeLayer(button)));
  $$(".truth-tag").forEach((tag) => {
    tag.setAttribute("role", "button");
    tag.tabIndex = 0;
    tag.addEventListener("click", () => openLayer("about-modal"));
  });

  $("#profile-button").addEventListener("click", () => openLayer("profile-sheet"));
  $("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const previousProfile = { ...state.profile };
    state.profile = {
      name: $("#name-input").value.trim(),
      birthDate: $("#birth-date-input").value,
      birthTime: $("#birth-time-input").value
    };
    const saved = await saveState();
    updateProfileUI();
    const regenerated = await regenerateTodayForProfile(previousProfile);
    closeLayer($("#profile-sheet"));
    showToast(
      !saved
        ? "Ключ изменён, но iOS не разрешил сохранить его. Освободи место и попробуй снова."
        : regenerated
        ? "Личный ключ изменён: сегодняшний прогноз пересобран, старая петля Эха сброшена."
        : "Личный ключ сохранён только на этом устройстве."
    );
    playTone("select");
  });

  $("#export-backup-button").addEventListener("click", () => {
    exportBackup().catch((error) => {
      showToast(error?.message || "Не удалось создать резервную копию.");
    });
  });
  $("#import-backup-button").addEventListener("click", () => $("#backup-file-input").click());
  $("#backup-file-input").addEventListener("change", async (event) => {
    const input = event.currentTarget;
    try {
      await importBackup(input.files?.[0]);
    } catch (error) {
      showToast(error instanceof SyntaxError ? "Файл резервной копии повреждён." : error?.message || "Не удалось восстановить данные.");
    } finally {
      input.value = "";
    }
  });

  $("#clear-data-button").addEventListener("click", async () => {
    if (!window.confirm("Удалить профиль, прогнозы и всю хронику с этого устройства?")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // IndexedDB cleanup below still removes the protective mirror.
    }
    try {
      await deleteVaultSnapshot();
      storageProtection.mirror = "ready";
    } catch {
      storageProtection.mirror = "unavailable";
    }
    state = structuredClone(defaults);
    storageProtection.localFound = false;
    storageProtection.localCorrupt = false;
    storageProtection.recovered = false;
    stopAmbientSound();
    updateProfileUI();
    updateSoundUI();
    updateReturnCue();
    renderChronicle();
    $("#forecast-section").classList.add("hidden");
    $(".oracle-hero").classList.remove("hidden");
    $("#open-day-button").classList.remove("hidden");
    $("#show-forecast-button").classList.add("hidden");
    $("#hero-copy").textContent =
      "Короткий личный ритуал создаст сегодняшний прогноз. Никакой магии — только психология внимания, символы и честная Хроника совпадений.";
    closeLayer($("#profile-sheet"));
    showToast("Локальные данные удалены. Звук снова включён по умолчанию.");
  });

  $("#open-day-button").addEventListener("click", () => {
    resetRitual();
    openLayer("ritual-modal");
    playTone("tap");
  });
  $("#show-forecast-button").addEventListener("click", () => renderForecast(state.daily[todayKey()]));
  $$(".energy-choices button").forEach((button) => {
    button.addEventListener("click", () => {
      currentRitual.energy = button.dataset.energy;
      playTone("select");
      vibrate(10);
      showRitualStep(2);
    });
  });

  const holdButton = $("#hold-button");
  holdButton.addEventListener("pointerdown", startHold);
  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) =>
    holdButton.addEventListener(eventName, cancelHold)
  );
  $$("#card-choice button").forEach((button) =>
    button.addEventListener("click", () => chooseCard(Number(button.dataset.card)))
  );
  $("#reveal-forecast-button").addEventListener("click", revealForecast);
  $("#resolve-anomaly-button").addEventListener("click", openOutcomeModal);
  $$(".sigil-choices button").forEach((button) =>
    button.addEventListener("click", () => selectDailySigil(button.dataset.sigil))
  );
  $("#reveal-echo-button").addEventListener("click", revealDailyEcho);
  $$(".echo-outcomes button").forEach((button) =>
    button.addEventListener("click", () => closeDailyLoop(button.dataset.echoOutcome))
  );
  $$(".outcome-choices button").forEach((button) =>
    button.addEventListener("click", () => recordOutcome(button.dataset.outcome))
  );

  $("#open-threshold-from-today").addEventListener("click", () => setView("threshold"));
  $("#threshold-form").addEventListener("submit", sealIntention);
  $("#intention-input").addEventListener("input", (event) => {
    $("#intention-count").textContent = `${event.target.value.length}/64`;
  });
  $$("#radius-choices .choice-chip").forEach((button) =>
    button.addEventListener("click", () => selectChip("radius-choices", button))
  );
  $$("#tone-choices .choice-chip").forEach((button) =>
    button.addEventListener("click", () => selectChip("tone-choices", button))
  );
  $("#find-threshold-button").addEventListener("click", findThreshold);
  $("#reset-threshold-button").addEventListener("click", resetThreshold);
  $("#chronicle-start-button").addEventListener("click", () => setView("today"));
  $("#sound-toggle").addEventListener("click", toggleSound);
  document.addEventListener(
    "pointerdown",
    (event) => {
      requestPersistentStorage();
      if (state.soundEnabled && !event.target.closest("#sound-toggle")) startAmbientSound();
    },
    { passive: true, once: true }
  );
  $("#dismiss-install").addEventListener("click", () => {
    state.installDismissed = true;
    saveState();
    $("#install-banner").classList.add("hidden");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const openLayerElement = $(".modal:not(.hidden), .sheet:not(.hidden)");
      if (openLayerElement) closeLayer(openLayerElement);
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
  window.setInterval(updateThresholdAvailability, 60000);

  if (storageProtection.recovered) {
    window.setTimeout(() => {
      showToast("MOIRÉ восстановил данные из защитного зеркала.");
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await restoreStateBeforeInit();
  init();
});
