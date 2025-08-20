// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

/* =========================
   CONFIGURACIÓN FIREBASE
========================= */
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

/* =========================
   CONSTANTES Y ESTADO
========================= */
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
let temporaryGuess = null;

const GRID_FULL = { cols: 30, rows: 16 }; // 30x16
const GRID_SMALL = { cols: 12, rows: 8 }; // 12x8

// letras A..P
const COORD_LETTERS = "ABCDEFGHIJKLMNOP".split("");

// límite de jugadores y puntos
const MAX_PLAYERS = 10;
const DEFAULT_SCORE_LIMIT = 25;

// Colores jugadores (hasta 10)
const playerColors = [
  "#E53E3E", "#DD6B20", "#D69E2E", "#38A169", "#3182CE",
  "#5A67D8", "#805AD5", "#D53F8C", "#718096", "#4A5568"
];

// Paleta exacta 30x16 dada por el usuario (A..P, 30 columnas)
// Para brevedad del comentario, está resumida aquí. No modificar el orden.
const COLOR_TABLE = [
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

/* =========================
   UTILIDADES DOM
========================= */
const $ = (id) => document.getElementById(id);
const lobbyScreen = $("lobby-screen");
const waitingRoomScreen = $("waiting-room-screen");
const gameScreen = $("game-screen");
const colorGrid = $("color-grid");
const roundSummaryModal = $("round-summary-modal");
const gameOverModal = $("game-over-modal");
const confirmLeaveModal = $("confirm-leave-modal");
const soundToggle = $("sound-toggle");

function showScreen(name) {
  lobbyScreen.classList.add("hidden");
  waitingRoomScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  $(`${name}-screen`).classList.remove("hidden");
}

/* =========================
   AUDIO SIMPLE
========================= */
let isMuted = true;
const clickSynth = new Tone.Synth({ oscillator: { type: "sine" } }).toDestination();
clickSynth.volume.value = -10;
const soundIcons = {
  muted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5"><path d="M12 4 7 8H4v8h3l5 4zM16 8l5 8"/></svg>`,
  unmuted: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="1.5"><path d="M12 4 7 8H4v8h3l5 4z"/><path d="M16 8a6 6 0 010 8M18 6a9 9 0 010 12"/></svg>`
};
function playClick() { if (!isMuted) clickSynth.triggerAttackRelease("C5","16n"); }
soundToggle.onclick = () => {
  Tone.start();
  isMuted = !isMuted;
  soundToggle.innerHTML = isMuted ? soundIcons.muted : soundIcons.unmuted;
};
soundToggle.innerHTML = soundIcons.muted;

/* =========================
   AUTENTICACIÓN
========================= */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid;
    const last = JSON.parse(localStorage.getItem("hues-cues-game"));
    if (last?.gameId && last?.userId) rejoinGame(last.gameId, last.userId);
  } else {
    try { await signInAnonymously(auth); } catch(e){ console.error(e); }
  }
});

/* =========================
   LOBBY
========================= */
$("create-game-btn").onclick = () => { playClick(); createGame(); };
$("join-game-btn").onclick   = () => { playClick(); joinGame(); };
$("start-game-btn").onclick  = () => { playClick(); startGame(); };
$("exit-lobby-btn").onclick  = () => { playClick(); executeLeave(); };
$("leave-game-btn").onclick  = () => { playClick(); confirmLeaveModal.classList.remove("hidden"); };
$("cancel-leave-btn").onclick= () => { playClick(); confirmLeaveModal.classList.add("hidden"); };
$("confirm-leave-btn").onclick = () => { playClick(); executeLeave(); };
$("new-game-btn").onclick    = () => { playClick(); restartGame(); };
$("next-round-btn").onclick  = () => { playClick(); gotoNextRound(); };
$("game-id-display").onclick = () => {
  navigator.clipboard.writeText($("game-id-display").textContent);
};

function getPlayerName() {
  const n = $("player-name").value.trim();
  if (!n) { $("lobby-error").textContent = "Por favor, introduce tu nombre."; return null; }
  return n;
}

async function createGame() {
  const name = getPlayerName(); if (!name || !currentUserId) return;

  const gameId = Math.random().toString(36).substring(2,7).toUpperCase();
  currentGameId = gameId;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);

  const newPlayer = { name, color: playerColors[0], score: 0, isHost: true };
  const gameData = {
    hostId: currentUserId,
    players: { [currentUserId]: newPlayer },
    playerOrder: [currentUserId],
    gameState: "waiting",
    gameSettings: {
      roundLimit: 10,
      scoreLimit: DEFAULT_SCORE_LIMIT,
      gridSize: "30x16" // por defecto
    },
    createdAt: new Date()
  };

  await setDoc(gameRef, gameData);
  localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: currentUserId }));
  subscribeToGame(gameId);
  showScreen("waiting-room");
}

async function joinGame() {
  const name = getPlayerName(); if (!name || !currentUserId) return;
  const gameId = $("join-game-id").value.trim().toUpperCase();
  if (!gameId) { $("lobby-error").textContent = "Introduce un código."; return; }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) { $("lobby-error").textContent = "Partida no encontrada."; return; }
  const data = snap.data();

  if (Object.keys(data.players).length >= MAX_PLAYERS) { $("lobby-error").textContent = "La partida está llena."; return; }

  if (data.gameState !== "waiting") {
    const found = Object.entries(data.players).find(([id,p]) => p.name === name);
    if (found) {
      const existingId = found[0];
      localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: existingId }));
      rejoinGame(gameId, existingId);
      return;
    }
    $("lobby-error").textContent = "La partida ya ha comenzado.";
    return;
  }

  const newColor = playerColors[Object.keys(data.players).length];
  const newPlayer = { name, color: newColor, score: 0, isHost: false };

  await updateDoc(gameRef, {
    players: { ...data.players, [currentUserId]: newPlayer },
    playerOrder: [...data.playerOrder, currentUserId]
  });

  localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: currentUserId }));
  currentGameId = gameId;
  subscribeToGame(gameId);
  showScreen("waiting-room");
}

async function rejoinGame(gameId, userId) {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  const snap = await getDoc(gameRef);
  if (snap.exists()) {
    currentGameId = gameId;
    currentUserId = userId;
    subscribeToGame(gameId);
  } else {
    localStorage.removeItem("hues-cues-game");
  }
}

function subscribeToGame(gameId) {
  if (unsubscribeGame) unsubscribeGame();
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  unsubscribeGame = onSnapshot(gameRef, (d) => {
    if (!d.exists()) { localStorage.removeItem("hues-cues-game"); alert("El anfitrión terminó la partida."); executeLeave(); return; }
    updateUI(d.data());
  });
}

async function executeLeave() {
  if (unsubscribeGame) unsubscribeGame();

  if (currentGameId) {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const snap = await getDoc(gameRef);
    if (snap.exists()) {
      const data = snap.data();
      if (currentUserId === data.hostId) {
        await deleteDoc(gameRef);
      }
    }
  }

  localStorage.removeItem("hues-cues-game");
  currentGameId = null;
  confirmLeaveModal.classList.add("hidden");
  showScreen("lobby");
}

/* =========================
   TABLERO Y PALETA
========================= */
function getHexAt(y, x) { // y: 0..15, x: 0..29
  return COLOR_TABLE[y][x];
}

function gridSpecFromSetting(setting) {
  return setting === "12x8" ? GRID_SMALL : GRID_FULL;
}

function buildGrid(gameData) {
  const setting = gameData.gameSettings?.gridSize || "30x16";
  const spec = gridSpecFromSetting(setting);

  // Si hay recorte (12x8), vendrá guardado en currentCrop {rowStart, colStart}
  const crop = gameData.currentCrop || { rowStart: 0, colStart: 0 };

  colorGrid.innerHTML = "";
  colorGrid.style.setProperty("--grid-cols", spec.cols);
  colorGrid.style.gridTemplateColumns = `repeat(${spec.cols}, 1fr)`;

  for (let vy = 0; vy < spec.rows; vy++) {
    for (let vx = 0; vx < spec.cols; vx++) {
      const realY = crop.rowStart + vy;
      const realX = crop.colStart + vx;

      const hex = getHexAt(realY, realX);
      const cell = document.createElement("div");
      cell.className = "color-cell";
      cell.style.backgroundColor = hex;

      // guardamos coords reales para puntuación
      cell.dataset.x = realX;
      cell.dataset.y = realY;
      cell.dataset.coords = `${COORD_LETTERS[realY]}${realX + 1}`;
      cell.title = cell.dataset.coords;

      colorGrid.appendChild(cell);
    }
  }
}

/* =========================
   UI PRINCIPAL
========================= */
function updateUI(gameData) {
  const inWaiting = gameData.gameState === "waiting";
  if (inWaiting) {
    showScreen("waiting-room");
    $("game-id-display").textContent = currentGameId;

    const list = $("player-list");
    list.innerHTML = "";
    gameData.playerOrder.forEach(pid => {
      const p = gameData.players[pid];
      const li = document.createElement("li");
      li.className = "flex items-center";
      li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2 border border-gray-400" style="background:${p.color}"></div>${p.name}${p.isHost ? " (Host)":""}`;
      list.appendChild(li);
    });

    // opciones host
    const isHost = gameData.hostId === currentUserId;
    $("game-options").classList.toggle("hidden", !isHost);
    $("start-game-btn").style.display = isHost ? "block" : "none";

    if (isHost) {
      $("round-limit").value = gameData.gameSettings.roundLimit;
      $("score-limit").value = gameData.gameSettings.scoreLimit;
      $("grid-size-select").value = gameData.gameSettings.gridSize || "30x16";
      $("game-limits-display").classList.add("hidden");
    } else {
      const limits = $("game-limits-display");
      limits.textContent = `Jugar a ${gameData.gameSettings.roundLimit} rondas o ${gameData.gameSettings.scoreLimit} puntos.`;
      limits.classList.remove("hidden");
    }
    return;
  }

  // En partida
  showScreen("game");
  renderHeader(gameData);
  buildGrid(gameData);
  renderBoard(gameData);
  renderControls(gameData);
}

function renderHeader(gameData) {
  const title = $("game-title");
  const names = gameData.playerOrder.map(pid => gameData.players[pid].name);
  title.textContent = names.length === 2 ? `${names[0]} vs ${names[1]}` : "Partida Grupal";

  // info
  const info = $("game-info");
  const cueId = gameData.playerOrder[gameData.currentPlayerIndex];
  const cue = gameData.players[cueId];
  let html = `<p><strong>Ronda:</strong> ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}</p>`;
  html += `<p><strong>Dador de pista:</strong> ${cue.name}</p>`;

  if (gameData.gameState.includes("giving_clue")) {
    html += `<p class="text-cyan-400 font-semibold">Esperando pista de ${cue.name}...</p>`;
  } else if (gameData.gameState.includes("guessing")) {
    const required = gameData.gameState === "guessing_1" ? 1 : 2;
    const need = gameData.playerOrder
      .filter(id => id !== cueId)
      .filter(id => (gameData.guesses?.[id]?.length || 0) < required)
      .map(id => gameData.players[id].name);
    html += need.length
      ? `<p class="text-yellow-400 font-semibold">Turno de adivinar de:<br>${need.join(", ")}</p>`
      : `<p class="text-gray-400 font-semibold">Todos han adivinado.</p>`;
  } else if (gameData.gameState === "scoring") {
    html += `<p class="text-green-400 font-semibold">Puntuando...</p>`;
  }

  // puntuaciones
  info.innerHTML = html;

  const scores = $("player-scores");
  scores.innerHTML = "";
  gameData.playerOrder.forEach(pid => {
    const p = gameData.players[pid];
    const row = document.createElement("div");
    row.className = "flex justify-between items-center p-2 rounded-md";
    row.innerHTML = `
      <div class="flex items-center">
        <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background:${p.color}"></div>
        <span class="font-medium">${p.name}</span>
      </div>
      <span class="font-bold text-lg">${p.score}</span>`;
    scores.appendChild(row);
  });

  // vista dador (cuadro superior)
  const cueView = $("cue-giver-view");
  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
  const isCue = currentUserId === cueGiverId && gameData.gameState !== "scoring" && gameData.gameState !== "roundSummary" && gameData.gameState !== "gameOver";

  if (isCue) {
    cueView.classList.remove("hidden");
    const disp = $("secret-color-display");
    const coords = $("secret-color-coords");

    if (gameData.currentCard) {
      disp.style.background = gameData.currentCard.color;
      coords.textContent = `${COORD_LETTERS[gameData.currentCard.y]}${gameData.currentCard.x+1}`;
    } else {
      disp.style.background = "transparent";
      coords.textContent = "";
    }

    // cambiar texto botón pista según estado
    setClueButtonLabel(gameData.gameState);
  } else {
    cueView.classList.add("hidden");
  }

  // pistas mostradas
  $("clue-display").innerHTML = (gameData.clues || []).map(c => `<span>${c}</span>`).join("");
}

function setClueButtonLabel(state) {
  const btn = $("submit-clue-btn");
  if (!btn) return;
  btn.textContent = state === "giving_clue_2" ? "Dar Pista 2" : "Dar Pista 1";
}

function renderBoard(gameData) {
  // limpiar marcadores y resaltados previos
  document.querySelectorAll(".player-marker, .temp-marker, .secret-color-highlight, .pawn-marker").forEach(el => el.remove());
  document.querySelectorAll(".scoring-overlay").forEach(el => el.classList.add("hidden"));

  const cueId = gameData.playerOrder[gameData.currentPlayerIndex];
  const isCue = currentUserId === cueId;

  // resaltar color secreto al dador
  if (isCue && gameData.currentCard && (gameData.gameState !== "scoring")) {
    const { x, y } = gameData.currentCard;
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if (cell) cell.classList.add("secret-color-highlight");
  }

  // función para pintar marcador según dispositivo
  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  const drawMarker = (guess, player, isTemp = false) => {
    const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`);
    if (!cell) return;
    let marker;
    if (isMobile) {
      marker = document.createElement("div");
      marker.className = isTemp ? "player-marker temp-marker" : "player-marker";
      marker.style.backgroundColor = player.color;
      marker.textContent = player.name.substring(0,1).toUpperCase();
    } else {
      marker = document.createElement("div");
      marker.className = "pawn-marker";
      marker.innerHTML = `
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="20" r="10" fill="${player.color}"></circle>
          <path d="M16 52h32c0-10-6-16-16-16s-16 6-16 16z" fill="${player.color}"></path>
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="#ffffff" opacity="0.25"></ellipse>
        </svg>`;
    }
    cell.appendChild(marker);
  };

  // mostrar adivinanzas
  if (gameData.guesses) {
    if (gameData.gameState === "scoring" || gameData.gameState === "gameOver" || gameData.gameState === "roundSummary" || isCue) {
      Object.entries(gameData.guesses).forEach(([pid, guesses]) => {
        const p = gameData.players[pid];
        guesses.forEach(g => drawMarker(g, p, false));
      });
    } else {
      const mine = gameData.guesses[currentUserId] || [];
      const me = gameData.players[currentUserId];
      mine.forEach(g => drawMarker(g, me, false));
    }
  }

  if (temporaryGuess) {
    const me = gameData.players[currentUserId];
    drawMarker(temporaryGuess, me, true);
  }

  // overlys de puntuación durante "scoring"
  if (gameData.gameState === "scoring" || gameData.gameState === "roundSummary" || gameData.gameState === "gameOver") {
    const { x, y } = gameData.currentCard;
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const gridRect = colorGrid.getBoundingClientRect();
    const cellW = rect.width, cellH = rect.height;
    const gap = 1;

    function drawBox(size, id, show=true) {
      const box = $(id); if (!box) return;
      if (!show) { box.classList.add("hidden"); return; }
      const left = (x - Math.floor(size/2)) * (cellW + gap);
      const top  = (y - Math.floor(size/2)) * (cellH + gap);
      box.style.left = `${left}px`;
      box.style.top = `${top}px`;
      box.style.width = `${size * (cellW + gap) - gap}px`;
      box.style.height = `${size * (cellH + gap) - gap}px`;
      box.classList.remove("hidden");
    }

    const small = (gameData.gameSettings.gridSize === "12x8");
    // Para 12x8 dejamos solo la amarilla 3x3
    drawBox(1, "scoring-box-3", !small); // blanco
    drawBox(3, "scoring-box-2", true);   // amarillo
    drawBox(5, "scoring-box-1", !small); // rojo
  }
}

function renderControls(gameData) {
  const controls = $("controls");
  controls.innerHTML = "";

  const cueId = gameData.playerOrder[gameData.currentPlayerIndex];
  const isCue = currentUserId === cueId;

  // Vista dador: ya la manejamos en encabezado, aquí solo gestionamos eventos del formulario
  if (isCue) {
    const btn = $("submit-clue-btn");
    if (btn) {
      btn.onclick = () => submitClue(gameData.gameState === "giving_clue_1" ? 1 : 2);
      setClueButtonLabel(gameData.gameState);
    }
  } else {
    // jugador normal
    const myGuesses = gameData.guesses?.[currentUserId] || [];
    const canGuessNow = (gameData.gameState === "guessing_1" && myGuesses.length === 0) ||
                        (gameData.gameState === "guessing_2" && myGuesses.length === 1);

    if (temporaryGuess) {
      const tempColor = colorGrid.querySelector(`[data-x='${temporaryGuess.x}'][data-y='${temporaryGuess.y}']`)?.style?.backgroundColor || "";
      controls.innerHTML = `
        <div class="flex items-center justify-center gap-4">
          <div class="color-preview" style="background:${tempColor}"></div>
          <button id="confirm-guess-btn" class="btn-primary">Confirmar elección</button>
        </div>`;
      $("confirm-guess-btn").onclick = confirmGuess;
    } else if (canGuessNow) {
      controls.innerHTML = `<p class="text-gray-300">Selecciona un color en el tablero.</p>`;
    } else {
      controls.innerHTML = `<p class="text-gray-500">Espera tu turno o la siguiente pista.</p>`;
    }
  }
}

/* =========================
   INTERACCIÓN TABLERO
========================= */
colorGrid.addEventListener("click", async (e) => {
  const cell = e.target.closest(".color-cell");
  if (!cell) return;

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const data = snap.data();

  const cueId = data.playerOrder[data.currentPlayerIndex];
  if (currentUserId === cueId) return; // dador no adivina

  const myGuesses = data.guesses?.[currentUserId] || [];
  const canGuessNow = (data.gameState === "guessing_1" && myGuesses.length === 0) ||
                      (data.gameState === "guessing_2" && myGuesses.length === 1);
  if (!canGuessNow) return;

  playClick();
  temporaryGuess = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) };
  renderBoard(data);
  renderControls(data);
});

async function confirmGuess() {
  if (!temporaryGuess) return;

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  const myGuesses = data.guesses?.[currentUserId] || [];
  const updatedGuesses = {
    ...data.guesses,
    [currentUserId]: [...myGuesses, temporaryGuess]
  };

  temporaryGuess = null;
  await updateDoc(gameRef, { guesses: updatedGuesses });

  const cueId = data.playerOrder[data.currentPlayerIndex];
  const guessers = data.playerOrder.filter(id => id !== cueId);
  const required = data.gameState === "guessing_1" ? 1 : 2;
  const all = guessers.every(id => (updatedGuesses[id]?.length || 0) >= required);

  if (all && data.gameState === "guessing_1") {
    await updateDoc(gameRef, { gameState: "giving_clue_2" });
  }
}

/* =========================
   PISTAS Y COLOR SECRETO
========================= */
const FORBIDDEN = [
  "rojo","verde","azul","amarillo","naranja","morado","violeta","rosa","marrón",
  "negro","blanco","gris","cian","magenta","turquesa","lila","fucsia","celeste",
  "índigo","añil","purpura","escarlata","carmín","granate","oliva","esmeralda",
  "zafiro","cobalto","ocre","siena","beis","beige","crema","dorado","plateado",
  "bronce","cobre","color","tono","matiz","claro","oscuro","brillante","pálido",
  "aguamarina","coral","lavanda","malva","salmón","terracota","caqui"
];

$("clue-input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("submit-clue-btn").click(); }
});

async function submitClue(n) {
  const input = $("clue-input");
  let word = (input.value || "").trim();
  const first = word.split(" ")[0].toLowerCase();
  if (!first) return;

  if (FORBIDDEN.includes(first)) {
    alert(`La palabra "${first}" no está permitida. Usa una pista que no sea un color.`);
    input.value = "";
    return;
  }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  await updateDoc(gameRef, {
    clues: [...(data.clues || []), first],
    gameState: n === 1 ? "guessing_1" : "guessing_2"
  });

  input.value = "";
}

$("candidate-swatches")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-x]");
  if (!btn) return;

  const x = parseInt(btn.dataset.x);
  const y = parseInt(btn.dataset.y);
  const color = getHexAt(y, x);

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  await updateDoc(gameRef, {
    currentCard: { x, y, color }
  });
});

/* =========================
   INICIO PARTIDA / RONDAS
========================= */
async function startGame() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.hostId !== currentUserId) { alert("Solo el creador puede empezar."); return; }
  if (Object.keys(data.players).length < 2) { alert("Se necesitan al menos 2 jugadores."); return; }

  const gridSetting = $("grid-size-select").value || "30x16";
  const crop = gridSetting === "12x8"
    ? randomCrop(GRID_FULL, GRID_SMALL)
    : { rowStart: 0, colStart: 0 };

  await updateDoc(gameRef, {
    gameSettings: {
      ...data.gameSettings,
      gridSize: gridSetting
    },
    currentCrop: crop,
    gameState: "giving_clue_1",
    currentRound: 1,
    currentPlayerIndex: 0,
    currentCard: null, // se elige de las 4
    clues: [],
    guesses: {},
    candidateColors: randomCandidates(crop, gridSetting)
  });
}

/** recorte aleatorio para 12x8 */
function randomCrop(full, small) {
  const rowStart = Math.floor(Math.random() * (full.rows - small.rows + 1));
  const colStart = Math.floor(Math.random() * (full.cols - small.cols + 1));
  return { rowStart, colStart };
}

/** 4 candidatos aleatorios sobre el tablero visible */
function randomCandidates(crop, gridSetting) {
  const spec = gridSpecFromSetting(gridSetting);
  const set = new Set();
  while (set.size < 4) {
    const vy = Math.floor(Math.random() * spec.rows);
    const vx = Math.floor(Math.random() * spec.cols);
    const y = crop.rowStart + vy;
    const x = crop.colStart + vx;
    set.add(`${y},${x}`);
  }
  return Array.from(set).map(s => {
    const [y,x] = s.split(",").map(Number);
    return { x, y, color: getHexAt(y,x) };
  });
}

function renderCandidates(gameData) {
  const wrap = $("candidate-swatches");
  if (!wrap) return;
  wrap.innerHTML = "";
  const cueId = gameData.playerOrder[gameData.currentPlayerIndex];
  const isCue = currentUserId === cueId;

  if (!isCue || !gameData.candidateColors || gameData.candidateColors.length === 0) return;

  gameData.candidateColors.forEach(c => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = c.color;
    b.dataset.x = c.x;
    b.dataset.y = c.y;
    wrap.appendChild(b);
  });
}

/* =========================
   PUNTUACIÓN / RESÚMENES
========================= */
async function reveal() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  await updateDoc(gameRef, { gameState: "scoring" });
  setTimeout(calculateAndShowScores, 1200);
}

async function calculateAndShowScores() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  const { x: targetX, y: targetY } = data.currentCard;
  const cueId = data.playerOrder[data.currentPlayerIndex];
  let cuePoints = 0;
  const roundPoints = {};
  const updatedPlayers = JSON.parse(JSON.stringify(data.players));

  Object.keys(updatedPlayers).forEach(pid => roundPoints[pid] = { name: updatedPlayers[pid].name, points: 0 });

  Object.entries(data.guesses || {}).forEach(([pid, guesses]) => {
    let pRound = 0;
    guesses.forEach(g => {
      const dx = Math.abs(g.x - targetX);
      const dy = Math.abs(g.y - targetY);
      let pts = 0;
      if (dx === 0 && dy === 0) pts = 3;
      else if (dx <= 1 && dy <= 1) pts = 2;
      else if (dx <= 2 && dy <= 2) pts = 1;
      pRound += pts;
      if (pid !== cueId && dx <= 1 && dy <= 1) cuePoints++;
    });
    updatedPlayers[pid].score += pRound;
    roundPoints[pid].points = pRound;
  });

  updatedPlayers[cueId].score += cuePoints;
  roundPoints[cueId].points = cuePoints;

  await updateDoc(gameRef, { players: updatedPlayers, lastRoundSummary: roundPoints });

  const winner = Object.values(updatedPlayers).find(p => p.score >= data.gameSettings.scoreLimit);
  const roundLimitReached = data.currentRound >= data.gameSettings.roundLimit;

  if (winner || roundLimitReached) {
    await updateDoc(gameRef, { gameState: "gameOver" });
    showGameOver({ players: updatedPlayers, playerOrder: data.playerOrder });
  } else {
    await updateDoc(gameRef, { gameState: "roundSummary" });
    showRoundSummary({ lastRoundSummary: roundPoints, currentRound: data.currentRound, gameSettings: data.gameSettings });
  }
}

function showRoundSummary(data) {
  $("summary-title").textContent = `Fin de la Ronda ${data.currentRound} / ${data.gameSettings.roundLimit}`;
  const content = $("summary-content");
  content.innerHTML = Object.values(data.lastRoundSummary).map(p => `<p><strong>${p.name}:</strong> +${p.points} puntos</p>`).join("");
  roundSummaryModal.classList.remove("hidden");
}

async function gotoNextRound() {
  roundSummaryModal.classList.add("hidden");

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  const nextIdx = (data.currentPlayerIndex + 1) % data.playerOrder.length;
  const nextRound = nextIdx === 0 ? data.currentRound + 1 : data.currentRound;

  const gridSetting = data.gameSettings.gridSize || "30x16";
  const crop = gridSetting === "12x8" ? randomCrop(GRID_FULL, GRID_SMALL) : { rowStart: 0, colStart: 0 };

  await updateDoc(gameRef, {
    gameState: "giving_clue_1",
    currentRound: nextRound,
    currentPlayerIndex: nextIdx,
    currentCard: null,
    clues: [],
    guesses: {},
    currentCrop: crop,
    candidateColors: randomCandidates(crop, gridSetting)
  });
}

function showGameOver(data) {
  const winnerId = data.playerOrder.reduce((a,b) => data.players[a].score > data.players[b].score ? a : b);
  $("winner-name").textContent = data.players[winnerId].name;
  gameOverModal.classList.remove("hidden");

  const canvas = $("confetti-canvas");
  const myConfetti = confetti.create(canvas, { resize: true });
  myConfetti({ particleCount: 200, spread: 160, origin: { y: 0.6 } });
}

async function restartGame() {
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  if (currentUserId !== data.hostId) { alert("Solo el anfitrión puede reiniciar la partida."); return; }

  const resetPlayers = {};
  data.playerOrder.forEach(pid => resetPlayers[pid] = { ...data.players[pid], score: 0 });

  await updateDoc(gameRef, { players: resetPlayers, gameState: "waiting" });
  gameOverModal.classList.add("hidden");
}

/* =========================
   EVENTOS OPCIONES HOST
========================= */
$("round-limit").addEventListener("change", (e) => updateSettings({ roundLimit: parseInt(e.target.value || "10", 10) }));
$("score-limit").addEventListener("change", (e) => updateSettings({ scoreLimit: parseInt(e.target.value || `${DEFAULT_SCORE_LIMIT}`, 10) }));
$("grid-size-select").addEventListener("change", (e) => updateSettings({ gridSize: e.target.value }));

async function updateSettings(newSet) {
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  await updateDoc(gameRef, { gameSettings: { ...data.gameSettings, ...newSet } });
}

/* =========================
   INICIALIZACIÓN
========================= */
function initialRender() {
  // nada más cargar, por si hay algo pendiente
}
initialRender();
renderCandidates({}); // no muestra nada si no es dador

// Redibuja candidatos cuando cambie el estado
document.addEventListener("visibilitychange", async () => {
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if (snap.exists()) renderCandidates(snap.data());
});

/* Hook dentro de updateUI para candidatos */
const _origUpdateUI = updateUI;
updateUI = function(g) {
  _origUpdateUI(g);
  renderCandidates(g);
  if (g.gameState === "gameOver") showGameOver(g); // por si entra directo
  if (g.gameState === "roundSummary") showRoundSummary(g);
};
