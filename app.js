const STORAGE_KEY = "moire-oracle-state-v1";
const VAULT_DB_NAME = "moire-oracle-vault";
const VAULT_DB_VERSION = 1;
const VAULT_STORE_NAME = "snapshots";
const VAULT_RECORD_KEY = "latest";
const BACKUP_FORMAT = "moire-oracle-backup";
const BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const HOLD_DURATION = 1800;
const THRESHOLD_VERSION = 2;
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
  notificationsEnabled: true,
  notificationPreferenceSet: false,
  installDismissed: false,
  daily: {},
  chronicle: [],
  activeThreshold: null,
  reality: {
    lastSeenAt: null,
    visits: 0,
    lastSignalId: "",
    notificationKeys: []
  }
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

const ECHO_DELAY_MS = 3 * 60 * 1000;
const sigilMeta = {
  circle: { symbol: "◯", label: "Круг" },
  rift: { symbol: "⌁", label: "Разлом" },
  three: { symbol: "∴", label: "Три точки" }
};
const missionBank = {
  circle: [
    "В следующие 3 минуты поймай одно повторение: слово, жест или форму. Не ищи специально — отметь первое.",
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
const thresholdAntiSigns = [
  "если место требует нарушить границу — это не твой Порог",
  "если путь кажется небезопасным — остановись, и промах будет честным исходом",
  "если знак приходится выдумывать — отметь «мимо» без объяснения",
  "если вход закрыт — наблюдай с публичной стороны или выбери домашний контур",
  "если тело говорит «нет» — это важнее любой печати"
];
const homeThresholdBank = {
  quiet: [
    "Останься там, где безопасно, и найди самую тихую границу света.",
    "Выбери знакомый предмет и посмотри на него с уровня пола.",
    "Открой окно или подойди к нему: отметь первый далёкий звук."
  ],
  strange: [
    "Найди в комнате форму, похожую на карту места, которого нет.",
    "Посмотри на отражение под непривычным углом и найди отсутствующую деталь.",
    "Выбери третий предмет слева и придумай ему одно невозможное назначение."
  ],
  warm: [
    "Найди след чьей-то заботы, который обычно остаётся незамеченным.",
    "Выбери предмет, связанный с хорошим человеком, и вспомни одну точную деталь.",
    "Сделай маленькое безопасное улучшение пространства и заметь, что изменилось."
  ]
};

const realityVoiceBank = {
  first: [
    "Ты открыл канал. Теперь день знает, куда вернуть ответ.",
    "Экран проснулся раньше вопроса. Не спеши объяснять это.",
    "Контур активен. Первая случайность уже не будет совсем случайной."
  ],
  return: [
    ({ minutes }) => `Тебя не было ${minutes} мин. Контур не исчез — он только перестал шуметь.`,
    ({ minutes }) => `${minutes} мин вне экрана. Что изменилось первым, когда ты вернулся?`,
    ({ minutes }) => `За ${minutes} мин реальность успела продолжиться без MOIRÉ. Сверь первую деталь.`
  ],
  echoWaiting: [
    ({ remaining }) => `До Эха ${remaining}. Не смотри на таймер — смотри, что повторится.`,
    ({ remaining }) => `Сигнал запечатан ещё на ${remaining}. Окружение уже участвует.`,
    ({ remaining }) => `${remaining} до второго сигнала. Первая замеченная странность считается.`
  ],
  echoReady: [
    "Три минуты прошли. Эхо больше не запечатано.",
    "Второй сигнал созрел именно пока ты смотрел в другую сторону.",
    "Пауза закончилась. Теперь реальность должна ответить первой."
  ],
  route: [
    ({ place }) => `Карта знает дорогу к «${place}». Печать уже не изменится.`,
    ({ place }) => `«${place}» существовало до запроса. Теперь между вами есть маршрут.`,
    ({ place }) => `Точка передана карте: ${place}. Вернись после прибытия — не раньше.`
  ],
  routeReturn: [
    ({ place }) => `Ты вернулся из карты. «${place}» всё ещё ждёт сверки.`,
    ({ place }) => `Маршрут закрылся, но точка осталась: ${place}.`,
    ({ place }) => `Карта отдала тебя обратно MOIRÉ. Следующий жест — «Я у Порога».`
  ],
  thresholdReady: [
    ({ place, distance }) => `Город ответил: «${place}», около ${distance} м по прямой.`,
    ({ place }) => `Из всех доступных точек печать удержала одну: ${place}.`,
    ({ place }) => `Место раскрыто — ${place}. Три знака были выбраны раньше него.`
  ],
  arrived: [
    "Геопозиция совпала с контуром. Теперь телефон больше ничего не решает.",
    "Ты внутри радиуса. Смотри не на экран, а на первую лишнюю деталь.",
    "Порог признал прибытие. Осталась только честная сверка."
  ],
  completed: [
    ({ fragment }) => `${fragment} сохранён. Завтрашний день уже получил этот след.`,
    ({ fragment }) => `Реальность ответила фрагментом ${fragment}. Он появится в следующей печати.`,
    ({ fragment }) => `${fragment}: совпадение больше нельзя переписать задним числом.`
  ],
  online: [
    "Городской слой снова на линии. Незавершённая точка сохранилась.",
    "Связь вернулась. Печать не менялась, пока сеть молчала."
  ],
  offline: [
    "Сеть исчезла. Личный контур и Хроника остались на устройстве.",
    "Городской слой замолчал. Домашний Порог всё ещё доступен."
  ],
  quiet: [
    "Сейчас ничего не требуется. Заметь, какую деталь ты выбрал сам.",
    "Если знак приходится искать слишком долго, это уже не знак.",
    "Пауза тоже часть ответа. Не заполняй её первым объяснением.",
    "Время на экране и время вокруг тебя идут немного разными путями.",
    "Первое совпадение притягивает внимание. Первый промах сохраняет честность."
  ]
};

const initialLocalState = readLocalState();
let state = initialLocalState.state;
let currentRitual = { energy: "", card: null, holdMs: 0, seal: "", forecast: null };
let currentThreshold = state.activeThreshold
  ? structuredClone(state.activeThreshold)
  : createThresholdState();
let holdTimer = null;
let holdStartedAt = 0;
let holdFrame = null;
let activeLoopKey = null;
let toastTimer = null;
let audioContext = null;
let ambientNodes = [];
let echoTimer = null;
let ambientStarted = false;
let ambientStarting = false;
let vaultWriteQueue = Promise.resolve(true);
let persistenceRequested = false;
let notificationTimers = [];
let notificationDeliveriesInFlight = new Set();
let realityTimer = null;
let hiddenAt = null;
let serviceWorkerRegistration = null;
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

function createThresholdState() {
  return {
    version: THRESHOLD_VERSION,
    id: "",
    status: "draft",
    radius: 1200,
    tone: "quiet",
    seal: "",
    signs: [],
    antiSign: "",
    intention: "",
    createdAt: null,
    place: null,
    arrivedAt: null,
    completedAt: null,
    outcome: null,
    note: "",
    fragmentId: "",
    navigationStartedAt: null,
    navigationProvider: "",
    reminderAt: null,
    reminderNotifiedAt: null
  };
}

function normalizeThreshold(saved) {
  if (!isPlainObject(saved) || typeof saved.seal !== "string" || !saved.seal) return null;
  const base = createThresholdState();
  const place = isPlainObject(saved.place)
    ? {
        id: typeof saved.place.id === "string" ? saved.place.id : "",
        name: typeof saved.place.name === "string" ? saved.place.name.slice(0, 160) : "",
        category: typeof saved.place.category === "string" ? saved.place.category : "place",
        latitude:
          saved.place.latitude !== null && Number.isFinite(Number(saved.place.latitude))
            ? Number(saved.place.latitude)
            : null,
        longitude:
          saved.place.longitude !== null && Number.isFinite(Number(saved.place.longitude))
            ? Number(saved.place.longitude)
            : null,
        distance: Number.isFinite(Number(saved.place.distance)) ? Math.max(0, Number(saved.place.distance)) : 0,
        home: saved.place.home === true
      }
    : null;

  return {
    ...base,
    version: Number(saved.version) || THRESHOLD_VERSION,
    id: typeof saved.id === "string" ? saved.id : `threshold-${saved.seal.slice(0, 12)}`,
    status: ["sealed", "revealed", "arrived", "completed"].includes(saved.status)
      ? saved.status
      : place
        ? "revealed"
        : "sealed",
    radius: [500, 1200, 2500].includes(Number(saved.radius)) ? Number(saved.radius) : 1200,
    tone: ["quiet", "strange", "warm"].includes(saved.tone) ? saved.tone : "quiet",
    seal: saved.seal,
    signs: Array.isArray(saved.signs)
      ? saved.signs.filter((item) => typeof item === "string").slice(0, 3)
      : typeof saved.omen === "string"
        ? [saved.omen]
        : [],
    antiSign: typeof saved.antiSign === "string" ? saved.antiSign : "",
    intention: typeof saved.intention === "string" ? saved.intention.slice(0, 64) : "",
    createdAt: typeof saved.createdAt === "string" ? saved.createdAt : null,
    place,
    arrivedAt: typeof saved.arrivedAt === "string" ? saved.arrivedAt : null,
    completedAt: typeof saved.completedAt === "string" ? saved.completedAt : null,
    outcome: ["exact", "near", "miss"].includes(saved.outcome) ? saved.outcome : null,
    note: typeof saved.note === "string" ? saved.note.slice(0, 160) : "",
    fragmentId: typeof saved.fragmentId === "string" ? saved.fragmentId : "",
    navigationStartedAt: typeof saved.navigationStartedAt === "string" ? saved.navigationStartedAt : null,
    navigationProvider: ["apple", "google", "osm"].includes(saved.navigationProvider)
      ? saved.navigationProvider
      : "",
    reminderAt: Number.isFinite(Number(saved.reminderAt)) ? Number(saved.reminderAt) : null,
    reminderNotifiedAt:
      typeof saved.reminderNotifiedAt === "string" ? saved.reminderNotifiedAt : null
  };
}

function normalizeState(saved) {
  const source = isPlainObject(saved) ? saved : {};
  const sourceProfile = isPlainObject(source.profile) ? source.profile : {};
  const sourceReality = isPlainObject(source.reality) ? source.reality : {};
  const hasSoundPreference = source.soundPreferenceSet === true;
  const hasNotificationPreference = source.notificationPreferenceSet === true;

  return {
    profile: {
      name: typeof sourceProfile.name === "string" ? sourceProfile.name.slice(0, 24) : "",
      birthDate: typeof sourceProfile.birthDate === "string" ? sourceProfile.birthDate : "",
      birthTime: typeof sourceProfile.birthTime === "string" ? sourceProfile.birthTime : ""
    },
    soundEnabled: hasSoundPreference ? source.soundEnabled !== false : true,
    soundPreferenceSet: hasSoundPreference,
    notificationsEnabled: hasNotificationPreference ? source.notificationsEnabled !== false : true,
    notificationPreferenceSet: hasNotificationPreference,
    installDismissed: source.installDismissed === true,
    daily: isPlainObject(source.daily) ? source.daily : {},
    chronicle: Array.isArray(source.chronicle) ? source.chronicle : [],
    activeThreshold: normalizeThreshold(source.activeThreshold),
    reality: {
      lastSeenAt: typeof sourceReality.lastSeenAt === "string" ? sourceReality.lastSeenAt : null,
      visits: Number.isFinite(Number(sourceReality.visits))
        ? Math.max(0, Math.floor(Number(sourceReality.visits)))
        : 0,
      lastSignalId: typeof sourceReality.lastSignalId === "string" ? sourceReality.lastSignalId : "",
      notificationKeys: Array.isArray(sourceReality.notificationKeys)
        ? sourceReality.notificationKeys.filter((item) => typeof item === "string").slice(-30)
        : []
    }
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

async function deleteAppCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys.filter((key) => key.startsWith("moire-oracle-")).map((key) => caches.delete(key))
  );
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

function localDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }).format(date);
}

function todayKey() {
  return localDayKey(new Date());
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
    arrival: [392, 0.8, "sine", 0.055],
    fragment: [523.25, 1.45, "sine", 0.075],
    miss: [146.83, 0.35, "triangle", 0.025]
  };
  const [frequency, duration, type, volume] = notes[kind] || notes.tap;

  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (kind === "reveal") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);
  if (kind === "arrival") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + duration);
  if (kind === "fragment") oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration);
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
  ambient.volume = 0.5;
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

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function notificationCapability() {
  return (
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "ServiceWorkerRegistration" in window &&
    "showNotification" in ServiceWorkerRegistration.prototype
  );
}

function formatSignalTime(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatCompactDuration(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function emitRealitySignal(kind, payload = {}, options = {}) {
  const bank = realityVoiceBank[kind] || realityVoiceBank.quiet;
  if (!bank.length) return "";
  const seed = stringHash(
    [
      todayKey(),
      kind,
      state.reality.visits,
      state.reality.lastSignalId,
      payload.place || "",
      payload.fragment || "",
      Math.floor(Date.now() / (options.stableForMs || 60000))
    ].join("|")
  );
  let index = seed % bank.length;
  let signalId = `${kind}-${index}`;
  if (signalId === state.reality.lastSignalId && bank.length > 1) {
    index = (index + 1) % bank.length;
    signalId = `${kind}-${index}`;
  }
  const source = bank[index];
  const copy = typeof source === "function" ? source(payload) : source;
  const wire = $("#reality-wire");
  if (!wire) return copy;

  $("#reality-wire-copy").textContent = copy;
  $("#reality-wire-meta").textContent = `${options.label || "ЖИВОЙ СИГНАЛ"} · ${formatSignalTime()}`;
  wire.classList.toggle("has-arrival", options.priority === "high");
  wire.animate?.(
    [
      { opacity: 0.58, transform: "translateY(-2px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 430, easing: "ease-out" }
  );
  state.reality.lastSignalId = signalId;
  if (options.sound && state.soundEnabled) playTone(options.sound);
  if (options.vibrate) vibrate(options.vibrate);
  return copy;
}

function updateRealityFromCurrentState() {
  const returnRecord = forecastForReturn();
  const loop = returnRecord?.forecast?.loop;
  if (loop && !loop.closedAt && (loop.revealedAt || Date.now() >= loop.unlockAt)) {
    emitRealitySignal("echoReady", {}, { label: "ЭХО СОЗРЕЛО", priority: "high" });
    return;
  }
  if (loop && !loop.closedAt) {
    emitRealitySignal(
      "echoWaiting",
      { remaining: formatCompactDuration(loop.unlockAt - Date.now()) },
      { label: "КОНТРАКТ ВНИМАНИЯ", stableForMs: 15000 }
    );
    return;
  }
  if (currentThreshold.status === "revealed" && currentThreshold.place && !currentThreshold.place.home) {
    emitRealitySignal(
      currentThreshold.navigationStartedAt ? "routeReturn" : "thresholdReady",
      {
        place: currentThreshold.place.name,
        distance: currentThreshold.place.distance
      },
      { label: "ПОРОГ ЖДЁТ", priority: "high" }
    );
    return;
  }
  emitRealitySignal("quiet", {}, { label: "РЕАЛЬНОСТЬ НА ЛИНИИ", stableForMs: 90000 });
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  if (serviceWorkerRegistration) return serviceWorkerRegistration;
  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register("./sw.js");
    await navigator.serviceWorker.ready;
    return serviceWorkerRegistration;
  } catch {
    return null;
  }
}

async function updateAppBadge() {
  if (!("setAppBadge" in navigator)) return;
  const readyEchoes = Object.values(state.daily).filter((forecast) => {
    const loop = forecast?.loop;
    return loop && !loop.closedAt && Date.now() >= loop.unlockAt;
  }).length;
  const waitingThreshold =
    currentThreshold.status === "revealed" && currentThreshold.place && !currentThreshold.place.home
      ? 1
      : 0;
  const count = readyEchoes + waitingThreshold;
  try {
    if (count) await navigator.setAppBadge(count);
    else await navigator.clearAppBadge?.();
  } catch {
    // Badging is optional and controlled by the operating system.
  }
}

function updateNotificationUI() {
  const supported = notificationCapability();
  const permission = supported ? Notification.permission : "unsupported";
  const needsInstall = isIOSDevice() && !isStandaloneMode();
  const live = supported && permission === "granted" && state.notificationsEnabled;
  const topButton = $("#signal-toggle");
  const card = $(".signal-permission-card");
  const enableButton = $("#enable-notifications-button");
  const testButton = $("#test-notification-button");
  if (!topButton || !card || !enableButton || !testButton) return;

  topButton.classList.toggle("is-live", live);
  topButton.setAttribute(
    "aria-label",
    live ? "Уведомления включены — открыть настройки" : "Настроить уведомления"
  );
  card.classList.toggle("is-live", live);
  testButton.classList.toggle("hidden", !live);
  enableButton.classList.toggle("hidden", live);

  if (!supported) {
    $("#notification-status-kicker").textContent = "КАНАЛ НЕДОСТУПЕН";
    $("#notification-status-title").textContent = "Этот браузер не поддерживает сигналы";
    $("#notification-status-copy").textContent =
      "Живые обращения останутся внутри MOIRÉ, но системных баннеров здесь не будет.";
    enableButton.classList.add("hidden");
  } else if (needsInstall) {
    $("#notification-status-kicker").textContent = "НУЖНА ИКОНКА «ДОМОЙ»";
    $("#notification-status-title").textContent = "Сначала установи MOIRÉ";
    $("#notification-status-copy").textContent =
      "На iPhone уведомления доступны только приложению, запущенному с экрана «Домой».";
    enableButton.querySelector("span").textContent = "Показать установку";
  } else if (permission === "denied") {
    $("#notification-status-kicker").textContent = "КАНАЛ ЗАБЛОКИРОВАН";
    $("#notification-status-title").textContent = isIOSDevice()
      ? "iPhone не пропускает сигналы"
      : "Браузер не пропускает сигналы";
    $("#notification-status-copy").textContent =
      isIOSDevice()
        ? "Открой «Настройки» → «Уведомления» → MOIRÉ и разреши баннеры и звук."
        : "Разреши уведомления для этого сайта в настройках браузера.";
    enableButton.classList.add("hidden");
  } else if (live) {
    $("#notification-status-kicker").textContent = "КАНАЛ ОТКРЫТ";
    $("#notification-status-title").textContent = "Реальность может заговорить первой";
    $("#notification-status-copy").textContent =
      "Эхо и незавершённый Порог получили право подать системный сигнал.";
  } else {
    $("#notification-status-kicker").textContent = "КАНАЛ ГОТОВ";
    $("#notification-status-title").textContent = "Осталось одно разрешение";
    $("#notification-status-copy").textContent =
      "iPhone сам спросит, можно ли MOIRÉ показывать уведомления.";
    enableButton.querySelector("span").textContent = "Разрешить сигналы";
  }

  $("#notification-footnote").textContent =
    "Разрешение контролирует iPhone. Мгновенные сигналы уже работают; доставка после полного закрытия требует активного фонового push-канала.";
}

async function showSystemNotification(key, title, body, options = {}) {
  const deliveryKey = key || options.tag || "moire-signal";
  if (
    !notificationCapability() ||
    Notification.permission !== "granted" ||
    !state.notificationsEnabled ||
    (key && state.reality.notificationKeys.includes(key)) ||
    notificationDeliveriesInFlight.has(deliveryKey)
  ) {
    return false;
  }
  notificationDeliveriesInFlight.add(deliveryKey);
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    notificationDeliveriesInFlight.delete(deliveryKey);
    return false;
  }
  try {
    await registration.showNotification(title, {
      body,
      icon: "./assets/icon-192.png",
      badge: "./assets/icon-192.png",
      tag: options.tag || key || "moire-signal",
      renotify: options.renotify !== false,
      silent: false,
      data: {
        url: options.url || "./",
        signal: options.signal || "reality"
      }
    });
    if (key) {
      state.reality.notificationKeys = [...state.reality.notificationKeys, key].slice(-30);
      await saveState();
    }
    await updateAppBadge();
    return true;
  } catch {
    return false;
  } finally {
    notificationDeliveriesInFlight.delete(deliveryKey);
  }
}

async function enableNotifications() {
  if (!notificationCapability()) {
    showToast("Этот браузер не поддерживает системные уведомления.");
    return;
  }
  if (isIOSDevice() && !isStandaloneMode()) {
    $("#install-banner").classList.remove("hidden");
    closeLayer($("#signals-sheet"));
    showToast("Сначала: Safari → Поделиться → На экран «Домой».");
    return;
  }

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  state.notificationPreferenceSet = true;
  state.notificationsEnabled = permission === "granted";
  await saveState();
  updateNotificationUI();

  if (permission === "granted") {
    emitRealitySignal("first", {}, {
      label: "КАНАЛ ОТКРЫТ",
      priority: "high",
      sound: "reveal",
      vibrate: [18, 45, 26]
    });
    await showSystemNotification(
      `permission-${Date.now()}`,
      "MOIRÉ · канал открыт",
      "Первый сигнал принят. Следующий появится не по твоему касанию.",
      { tag: "moire-permission", signal: "permission" }
    );
    armPendingNotifications();
  } else if (permission === "denied") {
    showToast("iPhone заблокировал канал. Его можно включить в настройках уведомлений.");
  }
}

async function sendTestNotification() {
  const delivered = await showSystemNotification(
    `test-${Date.now()}`,
    "MOIRÉ · реальность на линии",
    "Это пробный сигнал. Следующий будет связан с твоим Эхом или Порогом.",
    { tag: `moire-test-${Date.now()}`, signal: "test" }
  );
  showToast(delivered ? "Пробный сигнал передан iPhone." : "iPhone не принял пробный сигнал.");
}

function clearNotificationTimers() {
  notificationTimers.forEach((timer) => window.clearTimeout(timer));
  notificationTimers = [];
}

async function notifyEchoReady(key, forecast) {
  const loop = forecast?.loop;
  if (!loop || loop.closedAt || loop.echoNotifiedAt) return;
  const shouldEmitLiveSignal = !loop.echoLiveSignaledAt;
  if (shouldEmitLiveSignal) loop.echoLiveSignaledAt = new Date().toISOString();
  const delivered = await showSystemNotification(
    `echo-${key}-${loop.fragmentId}`,
    "MOIRÉ · Эхо созрело",
    "Три минуты прошли. Второй сигнал больше не запечатан.",
    { tag: `moire-echo-${key}`, signal: "echo", url: `./?signal=echo&day=${encodeURIComponent(key)}` }
  );
  if (delivered) {
    loop.echoNotifiedAt = new Date().toISOString();
  }
  if (delivered || shouldEmitLiveSignal) await saveState();
  if (shouldEmitLiveSignal) {
    emitRealitySignal("echoReady", {}, {
      label: "ЭХО СОЗРЕЛО",
      priority: "high",
      sound: document.hidden ? null : "reveal"
    });
  }
  updateReturnCue();
}

async function notifyThresholdWaiting() {
  if (
    currentThreshold.status !== "revealed" ||
    !currentThreshold.place ||
    currentThreshold.place.home ||
    currentThreshold.reminderNotifiedAt
  ) {
    return;
  }
  const delivered = await showSystemNotification(
    `threshold-${currentThreshold.id}-waiting`,
    "MOIRÉ · Порог всё ещё открыт",
    `${currentThreshold.place.name} сохранилось в печати. Маршрут не изменился.`,
    { tag: `moire-threshold-${currentThreshold.id}`, signal: "threshold", url: "./?signal=threshold" }
  );
  if (delivered) {
    currentThreshold.reminderNotifiedAt = new Date().toISOString();
    await persistActiveThreshold();
  }
}

function armPendingNotifications() {
  clearNotificationTimers();
  Object.entries(state.daily).forEach(([key, forecast]) => {
    const loop = forecast?.loop;
    if (!loop || loop.closedAt || loop.echoNotifiedAt) return;
    const wait = Math.max(0, loop.unlockAt - Date.now());
    const timer = window.setTimeout(() => notifyEchoReady(key, forecast), Math.min(wait, 2147483000));
    notificationTimers.push(timer);
  });

  if (
    currentThreshold.status === "revealed" &&
    currentThreshold.place &&
    !currentThreshold.place.home &&
    currentThreshold.reminderAt &&
    !currentThreshold.reminderNotifiedAt
  ) {
    const wait = Math.max(0, currentThreshold.reminderAt - Date.now());
    const timer = window.setTimeout(notifyThresholdWaiting, Math.min(wait, 2147483000));
    notificationTimers.push(timer);
  }
  updateAppBadge();
}

async function trackRouteOpen(provider) {
  if (!currentThreshold.place || currentThreshold.place.home) return;
  currentThreshold.navigationStartedAt = new Date().toISOString();
  currentThreshold.navigationProvider = provider;
  currentThreshold.reminderAt ||= Date.now() + 12 * 60 * 1000;
  await persistActiveThreshold();
  emitRealitySignal(
    "route",
    { place: currentThreshold.place.name },
    { label: "МАРШРУТ ОТКРЫТ", priority: "high", sound: "select" }
  );
  armPendingNotifications();
}

function handleVisibilityReturn() {
  if (document.hidden) {
    hiddenAt = Date.now();
    state.reality.lastSeenAt = new Date().toISOString();
    return;
  }
  const awayMilliseconds = hiddenAt ? Date.now() - hiddenAt : 0;
  hiddenAt = null;
  state.reality.lastSeenAt = new Date().toISOString();
  state.reality.visits += 1;

  const returnRecord = forecastForReturn();
  const loop = returnRecord?.forecast?.loop;
  if (loop && !loop.closedAt && Date.now() >= loop.unlockAt) {
    notifyEchoReady(returnRecord.key, returnRecord.forecast);
  } else if (
    currentThreshold.status === "revealed" &&
    currentThreshold.navigationStartedAt &&
    currentThreshold.place &&
    !currentThreshold.place.home
  ) {
    emitRealitySignal(
      "routeReturn",
      { place: currentThreshold.place.name },
      { label: "ТЫ ВЕРНУЛСЯ", priority: "high", sound: "tap" }
    );
  } else if (awayMilliseconds >= 2 * 60 * 1000) {
    emitRealitySignal(
      "return",
      { minutes: Math.max(2, Math.round(awayMilliseconds / 60000)) },
      { label: "ВОЗВРАЩЕНИЕ", priority: "high" }
    );
  } else {
    updateRealityFromCurrentState();
  }
  saveState();
  armPendingNotifications();
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
  clearTimeout(holdTimer);
  cancelAnimationFrame(holdFrame);
  holdStartedAt = 0;
  currentRitual = { energy: "", card: null, holdMs: 0, seal: "", forecast: null };
  $("#hold-button").className = "hold-button";
  $("#hold-button").style.removeProperty("--hold-progress");
  $("#hold-hint").textContent = "1,8 секунды";
  showRitualStep(1);
}

function startHold(event) {
  event.preventDefault();
  const button = $("#hold-button");
  if (holdStartedAt || button.classList.contains("is-complete")) return;
  clearTimeout(holdTimer);
  cancelAnimationFrame(holdFrame);
  currentRitual.holdMs = 0;
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
    if (!holdStartedAt) return;
    currentRitual.holdMs = Math.round(performance.now() - holdStartedAt);
    holdStartedAt = 0;
    cancelAnimationFrame(holdFrame);
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
  currentRitual.holdMs = 0;
  const button = $("#hold-button");
  button.classList.remove("is-holding");
  button.style.removeProperty("--hold-progress");
  $("#hold-hint").textContent = "круг изменился — попробуй ещё";
  holdStartedAt = 0;
  playTone("miss");
}

function completeHoldAccessibly() {
  const button = $("#hold-button");
  if (button.classList.contains("is-complete")) return;
  clearTimeout(holdTimer);
  cancelAnimationFrame(holdFrame);
  holdStartedAt = 0;
  currentRitual.holdMs = HOLD_DURATION;
  button.classList.remove("is-holding");
  button.classList.add("is-complete");
  button.style.setProperty("--hold-progress", "360deg");
  $("#hold-hint").textContent = "печать замкнулась";
  playTone("select");
  setTimeout(() => showRitualStep(3), 300);
}

function personalKeyMaterial(profile = state.profile) {
  return [
    profile.name.trim().toLocaleLowerCase("ru-RU") || "anonymous",
    profile.birthDate || "no-birth-date",
    profile.birthTime || "no-birth-time",
    timePhase()
  ].join("|");
}

function latestCompletedThreshold() {
  return state.chronicle.find(
    (entry) =>
      entry.type === "threshold" &&
      ["exact", "near", "miss"].includes(entry.outcome) &&
      entry.expedition?.fragmentId
  ) || null;
}

function ritualSealMaterial({ energy, holdMs, card }, profile = state.profile) {
  const trace = latestCompletedThreshold();
  return [
    todayKey(),
    personalKeyMaterial(profile),
    energy,
    holdMs,
    card,
    trace?.expedition?.fragmentId || "no-threshold-fragment",
    trace?.outcome || "no-threshold-outcome",
    trace?.copy || "no-threshold-note"
  ].join("|");
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
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let startMinutes = nowMinutes + 35 + Math.floor(random() * 85);
  let dayPrefix = "";
  if (startMinutes > 21 * 60 + 30) {
    startMinutes = 8 * 60 + Math.floor(random() * 95);
    dayPrefix = "ЗАВТРА · ";
  }
  const endMinutes = startMinutes + 55 + Math.floor(random() * 36);
  const formatMinutes = (value) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  return {
    title: pick(forecastBank.titles, random),
    gravity: pick(forecastBank.gravity, random),
    gravityWindow: `СИЛЬНОЕ ОКНО · ${dayPrefix}${formatMinutes(startMinutes)}—${formatMinutes(endMinutes)}`,
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
  const memory = latestCompletedThreshold();
  $("#memory-card").classList.toggle("hidden", !memory);
  if (memory) {
    $("#memory-fragment").textContent = memory.expedition.fragmentId;
    $("#memory-copy").textContent = memory.copy
      ? `Твоя деталь «${memory.copy}» стала частью этой печати.`
      : "Исход прошлой экспедиции стал частью этой печати.";
  }
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

function pendingEchoRecord() {
  return Object.entries(state.daily)
    .filter(([, forecast]) => forecast?.loop && !forecast.loop.closedAt)
    .sort((a, b) => String(a[1].loop.startedAt).localeCompare(String(b[1].loop.startedAt)))[0] || null;
}

function forecastForReturn() {
  const pending = pendingEchoRecord();
  if (pending && (pending[0] !== todayKey() || !state.daily[todayKey()])) {
    return { key: pending[0], forecast: pending[1] };
  }
  const today = state.daily[todayKey()];
  return today ? { key: todayKey(), forecast: today } : pending ? { key: pending[0], forecast: pending[1] } : null;
}

function updateReturnCue() {
  const record = pendingEchoRecord();
  const loop = record?.[1]?.loop;
  const needsReturn = Boolean(loop && !loop.closedAt && (loop.revealedAt || Date.now() >= loop.unlockAt));
  $("#echo-nav-alert").classList.toggle("hidden", !needsReturn);
  $("#today-nav-label").textContent = needsReturn ? "Эхо" : "Сегодня";
}

function renderExistingDaily() {
  const todayForecast = state.daily[todayKey()];
  const returnRecord = forecastForReturn();
  const forecast = returnRecord?.forecast || todayForecast;
  updateReturnCue();
  if (!forecast) {
    $("#open-day-button").classList.remove("hidden");
    $("#show-forecast-button").classList.add("hidden");
    $("#personal-greeting").textContent = state.profile.name
      ? `${state.profile.name.toUpperCase()}, НОВЫЙ ДЕНЬ ЕЩЁ НЕ ОТКРЫТ`
      : "ТВОЙ ДЕНЬ ЕЩЁ НЕ ОТКРЫТ";
    $("#hero-copy").textContent =
      "Дай системе три сигнала. Новый прогноз свяжется с сохранёнными фрагментами.";
    return;
  }
  $("#open-day-button").classList.add("hidden");
  $("#show-forecast-button").classList.remove("hidden");
  $("#personal-greeting").textContent = state.profile.name
    ? `${state.profile.name.toUpperCase()}, ДЕНЬ УЖЕ ЗАПЕЧАТАН`
    : "ДЕНЬ УЖЕ ЗАПЕЧАТАН";
  const loop = forecast.loop;
  const isOlderLoop = Boolean(returnRecord && returnRecord.key !== todayKey());
  if (isOlderLoop) {
    $("#personal-greeting").textContent = "НЕЗАКРЫТОЕ ЭХО ВЕРНУЛОСЬ";
  }
  if (loop?.closedAt) {
    $("#hero-copy").textContent = `Петля замкнута. Фрагмент ${loop.fragmentId} уже лежит в Хронике.`;
    $("#show-forecast-button").textContent = "Вернуться к печати";
  } else if (loop && Date.now() >= loop.unlockAt) {
    $("#hero-copy").textContent = isOlderLoop
      ? "Эхо пережило полночь и ждёт честного исхода. Закрой его — затем открой новый день."
      : "Запечатанное Эхо созрело. Оно не откроется без твоего возвращения.";
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
  activeLoopKey =
    Object.entries(state.daily).find(([, candidate]) => candidate === forecast)?.[0] || todayKey();
  updateReturnCue();
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
    const previousId = previous?.title.match(/Φ-[A-Z0-9]{3,8}/u)?.[0];
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
      notifyEchoReady(activeLoopKey || todayKey(), forecast);
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
  const fragmentId = `Φ-${stringHash(`${forecast.seal}|${sigil}|fragment-v2`)
    .toString(16)
    .padStart(8, "0")
    .slice(0, 6)
    .toUpperCase()}`;
  const previous = previousEchoEntry();
  const baseFragmentCopy = pick(fragmentCopyBank, random);
  forecast.loop = {
    sigil,
    mission: pick(missionBank[sigil], random),
    echo: pick(echoBank, random),
    parentFragmentId: previous?.title.match(/Φ-[A-Z0-9]{3,8}/u)?.[0] || null,
    startedAt: new Date().toISOString(),
    unlockAt: Date.now() + ECHO_DELAY_MS,
    revealedAt: null,
    closedAt: null,
    outcome: null,
    fragmentId,
    rarityLabel,
    fragmentCopy: previous
      ? `${baseFragmentCopy} Связь с ${previous.title.match(/Φ-[A-Z0-9]{3,8}/u)?.[0] || "прошлым фрагментом"} сохранена.`
      : baseFragmentCopy
  };
  saveState();
  renderDailyLoop(forecast);
  renderExistingDaily();
  emitRealitySignal(
    "echoWaiting",
    { remaining: "3:00" },
    { label: "КОНТРАКТ ПРИНЯТ", priority: "high" }
  );
  armPendingNotifications();
  playTone("seal");
  vibrate([15, 35, 18]);
  showToast("Контракт принят. Первое Эхо созреет через 3 минуты — возвращение завершит цепь.");
}

function revealDailyEcho() {
  const record = activeLoopKey && state.daily[activeLoopKey]
    ? { key: activeLoopKey, forecast: state.daily[activeLoopKey] }
    : forecastForReturn();
  const forecast = record?.forecast;
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
  emitRealitySignal("echoReady", {}, {
    label: "ВТОРОЙ СИГНАЛ",
    priority: "high"
  });
  updateAppBadge();
  playTone("reveal");
  vibrate([20, 45, 30]);
}

function closeDailyLoop(outcome) {
  const key = activeLoopKey && state.daily[activeLoopKey] ? activeLoopKey : forecastForReturn()?.key;
  if (!key) return;
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
  emitRealitySignal(
    "completed",
    { fragment: loop.fragmentId },
    { label: "ПЕТЛЯ ЗАМКНУТА", priority: "high" }
  );
  updateAppBadge();
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
  const thresholdCount = completedThresholdCount();
  const constellationPosition = thresholdCount % 7 || (thresholdCount ? 7 : 0);
  $("#chronicle-constellation-count").textContent = `${constellationPosition}/7`;
  const nodes = $("#constellation-nodes");
  nodes.innerHTML = "";
  for (let index = 0; index < 7; index += 1) {
    const node = document.createElement("span");
    node.classList.toggle("is-lit", index < constellationPosition);
    nodes.append(node);
  }
  $("#constellation-copy").textContent =
    thresholdCount === 0
      ? "Первый завершённый Порог зажжёт точку."
      : constellationPosition === 7
        ? "Созвездие замкнуто. Следующий Порог начнёт новую фигуру."
        : `Ещё ${7 - constellationPosition} до завершения этой фигуры.`;
  const list = $("#chronicle-list");
  list.innerHTML = "";

  const outcomeLabels = { exact: "ТОЧНО", near: "ПОЧТИ", miss: "НЕТ", open: "ОТКРЫТО" };
  const typeLabels = { threshold: "Порог", echo: "Эхо", daily: "Затмение" };
  const typeSymbols = { threshold: "⌖", echo: "∴", daily: "✦" };
  entries.slice(0, 100).forEach((entry) => {
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
  const days = [
    ...new Set(
      entries
        .map((entry) => {
          const date = new Date(entry.createdAt);
          return Number.isNaN(date.getTime()) ? null : localDayKey(date);
        })
        .filter(Boolean)
    )
  ].sort().reverse();
  if (!days.length) return 0;
  const dayOrdinal = (key) => {
    const [year, month, day] = key.split("-").map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  };
  const latestGap = dayOrdinal(todayKey()) - dayOrdinal(days[0]);
  if (latestGap > 1) return 0;
  let streak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (dayOrdinal(days[index - 1]) - dayOrdinal(days[index]) === 1) streak += 1;
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

function pickUnique(list, random, count) {
  const pool = [...list];
  const picked = [];
  while (pool.length && picked.length < count) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return picked;
}

function persistActiveThreshold() {
  state.activeThreshold = currentThreshold.seal
    ? normalizeThreshold(structuredClone(currentThreshold))
    : null;
  return saveState();
}

function renderThresholdSigns() {
  const signs = currentThreshold.signs || [];
  $("#omen-copy").textContent = signs[0] || "—";
  const list = $("#sealed-signs");
  list.innerHTML = "";
  signs.slice(1).forEach((sign, index) => {
    const item = document.createElement("li");
    const number = document.createElement("span");
    const copy = document.createElement("strong");
    number.textContent = `0${index + 2}`;
    copy.textContent = sign;
    item.append(number, copy);
    list.append(item);
  });
  $("#omen-proof").textContent = currentThreshold.antiSign
    ? `АНТИЗНАК: ${currentThreshold.antiSign}`
    : "Промах тоже считается: не подгоняй реальность под печать.";
}

function setFragmentVisual(seal) {
  const seed = stringHash(seal || "fragment");
  const fragment = $("#threshold-fragment");
  fragment.style.setProperty("--x", `${24 + (seed % 53)}%`);
  fragment.style.setProperty("--y", `${22 + ((seed >>> 4) % 57)}%`);
  fragment.style.setProperty("--turn", `${seed % 360}deg`);
  fragment.style.setProperty("--fragment-rotation", `${17 + (seed % 71)}deg`);
  fragment.style.setProperty(
    "--fragment-radius",
    `${34 + (seed % 28)}% ${40 + ((seed >>> 3) % 25)}% ${37 + ((seed >>> 7) % 30)}% ${42 + ((seed >>> 11) % 25)}%`
  );
}

function completedThresholdCount() {
  return state.chronicle.filter(
    (entry) => entry.type === "threshold" && ["exact", "near", "miss"].includes(entry.outcome)
  ).length;
}

function renderThresholdState() {
  const threshold = currentThreshold;
  const hasSeal = Boolean(threshold.seal);
  $$("#radius-choices .choice-chip").forEach((chip) =>
    chip.classList.toggle("is-selected", Number(chip.dataset.value) === threshold.radius)
  );
  $$("#tone-choices .choice-chip").forEach((chip) =>
    chip.classList.toggle("is-selected", chip.dataset.value === threshold.tone)
  );
  $("#threshold-form").classList.toggle("hidden", hasSeal);
  $("#threshold-result").classList.toggle("hidden", !hasSeal);
  if (!hasSeal) return;

  $("#intention-seal").textContent = threshold.seal.slice(0, 16).toUpperCase();
  renderThresholdSigns();
  $("#threshold-recovery").classList.add("hidden");
  $("#arrival-panel").classList.add("hidden");
  $("#threshold-complete").classList.add("hidden");
  $("#route-panel").classList.add("hidden");
  $("#arrive-threshold-button").classList.add("hidden");
  $("#manual-arrive-threshold-button").classList.add("hidden");
  $("#find-threshold-button").classList.toggle("hidden", threshold.status !== "sealed");
  $("#home-threshold-now-button").classList.toggle("hidden", threshold.status !== "sealed");
  $("#map-oracle").classList.remove("is-searching", "has-point");

  if (threshold.status === "sealed") {
    $("#threshold-status").textContent = "ПЕЧАТЬ ГОТОВА · МЕСТО ЕЩЁ НЕ ВЫБРАНО";
    $("#place-name").textContent = "Раскрой место или выбери домашний контур";
    $("#place-meta").textContent =
      "Поиск отправит приблизительную область публичным сервисам OpenStreetMap. Выбранная точка сохранится локально для продолжения.";
    updateThresholdAvailability();
    return;
  }

  const place = threshold.place;
  if (place) {
    $("#map-oracle").classList.add("has-point");
    $("#threshold-status").textContent = place.home
      ? "ДОМАШНИЙ ПОРОГ РАСКРЫТ"
      : "МЕСТО ЗАПЕЧАТАНО · ПРОВЕРЬ МАРШРУТ";
    $("#place-name").textContent = place.name;
    $("#place-meta").textContent = place.home
      ? "Без геопозиции и внешних запросов · останься там, где безопасно"
      : `${categoryLabel(place.category)} · около ${place.distance} м по прямой · данные © OpenStreetMap · доступ и маршрут не проверены`;

    if (!place.home && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
      const coordinates = `${place.latitude},${place.longitude}`;
      const encodedCoordinates = encodeURIComponent(coordinates);
      const encodedName = encodeURIComponent(place.name);
      $("#apple-maps-link").href =
        `https://maps.apple.com/?daddr=${encodedCoordinates}&dirflg=w&q=${encodedName}`;
      $("#google-maps-link").href =
        `https://www.google.com/maps/dir/?api=1&destination=${encodedCoordinates}&travelmode=walking`;
      $("#open-map-link").href =
        `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`;
      $("#route-panel").classList.remove("hidden");
    }
  }

  if (threshold.status === "revealed") {
    $("#arrive-threshold-button").classList.remove("hidden");
  } else if (threshold.status === "arrived") {
    $("#arrival-panel").classList.remove("hidden");
    $("#threshold-note").value = threshold.note || "";
    $("#threshold-note-count").textContent = `${(threshold.note || "").length}/120`;
    $$(".threshold-outcomes button").forEach((button) =>
      button.classList.toggle("is-selected", button.dataset.thresholdOutcome === threshold.outcome)
    );
    $("#complete-threshold-button").disabled = !threshold.outcome;
  } else if (threshold.status === "completed") {
    $("#threshold-complete").classList.remove("hidden");
    setFragmentVisual(threshold.seal);
    $("#threshold-fragment-title").textContent = `${threshold.fragmentId} сохранён.`;
    $("#threshold-fragment-copy").textContent = threshold.note
      ? `«${threshold.note}» Завтра эта деталь войдёт в новую печать.`
      : "Завтра исход этой экспедиции войдёт в новую печать.";
    const count = completedThresholdCount();
    $("#constellation-progress").textContent = `${((Math.max(1, count) - 1) % 7) + 1}/7`;
  }
}

async function sealIntention(event) {
  event.preventDefault();
  const intention = $("#intention-input").value.trim();
  if (!intention) return;
  if (!$("#safety-confirm").checked) {
    showToast("Сначала подтверди правила осторожности.");
    return;
  }

  const sealedAt = new Date().toISOString();
  const material = [
    todayKey(),
    personalKeyMaterial(state.profile),
    timePhase(),
    intention.toLocaleLowerCase("ru-RU"),
    currentThreshold.radius,
    currentThreshold.tone,
    sealedAt,
    "threshold-v2"
  ].join("|");
  currentThreshold.intention = intention;
  currentThreshold.seal = await sha256(material);
  currentThreshold.id = `threshold-${currentThreshold.seal.slice(0, 12)}`;
  currentThreshold.status = "sealed";
  currentThreshold.createdAt = sealedAt;
  const random = mulberry32(stringHash(currentThreshold.seal));
  currentThreshold.signs = pickUnique(forecastBank.omens[currentThreshold.tone], random, 3);
  currentThreshold.antiSign = pick(thresholdAntiSigns, random);
  await persistActiveThreshold();
  renderThresholdState();
  playTone("seal");
  vibrate([18, 40, 18]);
  showToast("Печать сохранена. Перезагрузка больше не разорвёт экспедицию.");
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation-unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 4000,
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
    [out:json][timeout:5];
    (
      nwr(around:${radius},${latitude},${longitude})["name"]["tourism"="artwork"];
      nwr(around:${radius},${latitude},${longitude})["name"]["tourism"="viewpoint"];
      nwr(around:${radius},${latitude},${longitude})["name"]["leisure"="park"];
      nwr(around:${radius},${latitude},${longitude})["name"]["historic"="memorial"];
      nwr(around:${radius},${latitude},${longitude})["name"]["historic"="monument"];
      nwr(around:${radius},${latitude},${longitude})["name"]["amenity"="library"];
      nwr(around:${radius},${latitude},${longitude})["name"]["amenity"="community_centre"];
    );
    out center tags 80;
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
      if (distance > radius * 1.12) return null;
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
      if (distance > radius * 1.12) return null;
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
    3500
  );
  return extractNominatimPlaces(Array.isArray(data) ? data : [], origin, radius);
}

async function searchOverpass(origin, radius) {
  const endpointIndex = stringHash(
    `${origin.latitude.toFixed(3)}|${origin.longitude.toFixed(3)}|${radius}`
  ) % OVERPASS_ENDPOINTS.length;
  const data = await fetchJsonWithTimeout(
    OVERPASS_ENDPOINTS[endpointIndex],
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: new URLSearchParams({ data: overpassQuery(origin.latitude, origin.longitude, radius) })
    },
    3500
  );
  return extractPlaces(data.elements || [], origin, radius);
}

async function searchPublicPlaces(origin, radius) {
  const cacheKey = `${origin.latitude.toFixed(4)}:${origin.longitude.toFixed(4)}:${radius}`;
  if (placeSearchCache.has(cacheKey)) return placeSearchCache.get(cacheKey);

  const queryOrder = ["[park]", "[monument]", "[artwork]"];
  const query = queryOrder[stringHash(currentThreshold.seal) % queryOrder.length];
  const results = await Promise.allSettled([
    searchNominatim(origin, radius, query),
    searchOverpass(origin, radius)
  ]);
  const places = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);
  const unique = [...new Map(places.map((place) => [place.id, place])).values()].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  if (unique.length) placeSearchCache.set(cacheKey, unique);
  if (!unique.length && results.every((result) => result.status === "rejected")) {
    throw new Error("place-service-timeout");
  }
  return unique;
}

function thresholdIsDaylight(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 21;
}

function updateThresholdAvailability() {
  const button = $("#find-threshold-button");
  const notice = $("#threshold-availability");
  if (!button || !notice) return;
  const daylight = thresholdIsDaylight();
  notice.classList.toggle("hidden", daylight);
  notice.textContent = daylight
    ? ""
    : "НОЧНОЙ КОНТУР: место можно запечатать сейчас, но открывай маршрут и выходи только после 07:00. Или выбери «Порог здесь».";

  if (!$("#threshold-result").classList.contains("hidden") && !button.classList.contains("hidden")) {
    if (!$("#map-oracle").classList.contains("is-searching")) {
      button.disabled = false;
      button.querySelector("span").textContent = daylight
        ? "Раскрыть место рядом"
        : "Запечатать место до утра";
    }
  }
}

async function findThreshold() {
  const button = $("#find-threshold-button");
  const map = $("#map-oracle");
  const searchSeal = currentThreshold.seal;
  $("#threshold-recovery").classList.add("hidden");
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
    if (!searchSeal || currentThreshold.seal !== searchSeal) return;
    if (!places.length) throw new Error("no-public-places");

    const choiceSeed = stringHash(`${currentThreshold.seal}|${places.map((place) => place.id).join(",")}`);
    const place = places[choiceSeed % places.length];
    await revealThresholdPlace(place);
  } catch (error) {
    if (!searchSeal || currentThreshold.seal !== searchSeal) return;
    map.classList.remove("is-searching");
    button.disabled = false;
    button.querySelector("span").textContent = "Попробовать ещё раз";
    $("#threshold-status").textContent = "ТОЧКА НЕ РАСКРЫЛАСЬ";
    $("#threshold-recovery").classList.remove("hidden");
    if (error?.code === 1) {
      $("#threshold-recovery-copy").textContent =
        "Геопозиция недоступна. Печать сохранена: разреши доступ позже или пройди домашний контур сейчас.";
      showToast("Печать не потеряна. Доступен домашний Порог без геопозиции.");
    } else if (error?.message === "no-public-places") {
      $("#threshold-recovery-copy").textContent =
        "В этом радиусе нет подходящего ответа. Расширь поиск или преврати место, где ты уже находишься, в Порог.";
      showToast("Место не найдено, но экспедиция продолжается.");
    } else if (error?.message === "place-service-timeout") {
      $("#threshold-recovery-copy").textContent =
        "Картографические узлы не ответили вовремя. Не жди: расширь поиск позже или продолжи здесь.";
      showToast("Карта молчит; печать и быстрый fallback уже готовы.");
    } else {
      $("#threshold-recovery-copy").textContent =
        "Сеть сейчас молчит. Печать сохранена на устройстве; домашний контур работает офлайн.";
      showToast("Сеть не разорвала экспедицию.");
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
    community_centre: "общественный центр",
    home: "домашний контур"
  }[category] || "публичное место";
}

async function revealThresholdPlace(place) {
  currentThreshold.place = {
    id: place.id,
    name: place.name,
    category: place.category,
    latitude:
      place.latitude !== null && Number.isFinite(Number(place.latitude)) ? Number(place.latitude) : null,
    longitude:
      place.longitude !== null && Number.isFinite(Number(place.longitude)) ? Number(place.longitude) : null,
    distance: Number(place.distance) || 0,
    home: place.home === true
  };
  currentThreshold.status = place.home ? "arrived" : "revealed";
  if (place.home) {
    currentThreshold.arrivedAt = new Date().toISOString();
    currentThreshold.reminderAt = null;
  } else {
    currentThreshold.reminderAt = Date.now() + 12 * 60 * 1000;
    currentThreshold.reminderNotifiedAt = null;
  }
  await persistActiveThreshold();
  renderThresholdState();

  const entry = {
    id: currentThreshold.id,
    type: "threshold",
    title: place.name,
    copy: currentThreshold.signs.join(" · "),
    createdAt: currentThreshold.createdAt,
    outcome: "open",
    expedition: {
      seal: currentThreshold.seal,
      signs: currentThreshold.signs,
      antiSign: currentThreshold.antiSign,
      place: currentThreshold.place,
      status: currentThreshold.status
    }
  };
  const existingIndex = state.chronicle.findIndex((item) => item.id === entry.id);
  if (existingIndex >= 0) state.chronicle.splice(existingIndex, 1, entry);
  else state.chronicle.unshift(entry);
  await saveState();
  renderChronicle();
  emitRealitySignal(
    place.home ? "arrived" : "thresholdReady",
    {
      place: currentThreshold.place.name,
      distance: currentThreshold.place.distance
    },
    {
      label: place.home ? "ДОМАШНИЙ ПОРОГ" : "ГОРОД ОТВЕТИЛ",
      priority: "high"
    }
  );
  armPendingNotifications();
  playTone("reveal");
  vibrate([22, 50, 22, 50, 35]);
  showToast(
    place.home
      ? "Домашний Порог раскрыт. Сверь три знака и сохрани одну деталь."
      : "Место сохранено. Открой маршрут при свете и вернись к кнопке «Я у Порога»."
  );
}

async function revealHomeThreshold() {
  const random = mulberry32(stringHash(`${currentThreshold.seal}|home-v2`));
  await revealThresholdPlace({
    id: `home-${currentThreshold.seal.slice(0, 12)}`,
    name: pick(homeThresholdBank[currentThreshold.tone], random),
    category: "home",
    latitude: null,
    longitude: null,
    distance: 0,
    home: true
  });
}

async function expandThresholdSearch() {
  currentThreshold.radius = 2500;
  $$("#radius-choices .choice-chip").forEach((chip) =>
    chip.classList.toggle("is-selected", chip.dataset.value === "2500")
  );
  await persistActiveThreshold();
  findThreshold();
}

async function confirmThresholdArrival({ manual = false } = {}) {
  if (!currentThreshold.place || currentThreshold.status !== "revealed") return;
  const place = currentThreshold.place;
  if (!manual && !place.home && Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    try {
      const position = await getPosition();
      const distance = Math.round(
        haversineMeters(
          position.coords.latitude,
          position.coords.longitude,
          place.latitude,
          place.longitude
        )
      );
      if (distance > 350) {
        showToast(`До Порога ещё около ${distance} м. Не рискуй ради отметки.`);
        return;
      }
    } catch {
      $("#manual-arrive-threshold-button").classList.remove("hidden");
      showToast("GPS не подтвердил прибытие. Экспедиция сохранена — попробуй ещё раз из безопасного места.");
      return;
    }
  }
  currentThreshold.status = "arrived";
  currentThreshold.arrivedAt = new Date().toISOString();
  await persistActiveThreshold();
  renderThresholdState();
  emitRealitySignal("arrived", {}, {
    label: "ПРИБЫТИЕ ПРИНЯТО",
    priority: "high"
  });
  updateAppBadge();
  playTone("arrival");
  showToast("Прибытие принято. Теперь реальность отвечает на запечатанные знаки.");
}

function selectThresholdOutcome(outcome) {
  if (!["exact", "near", "miss"].includes(outcome)) return;
  currentThreshold.outcome = outcome;
  $$(".threshold-outcomes button").forEach((button) =>
    button.classList.toggle("is-selected", button.dataset.thresholdOutcome === outcome)
  );
  $("#complete-threshold-button").disabled = false;
  persistActiveThreshold();
  playTone(outcome === "miss" ? "miss" : "select");
}

async function completeThreshold() {
  if (currentThreshold.status !== "arrived" || !currentThreshold.outcome) return;
  currentThreshold.note = $("#threshold-note").value.trim().slice(0, 120);
  currentThreshold.status = "completed";
  currentThreshold.completedAt = new Date().toISOString();
  currentThreshold.fragmentId = `Π-${currentThreshold.seal.slice(0, 7).toUpperCase()}`;

  const entry = state.chronicle.find((item) => item.id === currentThreshold.id);
  if (entry) {
    entry.title = `${currentThreshold.fragmentId} · ${currentThreshold.place?.name || "Порог"}`;
    entry.copy = currentThreshold.note || currentThreshold.signs.join(" · ");
    entry.createdAt = currentThreshold.completedAt;
    entry.outcome = currentThreshold.outcome;
    entry.expedition = {
      ...(entry.expedition || {}),
      status: "completed",
      fragmentId: currentThreshold.fragmentId,
      note: currentThreshold.note,
      outcome: currentThreshold.outcome,
      completedAt: currentThreshold.completedAt
    };
  }
  await persistActiveThreshold();
  renderThresholdState();
  renderChronicle();
  emitRealitySignal(
    "completed",
    { fragment: currentThreshold.fragmentId },
    { label: "РЕАЛЬНОСТЬ ОТВЕТИЛА", priority: "high" }
  );
  updateAppBadge();
  playTone("fragment");
  vibrate([18, 35, 18, 35, 55]);
  showToast(`${currentThreshold.fragmentId} сохранён. Завтрашняя печать уже изменилась.`);
}

async function resetThreshold(options = {}) {
  const persist = options.persist !== false;
  currentThreshold = createThresholdState();
  state.activeThreshold = null;
  if (persist) await saveState();
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
  $("#find-threshold-button span").textContent = "Раскрыть место рядом";
  $("#route-panel").classList.add("hidden");
  $("#arrive-threshold-button").classList.add("hidden");
  $("#manual-arrive-threshold-button").classList.add("hidden");
  $("#threshold-recovery").classList.add("hidden");
  $("#arrival-panel").classList.add("hidden");
  $("#threshold-complete").classList.add("hidden");
  $("#place-name").textContent = "Сначала разреши геопозицию";
  $("#place-meta").textContent =
    "Координаты передаются публичным картографическим сервисам только для поиска; выбранная точка сохраняется локально для продолжения.";
  $("#threshold-status").textContent = "ТОЧКА ЕЩЁ НЕ ВЫБРАНА";
  $("#threshold-note").value = "";
  $("#threshold-note-count").textContent = "0/120";
  $("#sealed-signs").innerHTML = "";
  $("#omen-copy").textContent = "—";
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

function scheduleMidnightRefresh() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 2, 0);
  window.setTimeout(() => window.location.reload(), Math.max(1000, next.getTime() - now.getTime()));
}

function init() {
  currentThreshold = state.activeThreshold
    ? structuredClone(state.activeThreshold)
    : createThresholdState();
  const previousSeenAt = state.reality.lastSeenAt ? new Date(state.reality.lastSeenAt).getTime() : 0;
  const returnGap = previousSeenAt ? Date.now() - previousSeenAt : 0;
  state.reality.visits += 1;
  state.reality.lastSeenAt = new Date().toISOString();
  $("#day-label").textContent = localDateLabel().toUpperCase();
  $("#day-phase").textContent = timePhase();
  updateProfileUI();
  updateSoundUI();
  updateNotificationUI();
  renderExistingDaily();
  renderChronicle();
  renderThresholdState();
  updateThresholdAvailability();
  detectInstallPrompt();
  scheduleMidnightRefresh();

  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.target)));
  $$("[data-open]").forEach((button) => button.addEventListener("click", () => openLayer(button.dataset.open)));
  $$("[data-close]").forEach((button) => button.addEventListener("click", () => closeLayer(button)));
  $$(".truth-tag").forEach((tag) => {
    tag.setAttribute("role", "button");
    tag.tabIndex = 0;
    tag.addEventListener("click", () => openLayer("about-modal"));
  });

  $("#profile-button").addEventListener("click", () => openLayer("profile-sheet"));
  $("#signal-toggle").addEventListener("click", () => {
    updateNotificationUI();
    openLayer("signals-sheet");
  });
  $("#reality-wire").addEventListener("click", () => {
    updateNotificationUI();
    openLayer("signals-sheet");
  });
  $("#enable-notifications-button").addEventListener("click", enableNotifications);
  $("#test-notification-button").addEventListener("click", sendTestNotification);
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
    try {
      await deleteAppCaches();
    } catch {
      // Primary and mirrored user data are already gone; cache cleanup is best-effort.
    }
    placeSearchCache.clear();
    state = structuredClone(defaults);
    currentThreshold = createThresholdState();
    storageProtection.localFound = false;
    storageProtection.localCorrupt = false;
    storageProtection.recovered = false;
    stopAmbientSound();
    await resetThreshold({ persist: false });
    updateProfileUI();
    updateSoundUI();
    updateNotificationUI();
    updateReturnCue();
    renderChronicle();
    $("#forecast-section").classList.add("hidden");
    $(".oracle-hero").classList.remove("hidden");
    $("#open-day-button").classList.remove("hidden");
    $("#show-forecast-button").classList.add("hidden");
    $("#hero-copy").textContent =
      "Короткий личный ритуал создаст сегодняшний прогноз. Никакой магии — только психология внимания, символы и честная Хроника совпадений.";
    closeLayer($("#profile-sheet"));
    emitRealitySignal("first", {}, { label: "НОВЫЙ КОНТУР", priority: "high" });
    updateAppBadge();
    await startAmbientSound();
    showToast("Локальные данные удалены. Звук снова включён по умолчанию.");
  });

  $("#open-day-button").addEventListener("click", () => {
    resetRitual();
    openLayer("ritual-modal");
    playTone("tap");
  });
  $("#show-forecast-button").addEventListener("click", () => {
    const record = forecastForReturn();
    if (record) renderForecast(record.forecast);
  });
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
  ["pointerup", "pointercancel"].forEach((eventName) =>
    holdButton.addEventListener(eventName, cancelHold)
  );
  holdButton.addEventListener("click", (event) => {
    if (event.detail === 0) completeHoldAccessibly();
  });
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
  $("#expand-threshold-button").addEventListener("click", expandThresholdSearch);
  $("#home-threshold-button").addEventListener("click", revealHomeThreshold);
  $("#home-threshold-now-button").addEventListener("click", revealHomeThreshold);
  $("#apple-maps-link").addEventListener("click", () => trackRouteOpen("apple"));
  $("#google-maps-link").addEventListener("click", () => trackRouteOpen("google"));
  $("#open-map-link").addEventListener("click", () => trackRouteOpen("osm"));
  $("#arrive-threshold-button").addEventListener("click", () => confirmThresholdArrival());
  $("#manual-arrive-threshold-button").addEventListener("click", () =>
    confirmThresholdArrival({ manual: true })
  );
  $$(".threshold-outcomes button").forEach((button) =>
    button.addEventListener("click", () => selectThresholdOutcome(button.dataset.thresholdOutcome))
  );
  $("#threshold-note").addEventListener("input", (event) => {
    currentThreshold.note = event.target.value.slice(0, 120);
    $("#threshold-note-count").textContent = `${currentThreshold.note.length}/120`;
    persistActiveThreshold();
  });
  $("#complete-threshold-button").addEventListener("click", completeThreshold);
  $("#reset-threshold-button").addEventListener("click", () => resetThreshold());
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

  getServiceWorkerRegistration().then(() => {
    updateNotificationUI();
    armPendingNotifications();
  });
  window.setInterval(updateThresholdAvailability, 60000);
  clearInterval(realityTimer);
  realityTimer = window.setInterval(updateRealityFromCurrentState, 75000);
  document.addEventListener("visibilitychange", handleVisibilityReturn);
  window.addEventListener("focus", updateNotificationUI);
  window.addEventListener("online", () => {
    emitRealitySignal("online", {}, { label: "СВЯЗЬ ВЕРНУЛАСЬ", priority: "high" });
  });
  window.addEventListener("offline", () => {
    emitRealitySignal("offline", {}, { label: "ГОРОДСКОЙ СЛОЙ МОЛЧИТ", priority: "high" });
  });

  const signalTarget = new URLSearchParams(window.location.search).get("signal");
  if (signalTarget === "threshold") {
    setView("threshold");
  } else if (signalTarget === "echo") {
    const record = forecastForReturn();
    if (record) renderForecast(record.forecast);
  }

  if (returnGap >= 2 * 60 * 1000) {
    emitRealitySignal(
      "return",
      { minutes: Math.max(2, Math.round(returnGap / 60000)) },
      { label: "ВОЗВРАЩЕНИЕ", priority: "high" }
    );
  } else {
    updateRealityFromCurrentState();
  }
  saveState();

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
