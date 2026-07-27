const STORAGE_KEY = "moire-oracle-state-v1";
const HOLD_DURATION = 1800;

const defaults = {
  profile: { name: "", birthDate: "", birthTime: "" },
  soundEnabled: false,
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

let state = loadState();
let currentRitual = { energy: "", card: null, holdMs: 0, seal: "", forecast: null };
let currentThreshold = { radius: 1200, tone: "quiet", seal: "", omen: "", intention: "" };
let holdTimer = null;
let holdStartedAt = 0;
let holdFrame = null;
let toastTimer = null;
let audioContext = null;
let ambientNodes = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...defaults,
      ...saved,
      profile: { ...defaults.profile, ...(saved.profile || {}) },
      daily: saved.daily || {},
      chronicle: Array.isArray(saved.chronicle) ? saved.chronicle : []
    };
  } catch {
    return structuredClone(defaults);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

async function chooseCard(cardIndex) {
  currentRitual.card = cardIndex;
  const seedMaterial = [
    todayKey(),
    state.profile.birthDate || "no-birth-date",
    state.profile.birthTime || timePhase(),
    currentRitual.energy,
    currentRitual.holdMs,
    cardIndex
  ].join("|");

  currentRitual.seal = await sha256(seedMaterial);
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
    card: currentRitual.card,
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
}

function revealForecast() {
  persistDailyForecast();
  closeLayer($("#ritual-modal"));
  renderForecast(state.daily[todayKey()]);
  playTone("reveal");
  setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
}

function renderExistingDaily() {
  const forecast = state.daily[todayKey()];
  if (!forecast) return;
  $("#open-day-button").classList.add("hidden");
  $("#show-forecast-button").classList.remove("hidden");
  $("#personal-greeting").textContent = state.profile.name
    ? `${state.profile.name.toUpperCase()}, ДЕНЬ УЖЕ ЗАПЕЧАТАН`
    : "ДЕНЬ УЖЕ ЗАПЕЧАТАН";
  $("#hero-copy").textContent = "Сегодняшний прогноз нельзя пересобрать. Печать сохранена на этом устройстве.";
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
  entries.slice(0, 24).forEach((entry) => {
    const article = document.createElement("article");
    article.className = "chronicle-item";
    const symbol = entry.type === "threshold" ? "⌖" : "✦";
    article.innerHTML = `
      <span class="chronicle-symbol" aria-hidden="true">${symbol}</span>
      <span>
        <strong>${escapeHTML(entry.title)}</strong>
        <small>${formatShortDate(entry.createdAt)} · ${entry.type === "threshold" ? "Порог" : "Затмение"}</small>
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
    [out:json][timeout:15];
    (
      nwr(around:${radius},${latitude},${longitude})["name"]["tourism"~"artwork|viewpoint"]["access"!~"private|no"];
      nwr(around:${radius},${latitude},${longitude})["name"]["historic"~"memorial|monument"]["access"!~"private|no"];
      nwr(around:${radius},${latitude},${longitude})["name"]["leisure"="park"]["access"!~"private|no"];
      nwr(around:${radius},${latitude},${longitude})["name"]["amenity"~"library|community_centre"]["access"!~"private|no"];
    );
    out center tags 80;
  `.trim();
}

function extractPlaces(elements, origin, radius) {
  const permitted = new Set(["artwork", "viewpoint", "memorial", "monument", "park", "library", "community_centre"]);
  return elements
    .map((element) => {
      const latitude = element.lat ?? element.center?.lat;
      const longitude = element.lon ?? element.center?.lon;
      const tags = element.tags || {};
      const category = tags.tourism || tags.historic || tags.leisure || tags.amenity;
      if (!latitude || !longitude || !tags.name || !permitted.has(category)) return null;
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

async function findThreshold() {
  const hour = new Date().getHours();
  if (hour < 7 || hour >= 21) {
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
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({ data: overpassQuery(origin.latitude, origin.longitude, currentThreshold.radius) })
    });
    if (!response.ok) throw new Error(`overpass-${response.status}`);
    const data = await response.json();
    const places = extractPlaces(data.elements || [], origin, currentThreshold.radius);
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
  $("#place-meta").textContent = `${categoryLabel(place.category)} · около ${place.distance} м · проверь доступность и маршрут`;
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
}

async function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  updateSoundUI();
  if (state.soundEnabled) {
    initAudioContext();
    playTone("reveal");
    const ambient = $("#ambient-audio");
    ambient.volume = 0.24;
    if (ambient.querySelector("source")) {
      try {
        await ambient.play();
      } catch {
        startProceduralAmbient();
      }
    } else {
      startProceduralAmbient();
    }
    showToast("Звук включён. Наушники усиливают эффект.");
  } else {
    $("#ambient-audio").pause();
    stopProceduralAmbient();
    showToast("Звук выключен.");
  }
}

function updateSoundUI() {
  const icon = $(".sound-icon");
  icon.classList.toggle("is-muted", !state.soundEnabled);
  $("#sound-toggle").setAttribute("aria-label", state.soundEnabled ? "Выключить звук" : "Включить звук");
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
  $("#profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    state.profile = {
      name: $("#name-input").value.trim(),
      birthDate: $("#birth-date-input").value,
      birthTime: $("#birth-time-input").value
    };
    saveState();
    updateProfileUI();
    closeLayer($("#profile-sheet"));
    showToast("Личный ключ сохранён только на этом устройстве.");
    playTone("select");
  });

  $("#clear-data-button").addEventListener("click", () => {
    if (!window.confirm("Удалить профиль, прогнозы и всю хронику с этого устройства?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = structuredClone(defaults);
    updateProfileUI();
    renderChronicle();
    closeLayer($("#profile-sheet"));
    showToast("Локальные данные удалены.");
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
}

document.addEventListener("DOMContentLoaded", init);
