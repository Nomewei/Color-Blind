// =========================
// Firebase SDK imports
// =========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// =========================
// Firebase config (igual)
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyAL1RF5XAMknDUlwtDRjC2PByUabkMCDOA",
  authDomain: "color-blind-bca19.firebaseapp.com",
  projectId: "color-blind-bca19",
  storageBucket: "color-blind-bca19.firebasestorage.app",
  messagingSenderId: "876142955211",
  appId: "1:876142955211:web:e2e380a21e17d8e940694e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const APP_ID = "hues-and-cues-online";

// =========================
// Estado global
// =========================
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
let temporaryGuess = null;

const MAX_PLAYERS = 10;
const DEFAULT_SCORE_LIMIT = 25;

// tamaños soportados
const GRID_SIZES = {
  "30x16": { cols: 30, rows: 16, key: "30x16" },
  "12x8": { cols: 8, rows: 12, key: "12x8" } // F x C, 12 filas, 8 columnas
};

// letras coordenadas dinámicas
const lettersForRows = (rows) => {
  const arr = [];
  for (let i = 0; i < rows; i++) arr.push(String.fromCharCode(65 + i)); // A..
  return arr;
};

// colores jugadores
const playerColors = [
  "#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#3182CE",
  "#5A67D8", "#805AD5", "#D53F8C", "#718096", "#4A5568"
];

// =========================
// DOM
// =========================
const lobbyScreen = document.getElementById("lobby-screen");
const waitingRoomScreen = document.getElementById("waiting-room-screen");
const gameScreen = document.getElementById("game-screen");
const colorGrid = document.getElementById("color-grid");
const colorGridContainer = document.getElementById("color-grid-container");

const roundSummaryModal = document.getElementById("round-summary-modal");
const confirmLeaveModal = document.getElementById("confirm-leave-modal");
const gameOverModal = document.getElementById("game-over-modal");

const soundToggle = document.getElementById("sound-toggle");

// zona dador
const cueGiverView = document.getElementById("cue-giver-view");
const cueGiverTitle = document.getElementById("cue-giver-title");
const secretColorDisplay = document.getElementById("secret-color-display");
const secretColorCoords = document.getElementById("secret-color-coords");
const candidateSwatches = document.getElementById("candidate-swatches");
const clueForm = document.getElementById("clue-form");
const clueInput = document.getElementById("clue-input");

// overlays puntuación
const box1 = document.getElementById("scoring-box-1");
const box2 = document.getElementById("scoring-box-2");
const box3 = document.getElementById("scoring-box-3");

// =========================
// Audio simple
// =========================
let isMuted = true;
const soundIcons = {
  muted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  unmuted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51a2.25 2.25 0 0 1-2.188-1.75A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396A2.25 2.25 0 0 1 4.51 8.25H6.75Z"/></svg>`
};
soundToggle.innerHTML = soundIcons.muted;
soundToggle.addEventListener("click", () => {
  isMuted = !isMuted;
  soundToggle.innerHTML = isMuted ? soundIcons.muted : soundIcons.unmuted;
});
const playClick = () => { if (!isMuted) new AudioContext().close(); };

// =========================
// Paleta 30x16 exacta (A..P)
// =========================
const PALETTE_30x16 = [
  // A
  ["#652F0D","#722C0F","#7D2913","#8A2717","#9E291B","#AA291D","#BA2C21","#D23124","#F03225","#FC3022","#FD3221","#FD3223","#FD312B","#FF3139","#FD3044","#F82F51","#F42E64","#F22975","#E72881","#E32D8D","#D43D91","#C74091","#BC4597","#B14594","#A74697","#984696","#904A97","#874997","#80499A","#764A9B"],
  // B
  ["#8D4D1C","#9B4B1D","#A4461E","#B74822","#C44323","#D33C26","#E23925","#F43423","#FC3521","#FD3B28","#FF3D30","#FD3B3A","#FD3541","#FE364A","#FC345D","#FD316F","#FD2B7B","#F92A8E","#E74092","#D74C95","#C85097","#BB4D96","#B04C95","#A54C95","#9D4B97","#934A96","#854A97","#80499A","#764897","#6A4596"],
  // C
  ["#AA6424","#B45E22","#C36023","#CB5724","#D85324","#E24D24","#ED4823","#F94220","#FD482B","#FE4E3D","#FE514B","#FD4E4F","#FD4E5B","#FD4765","#FD4777","#FD4385","#F84895","#E6579A","#D45B99","#C35B9E","#BC589A","#AD5599","#A45299","#99509A","#904E9B","#884A9A","#7C4896","#754795","#6B4397","#5D3993"],
  // D
  ["#D28426","#DF8424","#E57C22","#F37E20","#F17221","#F86820","#FD6B25","#FE6330","#FF5E3A","#FD654F","#FD6C62","#FB6C69","#FD686F","#FD677E","#FA628C","#FA639C","#E8669D","#D867A1","#C56BA4","#BD65A2","#AA60A1","#A35A9F","#9A589E","#90559D","#864F9C","#7E4C99","#71479A","#684097","#5B3D93","#49368C"],
  // E
  ["#EE9A1E","#F89918","#FF9517","#FF9018","#FF8A21","#FF8029","#FE8139","#FE7840","#FE7B50","#FC8263","#FC8272","#FC847F","#FD8487","#FA7F94","#FB7AA5","#F07FA8","#D97EAC","#CD7DAD","#C07CAE","#B272A9","#A369A7","#9963A6","#8F5EA2","#875AA2","#7D529E","#704E9A","#66479C","#5A3B92","#4A3694","#323286"],
  // F
  ["#FFB20D","#FFAF1C","#FFAA25","#FFAC34","#FFA83B","#FFA747","#FF9B52","#FF9559","#FE9060","#FE926F","#FC9781","#FC9990","#FC9896","#FC979F","#FA93B3","#E698BE","#D596BE","#CA95BC","#BC8ABA","#AE82B5","#9F7AB2","#936FAE","#8866A9","#7E61A7","#7459A3","#66519E","#5A499A","#4C3B93","#37368F","#292D7A"],
  // G
  ["#FFBB13","#FFBD22","#FFB525","#FFB434","#FFBA59","#FFAC50","#FFAE61","#FFA769","#FFA775","#FEA782","#FDA693","#FEA597","#FDA7A4","#FBA4A8","#FBA6C0","#E5ACC9","#D3ACCC","#D0B1D1","#B89EC6","#A790C1","#9B88BF","#8B7CB6","#8073B1","#736AAE","#6661AB","#5A5AA7","#4F50A4","#43469C","#2F3B98","#2A3488"],
  // H
  ["#FFCA10","#FFC822","#FFC428","#FFC43A","#FFC443","#FFBE50","#FFBB5C","#FFBA68","#FFB675","#FFB57D","#FFB389","#FEB89A","#F9BBA9","#F7BCB3","#F0BCC8","#DBBBD4","#CFBCDA","#CEBFDE","#B3ABD1","#A6A3CC","#9598C9","#828BC2","#7680C0","#6778BB","#5A6CB3","#5064AF","#465CAB","#3B51A3","#2D47A1","#213D96"],
  // I
  ["#FFD70F","#FFD520","#FFD42C","#FFD33B","#FFD745","#FFD452","#FFD65B","#FED465","#F9D778","#F3DD8E","#EFDA9A","#E7DDAD","#E0DEBE","#DADFC7","#D1DDCF","#C4DAE5","#BED7F1","#BED7F1","#A3C6E9","#95B8E2","#87A9DA","#76A1D7","#6D93CF","#6184C3","#5279BB","#496EB7","#3F63AF","#385BAC","#2F50A4","#24479F"],
  // J
  ["#FBE11C","#FCE020","#FEE32E","#FBE63D","#FAE745","#FCEA55","#F8E964","#F0E87C","#E7E487","#DEE298","#D7E3A9","#CFE3BA","#CFE4C8","#C9E4D0","#C3E2D4","#B7E0E4","#AEDEF0","#AFDFF6","#98D7F6","#7FCEF7","#76C1ED","#6AB0E7","#5EA4DF","#5894D3","#4C88CC","#467BBE","#3B6DB8","#3466B3","#315CAB","#2B51A4"],
  // K
  ["#F9E435","#FAE53A","#F6E541","#F6E547","#F3E456","#EDE562","#E7E175","#DEE080","#D7DD80","#C7D788","#BCD591","#B1D39E","#B0D4AC","#ADD4B4","#A9D4BF","#A9D7D5","#A4D7DE","#A4D7E0","#92D2E5","#81D0EE","#6CCAF6","#5AC2F8","#56B6EB","#51A5DF","#4E98D7","#4387CC","#397BC4","#356EB8","#3164AF","#2D5DAB"],
  // L
  ["#F3DF1B","#F3DF24","#EEDF2C","#E9DE31","#E6DC3C","#DEDB4C","#D1D659","#BFD061","#B1CC6A","#A6C973","#9BC67D","#93C585","#8EC594","#86C39C","#89C5A2","#86C6B0","#88C9C0","#86C9C5","#7DC6C8","#73C7D1","#61C1DB","#4CBFE2","#30BAEF","#2DB0EF","#32A2E4","#3393D8","#3A85CD","#3277C0","#356EB8","#2E64B3"],
  // M
  ["#E0D619","#DBD520","#D8D529","#D2D331","#C9D03C","#B9CA3E","#ADC648","#9CC04C","#8DBD54","#82BA5B","#73B664","#6BB66E","#6AB67A","#65B67F","#67B686","#6AB992","#69BA9C","#6CBCA2","#6EBEA7","#63BCB5","#57B9B9","#4BBAC7","#3CB7CF","#23B3DB","#0CADE8","#14A0E4","#1D94D9","#2F88D1","#2A7AC3","#2570BC"],
  // N
  ["#C1CC25","#BBCA29","#B3C62D","#A9C233","#9EC036","#91BB39","#7CB43C","#75B13D","#66AD3F","#58A544","#4DA548","#47A350","#3FA859","#41A966","#48AB70","#4EAF78","#51AF7E","#54B182","#59B488","#58B58F","#52B49B","#48B4A9","#3CB3B1","#2BB2C0","#1BB0D0","#07ABDA","#01A1E0","#0A9ADF","#188DD4","#1F7FC8"],
  // O
  ["#9CB834","#97B837","#92B639","#85B13C","#7BAE3E","#69A440","#5EA241","#509A42","#489844","#399045","#2D8D45","#279247","#219848","#219D48","#26A153","#2EA459","#39A863","#3DA96E","#41AB70","#49AD74","#4BAF83","#41AF91","#3BB19C","#2EB0A9","#22AFB5","#1BAFC6","#0DADD4","#00A4D7","#009BDC","#0994DD"],
  // P
  ["#789A3B","#759E3E","#6B9A3F","#61963F","#549741","#479142","#3B8B42","#328842","#218243","#177A41","#0F793E","#0A7F42","#0C8847","#0E8E47","#109748","#159C4A","#23A048","#29A254","#31A55D","#36A764","#37A86E","#30A97B","#27AA87","#1FA995","#15AAA0","#0CA9AE","#0CACBE","#06ACCA","#03A8D8","#00A3E4"]
];

// =========================
// Utilidades paleta
// =========================
function getFullColor(r, c) {
  return PALETTE_30x16[r][c]; // 0-based
}

function buildSubPalette(originRow, originCol, rows, cols) {
  const arr = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push(getFullColor(originRow + r, originCol + c));
    }
    arr.push(row);
  }
  return arr;
}

// =========================
// Autenticación
// =========================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    await signInAnonymously(auth);
    return;
  }
  currentUserId = user.uid;
  const last = JSON.parse(localStorage.getItem("hues-cues-game"));
  if (last?.gameId && last?.userId) rejoinGame(last.gameId, last.userId);
});

// =========================
// Lobby y eventos básicos
// =========================
document.getElementById("create-game-btn").addEventListener("click", createGame);
document.getElementById("join-game-btn").addEventListener("click", joinGame);
document.getElementById("start-game-btn").addEventListener("click", startGame);
document.getElementById("exit-lobby-btn").addEventListener("click", executeLeave);
document.getElementById("leave-game-btn").addEventListener("click", () => confirmLeaveModal.classList.remove("hidden"));
document.getElementById("cancel-leave-btn").addEventListener("click", () => confirmLeaveModal.classList.add("hidden"));
document.getElementById("confirm-leave-btn").addEventListener("click", executeLeave);
document.getElementById("new-game-btn").addEventListener("click", restartGame);
document.getElementById("game-id-display").addEventListener("click", copyGameId);

// settings
document.getElementById("round-limit").addEventListener("change", (e) => updateGameSettings({ roundLimit: parseInt(e.target.value || "1") }));
document.getElementById("score-limit").addEventListener("change", (e) => updateGameSettings({ scoreLimit: parseInt(e.target.value || "1") }));
document.getElementById("grid-size-select").addEventListener("change", (e) => updateGameSettings({ gridSize: e.target.value }));

// =========================
// Crear, unirse, salir
// =========================
function getPlayerName() {
  const n = document.getElementById("player-name").value.trim();
  if (!n) {
    document.getElementById("lobby-error").textContent = "Escribe tu nombre";
    return null;
  }
  return n;
}

async function createGame() {
  const name = getPlayerName();
  if (!name || !currentUserId) return;

  const id = Math.random().toString(36).substring(2, 7).toUpperCase();
  currentGameId = id;

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);
  const players = { [currentUserId]: { name, color: playerColors[0], score: 0, isHost: true } };

  const gameData = {
    hostId: currentUserId,
    players,
    playerOrder: [currentUserId],
    gameState: "waiting",
    gameSettings: {
      roundLimit: 10,
      scoreLimit: DEFAULT_SCORE_LIMIT,
      gridSize: "30x16"
    },
    createdAt: new Date()
  };

  await setDoc(gameRef, gameData);
  localStorage.setItem("hues-cues-game", JSON.stringify({ gameId: id, userId: currentUserId }));
  subscribeToGame(id);
  showScreen("waiting-room");
}

async function joinGame() {
  const name = getPlayerName();
  if (!name || !currentUserId) return;

  const id = document.getElementById("join-game-id").value.trim().toUpperCase();
  if (!id) {
    document.getElementById("lobby-error").textContent = "Introduce un código";
    return;
  }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) {
    document.getElementById("lobby-error").textContent = "Partida no encontrada";
    return;
  }

  const data = snap.data();
  const currentCount = Object.keys(data.players || {}).length;
  if (currentCount >= MAX_PLAYERS) {
    document.getElementById("lobby-error").textContent = "La partida está llena";
    return;
  }

  if (data.gameState !== "waiting") {
    // Reingreso si ya estaba
    const entry = Object.entries(data.players).find(([, p]) => p.name === name);
    if (entry) {
      const existingPlayerId = entry[0];
      localStorage.setItem("hues-cues-game", JSON.stringify({ gameId: id, userId: existingPlayerId }));
      rejoinGame(id, existingPlayerId);
      return;
    }
    document.getElementById("lobby-error").textContent = "La partida ya comenzó";
    return;
  }

  const color = playerColors[currentCount];
  const newPlayers = { ...data.players, [currentUserId]: { name, color, score: 0, isHost: false } };
  const newOrder = [...data.playerOrder, currentUserId];

  await updateDoc(gameRef, { players: newPlayers, playerOrder: newOrder });
  localStorage.setItem("hues-cues-game", JSON.stringify({ gameId: id, userId: currentUserId }));
  currentGameId = id;
  subscribeToGame(id);
  showScreen("waiting-room");
}

async function rejoinGame(id, userId) {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) {
    localStorage.removeItem("hues-cues-game");
    return;
  }
  currentGameId = id;
  currentUserId = userId;
  subscribeToGame(id);
}

async function executeLeave() {
  if (unsubscribeGame) unsubscribeGame();
  if (currentGameId && currentUserId) {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const snap = await getDoc(gameRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.hostId === currentUserId) {
        await deleteDoc(gameRef);
      }
    }
  }
  localStorage.removeItem("hues-cues-game");
  currentGameId = null;
  confirmLeaveModal.classList.add("hidden");
  showScreen("lobby");
}

function copyGameId() {
  const id = document.getElementById("game-id-display").textContent;
  navigator.clipboard.writeText(id);
}

// =========================
// Suscripción y UI
// =========================
function subscribeToGame(id) {
  if (unsubscribeGame) unsubscribeGame();
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);
  unsubscribeGame = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) {
      localStorage.removeItem("hues-cues-game");
      alert("El anfitrión terminó la partida");
      showScreen("lobby");
      return;
    }
    const data = snap.data();
    updateUI(data);
  });
}

function showScreen(name) {
  lobbyScreen.classList.add("hidden");
  waitingRoomScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  document.getElementById(`${name}-screen`).classList.remove("hidden");
}

function updateUI(data) {
  if (data.gameState === "waiting") {
    // sala de espera
    showScreen("waiting-room");
    document.getElementById("game-id-display").textContent = currentGameId;

    const ul = document.getElementById("player-list");
    ul.innerHTML = "";
    data.playerOrder.forEach((pid) => {
      const p = data.players[pid];
      const li = document.createElement("li");
      li.className = "flex items-center";
      li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2 border border-gray-400" style="background:${p.color}"></div>${p.name}${p.isHost ? " (Host)" : ""}`;
      ul.appendChild(li);
    });

    const isHost = data.hostId === currentUserId;
    const opts = document.getElementById("game-options");
    const limits = document.getElementById("game-limits-display");
    const roundInput = document.getElementById("round-limit");
    const scoreInput = document.getElementById("score-limit");
    const gridSelect = document.getElementById("grid-size-select");

    if (isHost) {
      opts.classList.remove("hidden");
      limits.classList.add("hidden");
      roundInput.value = data.gameSettings.roundLimit;
      scoreInput.value = data.gameSettings.scoreLimit;
      gridSelect.value = data.gameSettings.gridSize || "30x16";
      document.getElementById("start-game-btn").style.display = "block";
    } else {
      opts.classList.add("hidden");
      limits.classList.remove("hidden");
      limits.textContent = `Se jugará a ${data.gameSettings.roundLimit} rondas o ${data.gameSettings.scoreLimit} puntos.`;
      document.getElementById("start-game-btn").style.display = "none";
    }
    return;
  }

  showScreen("game");
  renderScores(data);
  renderBoard(data);
  renderGameInfo(data);
  renderControls(data);
}

// =========================
// Empezar partida y settings
// =========================
async function updateGameSettings(newSettings) {
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();
  await updateDoc(gameRef, { gameSettings: { ...data.gameSettings, ...newSettings } });
}

async function startGame() {
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.hostId !== currentUserId) {
    alert("Solo el anfitrión puede empezar");
    return;
  }

  // grid config
  const gs = data.gameSettings.gridSize || "30x16";
  const { rows, cols } = GRID_SIZES[gs];

  let originRow = 0, originCol = 0;
  if (gs === "12x8") {
    originRow = Math.floor(Math.random() * (16 - rows + 1)); // 0..4
    originCol = Math.floor(Math.random() * (30 - cols + 1)); // 0..22
  }

  const gridConfig = { size: gs, rows, cols, originRow, originCol };

  await updateDoc(gameRef, {
    gameState: "choose_secret",
    currentRound: 1,
    currentPlayerIndex: 0,
    gridConfig,
    currentCard: null,
    clues: [],
    guesses: {}
  });
}

// =========================
// Render lateral y tablero
// =========================
function renderScores(data) {
  const container = document.getElementById("player-scores");
  container.innerHTML = "";
  data.playerOrder.forEach((pid) => {
    const p = data.players[pid];
    const row = document.createElement("div");
    row.className = "flex justify-between items-center p-2 rounded-md";
    row.innerHTML = `
      <div class="flex items-center">
        <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background:${p.color}"></div>
        <span class="font-medium">${p.name}</span>
      </div>
      <span class="font-bold text-lg">${p.score}</span>
    `;
    container.appendChild(row);
  });
}

function currentLetters(data) {
  const rows = data.gridConfig?.rows || 16;
  return lettersForRows(rows);
}

function gridPalette(data) {
  const cfg = data.gridConfig || { size: "30x16", rows: 16, cols: 30, originRow: 0, originCol: 0 };
  if (cfg.size === "30x16") return PALETTE_30x16;
  // 12x8 subpaleta
  return buildSubPalette(cfg.originRow, cfg.originCol, cfg.rows, cfg.cols);
}

function generateColorGrid(data) {
  const cfg = data.gridConfig || { size: "30x16", rows: 16, cols: 30, originRow: 0, originCol: 0 };
  colorGrid.innerHTML = "";

  // clases de tamaño para centrar y escalar vía CSS
  colorGrid.classList.remove("grid-30x16", "grid-12x8");
  colorGrid.classList.add(cfg.size === "30x16" ? "grid-30x16" : "grid-12x8");

  colorGrid.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;

  const pal = gridPalette(data);
  const letters = currentLetters(data);

  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      const cell = document.createElement("div");
      cell.className = "color-cell";
      const hex = pal[r][c];
      cell.style.backgroundColor = hex;
      cell.dataset.x = c;
      cell.dataset.y = r;
      cell.dataset.coords = `${letters[r]}${c + 1}`;
      cell.title = cell.dataset.coords;
      colorGrid.appendChild(cell);
    }
  }
}

function renderBoard(data) {
  // limpiar marcadores y overlays
  document.querySelectorAll(".pawn-marker,.secret-color-highlight").forEach(el => el.remove());
  [box1, box2, box3].forEach(b => b.classList.add("hidden"));

  generateColorGrid(data);

  const cfg = data.gridConfig || { rows: 16, cols: 30, size: "30x16" };
  const cueGiverId = data.playerOrder[data.currentPlayerIndex];
  const isCueGiver = currentUserId === cueGiverId;

  // resaltar secreto solo al dador
  if (isCueGiver && data.currentCard && (data.gameState !== "scoring")) {
    const { x, y } = data.currentCard;
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if (cell) cell.classList.add("secret-color-highlight");
  }

  // dibujar peones en las elecciones visibles
  const drawPawn = (guess, player) => {
    const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`);
    if (!cell) return;
    const pawn = document.createElement("div");
    pawn.className = "pawn-marker";
    pawn.innerHTML = `
      <svg viewBox="0 0 64 64" class="pawn">
        <circle cx="32" cy="20" r="10" fill="${player.color}" stroke="white" stroke-width="3"/>
        <path d="M22 34h20c6 0 6 8 0 8H22c-6 0-6-8 0-8z" fill="${player.color}" stroke="white" stroke-width="3"/>
        <path d="M16 52h32v6H16z" fill="${player.color}" stroke="white" stroke-width="2"/>
        <circle cx="32" cy="20" r="10" fill="transparent" stroke="rgba(255,255,255,.6)" stroke-width="2"/>
      </svg>
      <span class="pawn-initial">${player.name.substring(0,1).toUpperCase()}</span>
    `;
    cell.appendChild(pawn);
  };

  if (data.guesses) {
    const showAll = (data.gameState === "scoring") || (data.gameState === "roundSummary") || (data.gameState === "gameOver") || isCueGiver;
    if (showAll) {
      Object.entries(data.guesses).forEach(([pid, arr]) => {
        const p = data.players[pid];
        arr.forEach(g => drawPawn(g, p));
      });
    } else {
      const me = data.players[currentUserId];
      (data.guesses[currentUserId] || []).forEach(g => drawPawn(g, me));
    }
  }

  // overlays puntuación si estamos en scoring
  if (data.gameState === "scoring" || data.gameState === "roundSummary" || data.gameState === "gameOver") {
    if (!data.currentCard) return;
    const { x, y } = data.currentCard;

    // medidas
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const gridRect = colorGrid.getBoundingClientRect();
    const cellW = rect.width, cellH = rect.height;
    const gap = 1;

    const placeBox = (size, el) => {
      if (!el) return;
      el.style.left = `${(gridRect.left - gridRect.left) + (x - Math.floor(size/2)) * (cellW + gap)}px`;
      el.style.top = `${(gridRect.top - gridRect.top) + (y - Math.floor(size/2)) * (cellH + gap)}px`;
      el.style.width = `${size * (cellW + gap) - gap}px`;
      el.style.height = `${size * (cellH + gap) - gap}px`;
      el.classList.remove("hidden");
    };

    if (cfg.size === "12x8") {
      // solo 3x3
      placeBox(3, box2);
    } else {
      placeBox(1, box3);
      placeBox(3, box2);
      placeBox(5, box1);
    }
  }
}

function renderGameInfo(data) {
  const info = document.getElementById("game-info");
  const giverId = data.playerOrder[data.currentPlayerIndex];
  const giver = data.players[giverId];
  const limits = data.gameSettings;

  let html = `<p><strong>Ronda:</strong> ${data.currentRound} / ${limits.roundLimit}</p>`;
  html += `<p><strong>Dador de pista:</strong> ${giver.name}</p>`;
  if (data.gameState === "choose_secret") {
    html += `<p class="text-cyan-400 font-semibold">El dador está eligiendo el color secreto</p>`;
  } else if (data.gameState.startsWith("giving_clue")) {
    html += `<p class="text-cyan-400 font-semibold">Esperando la pista del dador…</p>`;
  } else if (data.gameState.startsWith("guessing")) {
    const required = data.gameState === "guessing_1" ? 1 : 2;
    const pending = data.playerOrder
      .filter(pid => pid !== giverId)
      .filter(pid => (data.guesses[pid]?.length || 0) < required)
      .map(pid => data.players[pid].name);
    if (pending.length) {
      html += `<p class="text-yellow-400 font-semibold">Turno de: ${pending.join(", ")}</p>`;
    } else {
      html += `<p class="text-gray-400">Todos han elegido</p>`;
    }
  } else if (data.gameState === "scoring") {
    html += `<p class="text-green-400 font-semibold">Puntuando…</p>`;
  }
  info.innerHTML = html;

  // clues arriba del tablero
  document.getElementById("clue-display").innerHTML =
    (data.clues || []).map((c) => `<span>${c}</span>`).join("");

  // Vista del dador, muestras y pista
  const isGiver = currentUserId === giverId;
  if (isGiver && data.gameState !== "scoring" && data.gameState !== "roundSummary" && data.gameState !== "gameOver") {
    cueGiverView.classList.remove("hidden");
    if (data.currentCard) {
      secretColorDisplay.style.background = data.currentCard.color;
      secretColorCoords.textContent = `${currentLetters(data)[data.currentCard.y]}${data.currentCard.x + 1}`;
    } else {
      secretColorDisplay.style.background = "transparent";
      secretColorCoords.textContent = "";
    }

    if (data.gameState === "choose_secret") {
      clueForm.classList.add("hidden");
      renderCandidateSwatches(data);
    } else {
      candidateSwatches.innerHTML = "";
      clueForm.classList.remove("hidden");
    }
  } else {
    cueGiverView.classList.add("hidden");
  }
}

function renderControls(data) {
  const container = document.getElementById("controls");
  container.innerHTML = "";
  const giverId = data.playerOrder[data.currentPlayerIndex];
  const isGiver = currentUserId === giverId;

  if (isGiver) {
    if (data.gameState === "guessing_1" || data.gameState === "guessing_2") {
      // botón Revelar si todos eligieron
      const guessers = data.playerOrder.filter(id => id !== giverId);
      const req = data.gameState === "guessing_1" ? 1 : 2;
      const all = guessers.every(id => (data.guesses[id]?.length || 0) >= req);
      if (all) {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.textContent = "Revelar color";
        btn.onclick = reveal;
        container.appendChild(btn);
      } else {
        container.innerHTML = `<p class="text-gray-400">Esperando que los demás elijan…</p>`;
      }
    } else if (data.gameState === "choose_secret") {
      container.innerHTML = `<p class="text-gray-400">Elige una de las 4 muestras para definir el color secreto.</p>`;
    }
  } else {
    // jugadores no dadores
    if (data.gameState.startsWith("guessing")) {
      container.innerHTML = `<p class="text-gray-300">Selecciona un color en el tablero.</p>`;
    } else if (data.gameState === "choose_secret") {
      container.innerHTML = `<p class="text-gray-400">El dador está eligiendo el color secreto…</p>`;
    } else {
      container.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`;
    }
  }
}

// =========================
// Muestras aleatorias para el dador
// =========================
function renderCandidateSwatches(data) {
  const cfg = data.gridConfig;
  const pal = gridPalette(data);
  const picks = new Set();
  while (picks.size < 4) {
    const r = Math.floor(Math.random() * cfg.rows);
    const c = Math.floor(Math.random() * cfg.cols);
    picks.add(`${r},${c}`);
  }
  candidateSwatches.innerHTML = "";
  picks.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    const hex = pal[r][c];
    const btn = document.createElement("button");
    btn.className = "swatch-btn";
    btn.style.background = hex;
    btn.title = `${currentLetters(data)[r]}${c + 1}`;
    btn.addEventListener("click", async () => {
      // fijar color secreto y pasar a dar pista
      const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
      await updateDoc(gameRef, {
        currentCard: { x: c, y: r, color: hex },
        gameState: "giving_clue_1"
      });
    });
    candidateSwatches.appendChild(btn);
  });
}

// =========================
/* Pistas */
// =========================
const FORBIDDEN_WORDS = [
  "rojo","verde","azul","amarillo","naranja","morado","violeta","rosa","marrón",
  "negro","blanco","gris","cian","magenta","turquesa","lila","fucsia","celeste",
  "índigo","añil","purpura","escarlata","carmín","granate","oliva","esmeralda",
  "zafiro","cobalto","ocre","siena","beis","beige","crema","dorado","plateado",
  "bronce","cobre","color","tono","matiz","claro","oscuro","brillante","pálido",
  "aguamarina","coral","lavanda","malva","salmón","terracota","caqui"
];

document.getElementById("submit-clue-btn")?.addEventListener("click", submitClue);

async function submitClue() {
  const text = clueInput.value.trim();
  if (!text) return;
  const word = text.split(" ")[0].toLowerCase();
  if (FORBIDDEN_WORDS.includes(word)) {
    alert(`La palabra "${word}" no está permitida`);
    return;
  }
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const clues = [...(data.clues || []), word];
  await updateDoc(gameRef, { clues, gameState: "guessing_1" });
  clueInput.value = "";
}

// =========================
// Click en tablero (elegir color)
// =========================
colorGrid.addEventListener("click", handleGridClick);

async function handleGridClick(e) {
  const cell = e.target.closest(".color-cell");
  if (!cell) return;

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const giverId = data.playerOrder[data.currentPlayerIndex];
  if (currentUserId === giverId) return; // dador no elige aquí

  const myGuesses = data.guesses?.[currentUserId] || [];
  const can =
    (data.gameState === "guessing_1" && myGuesses.length === 0) ||
    (data.gameState === "guessing_2" && myGuesses.length === 1);
  if (!can) return;

  const x = parseInt(cell.dataset.x, 10);
  const y = parseInt(cell.dataset.y, 10);

  const updated = { ...data.guesses, [currentUserId]: [...myGuesses, { x, y }] };
  await updateDoc(gameRef, { guesses: updated });

  // pasar a segunda pista si todos eligieron
  const guessers = data.playerOrder.filter(id => id !== giverId);
  const required = data.gameState === "guessing_1" ? 1 : 2;
  const all = guessers.every(id => (updated[id]?.length || 0) >= required);
  if (all && data.gameState === "guessing_1") {
    await updateDoc(gameRef, { gameState: "giving_clue_2" });
  }
}

// =========================
// Revelar y puntuar
// =========================
async function reveal() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  await updateDoc(gameRef, { gameState: "scoring" });
  setTimeout(calculateAndShowScores, 1200);
}

async function calculateAndShowScores() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  const { x: tx, y: ty } = data.currentCard;
  const giverId = data.playerOrder[data.currentPlayerIndex];

  const updatedPlayers = JSON.parse(JSON.stringify(data.players));
  const roundPoints = {};
  Object.keys(updatedPlayers).forEach(pid => roundPoints[pid] = { name: updatedPlayers[pid].name, points: 0 });

  let cueGiverPoints = 0;

  Object.entries(data.guesses).forEach(([pid, arr]) => {
    let pRound = 0;
    arr.forEach(g => {
      const dx = Math.abs(g.x - tx);
      const dy = Math.abs(g.y - ty);
      let pts = 0;
      if (dx === 0 && dy === 0) pts = 3;
      else if (dx <= 1 && dy <= 1) pts = 2;
      else if (dx <= 2 && dy <= 2) pts = 1;
      pRound += pts;

      if (pid !== giverId && dx <= 1 && dy <= 1) cueGiverPoints++;
    });
    updatedPlayers[pid].score += pRound;
    roundPoints[pid].points = pRound;
  });

  updatedPlayers[giverId].score += cueGiverPoints;
  roundPoints[giverId].points = cueGiverPoints;

  await updateDoc(gameRef, { players: updatedPlayers, lastRoundSummary: roundPoints });

  const winner = Object.values(updatedPlayers).find(p => p.score >= (data.gameSettings.scoreLimit || DEFAULT_SCORE_LIMIT));
  const roundLimitReached = data.currentRound >= data.gameSettings.roundLimit;

  if (winner || roundLimitReached) {
    await updateDoc(gameRef, { gameState: "gameOver" });
  } else {
    await updateDoc(gameRef, { gameState: "roundSummary" });
  }
}

// =========================
// Resumen, siguiente ronda
// =========================
document.getElementById("next-round-btn").addEventListener("click", async () => {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  // siguiente jugador
  const nextIdx = (data.currentPlayerIndex + 1) % data.playerOrder.length;
  const nextRound = nextIdx === 0 ? data.currentRound + 1 : data.currentRound;

  // recalcular grid pequeño si corresponde
  const gs = data.gameSettings.gridSize || "30x16";
  const { rows, cols } = GRID_SIZES[gs];
  let originRow = 0, originCol = 0;
  if (gs === "12x8") {
    originRow = Math.floor(Math.random() * (16 - rows + 1));
    originCol = Math.floor(Math.random() * (30 - cols + 1));
  }
  const gridConfig = { size: gs, rows, cols, originRow, originCol };

  await updateDoc(gameRef, {
    gameState: "choose_secret",
    currentRound: nextRound,
    currentPlayerIndex: nextIdx,
    gridConfig,
    currentCard: null,
    clues: [],
    guesses: {}
  });

  roundSummaryModal.classList.add("hidden");
});

function showGameOver(data) {
  document.getElementById("winner-name").textContent =
    data.playerOrder.reduce((a, b) => data.players[a].score > data.players[b].score ? a : b);
  gameOverModal.classList.remove("hidden");
}

async function restartGame() {
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  if (currentUserId !== data.hostId) { alert("Solo el anfitrión puede reiniciar"); return; }

  const resetPlayers = {};
  data.playerOrder.forEach(pid => resetPlayers[pid] = { ...data.players[pid], score: 0 });
  await updateDoc(gameRef, { players: resetPlayers, gameState: "waiting" });
  gameOverModal.classList.add("hidden");
}

// =========================
// Inicialización UI mínima
// =========================
function renderTitle(data) {
  const title = document.getElementById("game-title");
  const names = data.playerOrder.map(pid => data.players[pid].name);
  title.textContent = names.length === 2 ? `${names[0]} vs ${names[1]}` : "Partida grupal";
}

// Integrar renderTitle dentro de updateUI
const _origUpdateUI = updateUI;
updateUI = function(data) {
  _origUpdateUI.call(this, data);
  if (data && data.players) renderTitle(data);
};
