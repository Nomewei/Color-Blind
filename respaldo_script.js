// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyAL1RF5XAMknDUlwtDRjC2PByUabkMCDOA",
  authDomain: "color-blind-bca19.firebaseapp.com",
  projectId: "color-blind-bca19",
  storageBucket: "color-blind-bca19.firebasestorage.app",
  messagingSenderId: "876142955211",
  appId: "1:876142955211:web:e2e380a21e17d8e940694e"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const APP_ID = "hues-and-cues-online";

// Estado
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
let temporaryGuess = null;
let currentHostId = null;

const playerColors = ["#E53E3E","#DD6B20","#D69E2E","#38A169","#3182CE","#5A67D8","#805AD5","#D53F8C","#718096","#4A5568"];

// Tamaño oficial 30 x 16
const FULL_COLS = 30;
const FULL_ROWS = 16;
const COORD_LETTERS = "ABCDEFGHIJKLMNOP".split("");

// Paleta EXACTA por filas A..P con 30 columnas
const PALETTE = {
  A:["#652F0D","#722C0F","#7D2913","#8A2717","#9E291B","#AA291D","#BA2C21","#D23124","#F03225","#FC3022","#FD3221","#FD3223","#FD312B","#FF3139","#FD3044","#F82F51","#F42E64","#F22975","#E72881","#E32D8D","#D43D91","#C74091","#BC4597","#B14594","#A74697","#984696","#904A97","#874997","#80499A","#764A9B"],
  B:["#8D4D1C","#9B4B1D","#A4461E","#B74822","#C44323","#D33C26","#E23925","#F43423","#FC3521","#FD3B28","#FF3D30","#FD3B3A","#FD3541","#FE364A","#FC345D","#FD316F","#FD2B7B","#F92A8E","#E74092","#D74C95","#C85097","#BB4D96","#B04C95","#A54C95","#9D4B97","#934A96","#854A97","#80499A","#764897","#6A4596"],
  C:["#AA6424","#B45E22","#C36023","#CB5724","#D85324","#E24D24","#ED4823","#F94220","#FD482B","#FE4E3D","#FE514B","#FD4E4F","#FD4E5B","#FD4765","#FD4777","#FD4385","#F84895","#E6579A","#D45B99","#C35B9E","#BC589A","#AD5599","#A45299","#99509A","#904E9B","#884A9A","#7C4896","#754795","#6B4397","#5D3993"],
  D:["#D28426","#DF8424","#E57C22","#F37E20","#F17221","#F86820","#FD6B25","#FE6330","#FF5E3A","#FD654F","#FD6C62","#FB6C69","#FD686F","#FD677E","#FA628C","#FA639C","#E8669D","#D867A1","#C56BA4","#BD65A2","#AA60A1","#A35A9F","#9A589E","#90559D","#864F9C","#7E4C99","#71479A","#684097","#5B3D93","#49368C"],
  E:["#EE9A1E","#F89918","#FF9517","#FF9018","#FF8A21","#FF8029","#FE8139","#FE7840","#FE7B50","#FC8263","#FC8272","#FC847F","#FD8487","#FA7F94","#FB7AA5","#F07FA8","#D97EAC","#CD7DAD","#C07CAE","#B272A9","#A369A7","#9963A6","#8F5EA2","#875AA2","#7D529E","#704E9A","#66479C","#5A3B92","#4A3694","#323286"],
  F:["#FFB20D","#FFAF1C","#FFAA25","#FFAC34","#FFA83B","#FFA747","#FF9B52","#FF9559","#FE9060","#FE926F","#FC9781","#FC9990","#FC9896","#FC979F","#FA93B3","#E698BE","#D596BE","#CA95BC","#BC8ABA","#AE82B5","#9F7AB2","#936FAE","#8866A9","#7E61A7","#7459A3","#66519E","#5A499A","#4C3B93","#37368F","#292D7A"],
  G:["#FFBB13","#FFBD22","#FFB525","#FFB434","#FFBA59","#FFAC50","#FFAE61","#FFA769","#FFA775","#FEA782","#FDA693","#FEA597","#FDA7A4","#FBA4A8","#FBA6C0","#E5ACC9","#D3ACCC","#D0B1D1","#B89EC6","#A790C1","#9B88BF","#8B7CB6","#8073B1","#736AAE","#6661AB","#5A5AA7","#4F50A4","#43469C","#2F3B98","#2A3488"],
  H:["#FFCA10","#FFC822","#FFC428","#FFC43A","#FFC443","#FFBE50","#FFBB5C","#FFBA68","#FFB675","#FFB57D","#FFB389","#FEB89A","#F9BBA9","#F7BCB3","#F0BCC8","#DBBBD4","#CFBCDA","#CEBFDE","#B3ABD1","#A6A3CC","#9598C9","#828BC2","#7680C0","#6778BB","#5A6CB3","#5064AF","#465CAB","#3B51A3","#2D47A1","#213D96"],
  I:["#FFD70F","#FFD520","#FFD42C","#FFD33B","#FFD745","#FFD452","#FFD65B","#FED465","#F9D778","#F3DD8E","#EFDA9A","#E7DDAD","#E0DEBE","#DADFC7","#D1DDCF","#C4DAE5","#BED7F1","#BED7F1","#A3C6E9","#95B8E2","#87A9DA","#76A1D7","#6D93CF","#6184C3","#5279BB","#496EB7","#3F63AF","#385BAC","#2F50A4","#24479F"],
  J:["#FBE11C","#FCE020","#FEE32E","#FBE63D","#FAE745","#FCEA55","#F8E964","#F0E87C","#E7E487","#DEE298","#D7E3A9","#CFE3BA","#CFE4C8","#C9E4D0","#C3E2D4","#B7E0E4","#AEDEF0","#AFDFF6","#98D7F6","#7FCEF7","#76C1ED","#6AB0E7","#5EA4DF","#5894D3","#4C88CC","#467BBE","#3B6DB8","#3466B3","#315CAB","#2B51A4"],
  K:["#F9E435","#FAE53A","#F6E541","#F6E547","#F3E456","#EDE562","#E7E175","#DEE080","#D7DD80","#C7D788","#BCD591","#B1D39E","#B0D4AC","#ADD4B4","#A9D4BF","#A9D7D5","#A4D7DE","#A4D7E0","#92D2E5","#81D0EE","#6CCAF6","#5AC2F8","#56B6EB","#51A5DF","#4E98D7","#4387CC","#397BC4","#356EB8","#3164AF","#2D5DAB"],
  L:["#F3DF1B","#F3DF24","#EEDF2C","#E9DE31","#E6DC3C","#DEDB4C","#D1D659","#BFD061","#B1CC6A","#A6C973","#9BC67D","#93C585","#8EC594","#86C39C","#89C5A2","#86C6B0","#88C9C0","#86C9C5","#7DC6C8","#73C7D1","#61C1DB","#4CBFE2","#30BAEF","#2DB0EF","#32A2E4","#3393D8","#3A85CD","#3277C0","#356EB8","#2E64B3"],
  M:["#E0D619","#DBD520","#D8D529","#D2D331","#C9D03C","#B9CA3E","#ADC648","#9CC04C","#8DBD54","#82BA5B","#73B664","#6BB66E","#6AB67A","#65B67F","#67B686","#6AB992","#69BA9C","#6CBCA2","#6EBEA7","#63BCB5","#57B9B9","#4BBAC7","#3CB7CF","#23B3DB","#0CADE8","#14A0E4","#1D94D9","#2F88D1","#2A7AC3","#2570BC"],
  N:["#C1CC25","#BBCA29","#B3C62D","#A9C233","#9EC036","#91BB39","#7CB43C","#75B13D","#66AD3F","#58A544","#4DA548","#47A350","#3FA859","#41A966","#48AB70","#4EAF78","#51AF7E","#54B182","#59B488","#58B58F","#52B49B","#48B4A9","#3CB3B1","#2BB2C0","#1BB0D0","#07ABDA","#01A1E0","#0A9ADF","#188DD4","#1F7FC8"],
  O:["#9CB834","#97B837","#92B639","#85B13C","#7BAE3E","#69A440","#5EA241","#509A42","#489844","#399045","#2D8D45","#279247","#219848","#219D48","#26A153","#2EA459","#39A863","#3DA96E","#41AB70","#49AD74","#4BAF83","#41AF91","#3BB19C","#2EB0A9","#22AFB5","#1BAFC6","#0DADD4","#00A4D7","#009BDC","#0994DD"],
  P:["#789A3B","#759E3E","#6B9A3F","#61963F","#549741","#479142","#3B8B42","#328842","#218243","#177A41","#0F793E","#0A7F42","#0C8847","#0E8E47","#109748","#159C4A","#23A048","#29A254","#31A55D","#36A764","#37A86E","#30A97B","#27AA87","#1FA995","#15AAA0","#0CA9AE","#0CACBE","#06ACCA","#03A8D8","#00A3E4"]
};

// Helpers de paleta
function getColorByXY(x, y) {
  const rowLetter = COORD_LETTERS[y];
  return PALETTE[rowLetter][x];
}

// DOM
const lobbyScreen = document.getElementById("lobby-screen");
const waitingRoomScreen = document.getElementById("waiting-room-screen");
const gameScreen = document.getElementById("game-screen");
const colorGrid = document.getElementById("color-grid");
const confirmLeaveModal = document.getElementById("confirm-leave-modal");
const gameOverModal = document.getElementById("game-over-modal");
const roundSummaryModal = document.getElementById("round-summary-modal");
const soundToggle = document.getElementById("sound-toggle");

// Audio
let isMuted = true;
let music;
const musicSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "triangle" },
  envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
}).toDestination();
musicSynth.volume.value = -24;

const actionSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).toDestination();
actionSynth.volume.value = -10;

const soundIcons = {
  muted:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  unmuted:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/></svg>`
};

function playSound(type){
  if (isMuted) return;
  const now = Tone.now();
  if (type === "click") actionSynth.triggerAttackRelease("C4","16n",now);
  else if (type === "select") actionSynth.triggerAttackRelease("C5","16n",now);
  else if (type === "confirm") actionSynth.triggerAttackRelease("G5","16n",now);
  else if (type === "start"){ actionSynth.triggerAttackRelease("C4","8n",now); actionSynth.triggerAttackRelease("G4","8n",now+0.1); actionSynth.triggerAttackRelease("C5","8n",now+0.2); }
  else if (type === "win"){ actionSynth.triggerAttackRelease("G5","8n",now); actionSynth.triggerAttackRelease("C6","8n",now+0.1); }
  else if (type === "success"){ actionSynth.triggerAttackRelease("C5","16n",now); actionSynth.triggerAttackRelease("E5","16n",now+0.1); actionSynth.triggerAttackRelease("G5","16n",now+0.2); }
  else if (type === "failure") actionSynth.triggerAttackRelease("A3","8n",now);
}

function toggleMusic(){
  if (isMuted){
    Tone.start();
    if (!music){
      const notes = ["C4","E4","G4","B4","C5","B4","G4","E4"];
      let i = 0;
      music = new Tone.Loop(time => {
        musicSynth.triggerAttackRelease(notes[i % notes.length], "8n", time);
        i++;
      },"8n").start(0);
    }
    Tone.Transport.start();
    isMuted = false;
    soundToggle.innerHTML = soundIcons.unmuted;
  } else {
    Tone.Transport.stop();
    isMuted = true;
    soundToggle.innerHTML = soundIcons.muted;
  }
}
soundToggle.addEventListener("click", toggleMusic);
soundToggle.innerHTML = soundIcons.muted;

// Auth
onAuthStateChanged(auth, async user => {
  if (user){
    currentUserId = user.uid;
    const lastGame = JSON.parse(localStorage.getItem("hues-cues-game"));
    if (lastGame && lastGame.gameId) rejoinGame(lastGame.gameId, lastGame.userId);
  } else {
    try { await signInAnonymously(auth); } catch (e){ console.error("Error en la autenticación anónima:", e); }
  }
});

// Lobby y salida
function confirmLeave(){ playSound("click"); confirmLeaveModal.classList.remove("hidden"); }
function cancelLeave(){ playSound("click"); confirmLeaveModal.classList.add("hidden"); }
async function executeLeave(){
  playSound("click");
  if (unsubscribeGame) unsubscribeGame();
  if (currentUserId === currentHostId && currentGameId){
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    await deleteDoc(gameRef);
  }
  localStorage.removeItem("hues-cues-game");
  currentGameId = null;
  currentHostId = null;
  confirmLeaveModal.classList.add("hidden");
  showScreen("lobby");
}

document.getElementById("create-game-btn").addEventListener("click", ()=>{ playSound("click"); createGame(); });
document.getElementById("join-game-btn").addEventListener("click", ()=>{ playSound("click"); joinGame(); });
document.getElementById("start-game-btn").addEventListener("click", ()=>{ playSound("start"); startGame(); });
document.getElementById("game-id-display").addEventListener("click", copyGameId);
document.getElementById("exit-lobby-btn").addEventListener("click", executeLeave);
document.getElementById("leave-game-btn").addEventListener("click", confirmLeave);
document.getElementById("confirm-leave-btn").addEventListener("click", executeLeave);
document.getElementById("cancel-leave-btn").addEventListener("click", cancelLeave);
document.getElementById("new-game-btn").addEventListener("click", ()=>{ playSound("start"); restartGame(); });

function getPlayerName(){
  const name = document.getElementById("player-name").value.trim();
  if (!name){
    document.getElementById("lobby-error").textContent = "Por favor, introduce tu nombre.";
    return null;
  }
  return name;
}

async function createGame(){
  const playerName = getPlayerName();
  if (!playerName || !currentUserId) return;

  const gameId = Math.random().toString(36).substring(2,7).toUpperCase();
  currentGameId = gameId;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);

  const newPlayer = { name: playerName, color: playerColors[0], score: 0, isHost: true };
  const gameData = {
    hostId: currentUserId,
    players: { [currentUserId]: newPlayer },
    playerOrder: [currentUserId],
    gameState: "waiting",
    gameSettings: {
      roundLimit: 10,
      scoreLimit: 25,
      boardMode: "full_30x16" // por defecto
    },
    createdAt: new Date()
  };

  try {
    await setDoc(gameRef, gameData);
    localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: currentUserId }));
    subscribeToGame(gameId);
    showScreen("waiting-room");
  } catch (e) {
    console.error("Error al crear la partida:", e);
  }
}

async function joinGame(){
  const playerName = getPlayerName();
  if (!playerName || !currentUserId) return;

  const gameId = document.getElementById("join-game-id").value.trim().toUpperCase();
  if (!gameId){
    document.getElementById("lobby-error").textContent = "Introduce un código.";
    return;
  }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  const gameSnap = await getDoc(gameRef);
  if (!gameSnap.exists()){
    document.getElementById("lobby-error").textContent = "Partida no encontrada.";
    return;
  }

  const gameData = gameSnap.data();
  if (gameData.gameState !== "waiting"){
    const entry = Object.entries(gameData.players).find(([id,p])=> p.name === playerName);
    if (entry){
      const pid = entry[0];
      localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: pid }));
      rejoinGame(gameId, pid);
      return;
    } else {
      document.getElementById("lobby-error").textContent = "La partida ya ha comenzado.";
      return;
    }
  }

  if (Object.keys(gameData.players).length >= 10){
    document.getElementById("lobby-error").textContent = "La partida está llena.";
    return;
  }

  const newColor = playerColors[Object.keys(gameData.players).length];
  const newPlayer = { name: playerName, color: newColor, score: 0, isHost: false };
  const updatedPlayers = { ...gameData.players, [currentUserId]: newPlayer };
  const updatedOrder = [...gameData.playerOrder, currentUserId];

  try {
    await updateDoc(gameRef, { players: updatedPlayers, playerOrder: updatedOrder });
    localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: currentUserId }));
    currentGameId = gameId;
    subscribeToGame(gameId);
    showScreen("waiting-room");
  } catch(e){ console.error("Error al unirse:", e); }
}

async function rejoinGame(gameId, userId){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  const snap = await getDoc(gameRef);
  if (snap.exists()){
    currentGameId = gameId;
    currentUserId = userId;
    subscribeToGame(gameId);
  } else {
    localStorage.removeItem("hues-cues-game");
  }
}

function subscribeToGame(gameId){
  if (unsubscribeGame) unsubscribeGame();
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  unsubscribeGame = onSnapshot(gameRef, d=>{
    if (d.exists()){
      const gameData = d.data();
      currentHostId = gameData.hostId;
      updateUI(gameData);
    } else {
      localStorage.removeItem("hues-cues-game");
      alert("El anfitrión ha terminado la partida.");
      executeLeave();
    }
  });
}

function copyGameId(){
  playSound("click");
  const code = document.getElementById("game-id-display").textContent;
  navigator.clipboard.writeText(code).then(()=>{
    const el = document.getElementById("game-id-display");
    const original = el.textContent;
    el.textContent = "¡Copiado!";
    setTimeout(()=> el.textContent = original, 1500);
  });
}

// Board helpers
function defaultBoard(){
  return { mode: "full_30x16", startX: 0, startY: 0, cols: FULL_COLS, rows: FULL_ROWS };
}

function makeRandomMiniBoard(){
  const cols = 12;
  const rows = 8;
  const startX = Math.floor(Math.random() * (FULL_COLS - cols + 1));
  const startY = Math.floor(Math.random() * (FULL_ROWS - rows + 1));
  return { mode: "mini_12x8", startX, startY, cols, rows };
}

function getActiveBoard(gameData){
  if (gameData && gameData.currentBoard) return gameData.currentBoard;
  return defaultBoard();
}

// Genera el grid visual según el board activo
function generateColorGrid(gameData=null){
  const board = getActiveBoard(gameData);
  colorGrid.innerHTML = "";
  colorGrid.style.gridTemplateColumns = `repeat(${board.cols}, 1fr)`;

  for (let y = 0; y < board.rows; y++){
    for (let x = 0; x < board.cols; x++){
      const globalX = board.startX + x;
      const globalY = board.startY + y;

      const cell = document.createElement("div");
      cell.classList.add("color-cell");
      cell.style.backgroundColor = getColorByXY(globalX, globalY);

      cell.dataset.x = globalX;
      cell.dataset.y = globalY;
      cell.dataset.coords = `${COORD_LETTERS[globalY]}${globalX + 1}`;
      cell.title = `${COORD_LETTERS[globalY]}${globalX + 1}`;

      colorGrid.appendChild(cell);
    }
  }
}

// Carta secreta usando el board activo
function pickRandomCard(board){
  const x = board.startX + Math.floor(Math.random() * board.cols);
  const y = board.startY + Math.floor(Math.random() * board.rows);
  return { x, y, color: getColorByXY(x, y) };
}

async function startGame(){
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const gameData = snap.data();

  if (gameData.hostId !== currentUserId){ alert("Solo el creador puede empezar."); return; }
  if (Object.keys(gameData.players).length < 2){ alert("Se necesitan al menos 2 jugadores."); return; }

  const mode = gameData.gameSettings.boardMode || "full_30x16";
  const board = mode === "mini_12x8" ? makeRandomMiniBoard() : defaultBoard();
  const newCard = pickRandomCard(board);

  await updateDoc(gameRef, {
    gameState: "giving_clue_1",
    currentRound: 1,
    currentPlayerIndex: 0,
    currentBoard: board,
    currentCard: newCard,
    clues: [],
    guesses: {}
  });
}

function updateUI(gameData){
  if (gameData.gameState === "waiting"){
    gameOverModal.classList.add("hidden");
    showScreen("waiting-room");
    document.getElementById("game-id-display").textContent = currentGameId;

    const list = document.getElementById("player-list");
    list.innerHTML = "";
    gameData.playerOrder.forEach(pid=>{
      const p = gameData.players[pid];
      const li = document.createElement("li");
      li.className = "flex items-center";
      li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2" style="background-color:${p.color}"></div> ${p.name} ${p.isHost ? "(Host)" : ""}`;
      list.appendChild(li);
    });

    const isHost = gameData.hostId === currentUserId;
    const opts = document.getElementById("game-options");
    const roundLimitInput = document.getElementById("round-limit");
    const scoreLimitInput = document.getElementById("score-limit");
    const boardModeSelect = document.getElementById("board-mode");
    const limits = document.getElementById("game-limits-display");

    const mode = gameData.gameSettings.boardMode || "full_30x16";
    boardModeSelect.value = mode;

    if (isHost){
      opts.classList.remove("hidden");
      limits.classList.add("hidden");
      roundLimitInput.disabled = false;
      scoreLimitInput.disabled = false;
      boardModeSelect.disabled = false;
      roundLimitInput.value = gameData.gameSettings.roundLimit;
      scoreLimitInput.value = gameData.gameSettings.scoreLimit;
    } else {
      opts.classList.add("hidden");
      limits.classList.remove("hidden");
      const modeText = mode === "mini_12x8" ? "Tablero 12 x 8 aleatorio" : "Tablero 30 x 16 completo";
      limits.textContent = `Jugar a ${gameData.gameSettings.roundLimit} rondas o ${gameData.gameSettings.scoreLimit} puntos. ${modeText}.`;
    }

    document.getElementById("start-game-btn").style.display = isHost ? "block" : "none";
    return;
  }

  if (gameData.gameState === "gameOver"){ showGameOver(gameData); return; }
  if (gameData.gameState === "roundSummary"){ showRoundSummary(gameData); return; }

  roundSummaryModal.classList.add("hidden");
  showScreen("game");

  // Siempre regeneramos el grid según el board activo
  generateColorGrid(gameData);

  const title = document.getElementById("game-title");
  const names = gameData.playerOrder.map(pid=> gameData.players[pid].name);
  title.textContent = names.length === 2 ? `${names[0]} vs ${names[1]}` : "Partida Grupal";

  renderScores(gameData);
  renderBoard(gameData);
  renderGameInfo(gameData);
  renderControls(gameData);
}

function renderScores(gameData){
  const c = document.getElementById("player-scores");
  c.innerHTML = "";
  gameData.playerOrder.forEach(pid=>{
    const p = gameData.players[pid];
    const row = document.createElement("div");
    row.className = "flex justify-between items-center p-2 rounded-md";
    row.innerHTML = `
      <div class="flex items-center">
        <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background-color:${p.color}"></div>
        <span class="font-medium">${p.name}</span>
      </div>
      <span class="font-bold text-lg">${p.score}</span>
    `;
    c.appendChild(row);
  });
}

function renderBoard(gameData){
  // Limpieza de marcadores y resaltados
  document.querySelectorAll(".player-marker, .temp-marker, .secret-color-highlight").forEach(el=>{
    if (el.classList.contains("secret-color-highlight")) el.classList.remove("secret-color-highlight");
    else el.remove();
  });
  document.querySelectorAll(".scoring-overlay").forEach(el=> el.classList.add("hidden"));

  const board = getActiveBoard(gameData);
  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
  const isCueGiver = currentUserId === cueGiverId;

  const drawMarker = (guess, player, temp=false)=>{
    const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`);
    if (!cell || !player) return;
    const m = document.createElement("div");
    m.className = temp ? "player-marker temp-marker" : "player-marker";
    m.style.backgroundColor = player.color;
    m.textContent = player.name.substring(0,1);
    cell.appendChild(m);
  };

  // Resalta el color secreto para el dador de pista
  if (isCueGiver && gameData.gameState !== "scoring" && gameData.gameState !== "gameOver" && gameData.gameState !== "roundSummary"){
    const { x, y } = gameData.currentCard;
    const secretCell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if (secretCell) secretCell.classList.add("secret-color-highlight");
  }

  // Marcadores
  if (gameData.guesses){
    if (gameData.gameState === "scoring" || gameData.gameState === "gameOver" || gameData.gameState === "roundSummary" || isCueGiver){
      Object.entries(gameData.guesses).forEach(([pid, guesses])=>{
        const p = gameData.players[pid];
        guesses.forEach(g=> drawMarker(g, p));
      });
    } else {
      const mine = gameData.guesses[currentUserId] || [];
      const me = gameData.players[currentUserId];
      if (me) mine.forEach(g=> drawMarker(g, me));
    }
  }

  if (temporaryGuess) drawMarker(temporaryGuess, gameData.players[currentUserId], true);

  // Marcos de puntuación
  if (gameData.gameState === "scoring" || gameData.gameState === "gameOver" || gameData.gameState === "roundSummary"){
    const { x, y } = gameData.currentCard;
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if (!cell) return;

    const w = cell.offsetWidth;
    const h = cell.offsetHeight;
    const gap = 1;

    // Posición dentro del grid visible
    const idxX = x - board.startX;
    const idxY = y - board.startY;

    function drawBox(size, id){
      const box = document.getElementById(id);
      if (!box) return;
      box.style.left = `${(idxX - Math.floor(size / 2)) * (w + gap)}px`;
      box.style.top = `${(idxY - Math.floor(size / 2)) * (h + gap)}px`;
      box.style.width = `${size * (w + gap) - gap}px`;
      box.style.height = `${size * (h + gap) - gap}px`;
      box.classList.remove("hidden");
    }
    drawBox(1, "scoring-box-3");
    drawBox(3, "scoring-box-2");
    drawBox(5, "scoring-box-1");
  }
}

function renderGameInfo(gameData){
  const info = document.getElementById("game-info");
  const giverId = gameData.playerOrder[gameData.currentPlayerIndex];
  const giver = gameData.players[giverId];

  let html = `<p><strong>Ronda:</strong> ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}</p>`;
  html += `<p><strong>Dador de pista:</strong> ${giver.name}</p>`;

  if (gameData.gameState.includes("guessing")){
    const req = gameData.gameState === "guessing_1" ? 1 : 2;
    const waiting = gameData.playerOrder
      .filter(pid=> pid !== giverId)
      .filter(pid=> (gameData.guesses?.[pid]?.length || 0) < req)
      .map(pid=> gameData.players[pid].name);
    html += waiting.length > 0
      ? `<p class="text-yellow-400 font-semibold">Turno de adivinar de:<br>${waiting.join(", ")}</p>`
      : `<p class="text-gray-400 font-semibold">Todos han adivinado.</p>`;
  } else if (gameData.gameState.includes("giving_clue")){
    html += `<p class="text-cyan-400 font-semibold">Esperando pista de ${giver.name}...</p>`;
  } else if (gameData.gameState === "scoring"){
    html += `<p class="text-green-400 font-semibold">Puntuando...</p>`;
  }

  info.innerHTML = html;
  document.getElementById("clue-display").innerHTML = (gameData.clues || []).map(c=> `<span>${c}</span>`).join("");

  const cgView = document.getElementById("cue-giver-view");
  if (currentUserId === giverId && gameData.gameState !== "scoring"){
    cgView.classList.remove("hidden");
    document.getElementById("secret-color-display").style.backgroundColor = gameData.currentCard.color;
    document.getElementById("secret-color-coords").textContent = `${COORD_LETTERS[gameData.currentCard.y]}${gameData.currentCard.x + 1}`;
  } else {
    cgView.classList.add("hidden");
  }
}

function renderControls(gameData){
  const c = document.getElementById("controls");
  c.innerHTML = "";

  const giverId = gameData.playerOrder[gameData.currentPlayerIndex];
  const isGiver = currentUserId === giverId;

  if (isGiver){
    switch (gameData.gameState){
      case "giving_clue_1":
        if ((gameData.clues || []).length === 0){
          c.innerHTML = createClueInputHTML(1);
          document.getElementById("submit-clue-btn").onclick = ()=> submitClue(1);
        }
        break;
      case "giving_clue_2":
        if ((gameData.clues || []).length === 1){
          c.innerHTML = createClueInputHTML(2);
          document.getElementById("submit-clue-btn").onclick = ()=> submitClue(2);
        }
        break;
      case "guessing_1":
      case "guessing_2":
        const guessers = gameData.playerOrder.filter(id=> id !== giverId);
        const req = gameData.gameState === "guessing_1" ? 1 : 2;
        const all = guessers.every(id=> (gameData.guesses?.[id]?.length || 0) >= req);
        if (all){
          c.innerHTML = `<button id="reveal-btn" class="btn-primary" style="background-color:#ef4444">Revelar Color</button>`;
          document.getElementById("reveal-btn").onclick = reveal;
        } else {
          c.innerHTML = `<p class="text-gray-400">Esperando que los demás adivinen...</p>`;
        }
        break;
    }
  } else {
    const my = gameData.guesses?.[currentUserId] || [];
    const can =
      (gameData.gameState === "guessing_1" && my.length === 0) ||
      (gameData.gameState === "guessing_2" && my.length === 1);

    if (temporaryGuess){
      const tempColor = colorGrid.querySelector(`[data-x='${temporaryGuess.x}'][data-y='${temporaryGuess.y}']`).style.backgroundColor;
      c.innerHTML = `
        <div class="flex items-center justify-center gap-4">
          <div class="color-preview" style="background-color:${tempColor}"></div>
          <button id="confirm-guess-btn" class="btn-primary">Confirmar Elección</button>
        </div>
      `;
      document.getElementById("confirm-guess-btn").onclick = confirmGuess;
    } else if (can){
      c.innerHTML = `<p class="text-gray-400">Selecciona un color en el tablero.</p>`;
    } else {
      c.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`;
    }
  }
}

function createClueInputHTML(n){
  const d = document.createElement("div");
  d.className = "flex justify-center items-center space-x-2";
  d.innerHTML = `
    <input type="text" id="clue-input" class="input-field" placeholder="Pista de 1 palabra">
    <button id="submit-clue-btn" class="btn-primary">Dar Pista ${n}</button>
  `;
  d.querySelector("#clue-input").addEventListener("keydown", e=>{
    if (e.key === "Enter"){
      e.preventDefault();
      submitClue(n);
    }
  });
  return d.innerHTML;
}

const FORBIDDEN_WORDS = ["rojo","verde","azul","amarillo","naranja","morado","violeta","rosa","marrón","negro","blanco","gris","cian","magenta","turquesa","lila","fucsia","celeste","índigo","añil","purpura","escarlata","carmín","granate","oliva","esmeralda","zafiro","cobalto","ocre","siena","beis","beige","crema","dorado","plateado","bronce","cobre","color","tono","matiz","claro","oscuro","brillante","pálido","aguamarina","coral","lavanda","malva","salmón","terracota","caqui"];

async function submitClue(n){
  const input = document.getElementById("clue-input");
  const text = input.value.trim();
  const first = text.toLowerCase().split(" ")[0];
  if (!first) return;

  if (FORBIDDEN_WORDS.includes(first)){
    alert(`La palabra "${first}" no está permitida. Elige otra pista.`);
    input.value = "";
    return;
  }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const gameData = (await getDoc(gameRef)).data();
  await updateDoc(gameRef, { clues: [...(gameData.clues || []), first], gameState: `guessing_${n}` });
}

async function handleGridClick(e){
  const cell = e.target.closest(".color-cell");
  if (!cell) return;

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if (!snap.exists()) return;
  const gameData = snap.data();

  const giverId = gameData.playerOrder[gameData.currentPlayerIndex];
  if (currentUserId === giverId) return;

  const my = gameData.guesses?.[currentUserId] || [];
  const can =
    (gameData.gameState === "guessing_1" && my.length === 0) ||
    (gameData.gameState === "guessing_2" && my.length === 1);
  if (!can) return;

  playSound("select");
  temporaryGuess = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) };
  renderBoard(gameData);
  renderControls(gameData);
}

async function confirmGuess(){
  if (!temporaryGuess) return;
  playSound("confirm");

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const gameData = snap.data();

  const mine = gameData.guesses?.[currentUserId] || [];
  const updated = { ...gameData.guesses, [currentUserId]: [...mine, temporaryGuess] };
  temporaryGuess = null;
  await updateDoc(gameRef, { guesses: updated });

  const guessers = gameData.playerOrder.filter(id=> id !== gameData.playerOrder[gameData.currentPlayerIndex]);
  const req = gameData.gameState === "guessing_1" ? 1 : 2;
  const all = guessers.every(id=> (updated[id]?.length || 0) >= req);
  if (all && gameData.gameState === "guessing_1"){
    await updateDoc(gameRef, { gameState: "giving_clue_2" });
  }
}

async function reveal(){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  await updateDoc(gameRef, { gameState: "scoring" });
  setTimeout(calculateAndShowScores, 2500);
}

async function calculateAndShowScores(){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const gameData = snap.data();

  const { x: tx, y: ty } = gameData.currentCard;
  const giverId = gameData.playerOrder[gameData.currentPlayerIndex];
  let giverPts = 0;
  const roundPts = {};
  const players = JSON.parse(JSON.stringify(gameData.players));
  Object.keys(players).forEach(pid => roundPts[pid] = { name: players[pid].name, points: 0 });

  Object.entries(gameData.guesses).forEach(([pid, guesses])=>{
    let pPts = 0;
    guesses.forEach(g=>{
      const dx = Math.abs(g.x - tx);
      const dy = Math.abs(g.y - ty);
      let pts = 0;
      if (dx === 0 && dy === 0) pts = 3;
      else if (dx <= 1 && dy <= 1) pts = 2;
      else if (dx <= 2 && dy <= 2) pts = 1;
      pPts += pts;
      if (pid !== giverId && dx <= 1 && dy <= 1) giverPts++;
    });
    players[pid].score += pPts;
    roundPts[pid].points = pPts;
  });
  players[giverId].score += giverPts;
  roundPts[giverId].points = giverPts;

  await updateDoc(gameRef, { players, lastRoundSummary: roundPts });

  const winner = Object.values(players).find(p=> p.score >= gameData.gameSettings.scoreLimit);
  const roundsDone = gameData.currentRound >= gameData.gameSettings.roundLimit;
  if (winner || roundsDone) await updateDoc(gameRef, { gameState: "gameOver" });
  else await updateDoc(gameRef, { gameState: "roundSummary" });
}

function showRoundSummary(gameData){
  const content = document.getElementById("summary-content");
  const title = document.getElementById("summary-title");
  title.textContent = `Fin de la Ronda ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}`;

  const total = Object.values(gameData.lastRoundSummary).reduce((s,p)=> s + p.points, 0);
  if (total > 0) { playSound("success"); } else { playSound("failure"); }

  content.innerHTML = Object.values(gameData.lastRoundSummary).map(p => `<p><strong>${p.name}:</strong> +${p.points} puntos</p>`).join("");
  roundSummaryModal.classList.remove("hidden");
}

document.getElementById("next-round-btn").addEventListener("click", async ()=>{
  playSound("click");
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const gameData = snap.data();

  const nextIndex = (gameData.currentPlayerIndex + 1) % gameData.playerOrder.length;
  const nextRound = nextIndex === 0 ? gameData.currentRound + 1 : gameData.currentRound;

  // Si el modo es mini, generar nuevo subtablero aleatorio por ronda
  const mode = gameData.gameSettings.boardMode || "full_30x16";
  const nextBoard = mode === "mini_12x8" ? makeRandomMiniBoard() : gameData.currentBoard || defaultBoard();

  await updateDoc(gameRef, {
    gameState: "giving_clue_1",
    currentRound: nextRound,
    currentPlayerIndex: nextIndex,
    currentBoard: nextBoard,
    currentCard: pickRandomCard(nextBoard),
    clues: [],
    guesses: {}
  });
});

function showGameOver(gameData){
  const winner = gameData.playerOrder.reduce((a,b)=> gameData.players[a].score > gameData.players[b].score ? a : b);
  document.getElementById("winner-name").textContent = gameData.players[winner].name;
  gameOverModal.classList.remove("hidden");

  playSound("win");
  const canvas = document.getElementById("confetti-canvas");
  const myConfetti = confetti.create(canvas, { resize: true });
  myConfetti({ particleCount: 200, spread: 160, origin: { y: 0.6 } });
}

async function restartGame(){
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const gameData = snap.data();

  if (currentUserId !== gameData.hostId){ alert("Solo el anfitrión puede reiniciar la partida."); return; }

  const resetPlayers = {};
  gameData.playerOrder.forEach(pid => { resetPlayers[pid] = { ...gameData.players[pid], score: 0 }; });

  await updateDoc(gameRef, { players: resetPlayers, gameState: "waiting" });
  gameOverModal.classList.add("hidden");
}

// Utilidades
function showScreen(name){
  lobbyScreen.classList.add("hidden");
  waitingRoomScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  document.getElementById(`${name}-screen`).classList.remove("hidden");
}

// Inicio con grid completo por defecto en memoria local
generateColorGrid();
colorGrid.addEventListener("click", handleGridClick);

// Ajustes host
document.getElementById("round-limit").addEventListener("change", e=> updateGameSettings({ roundLimit: parseInt(e.target.value) }));
document.getElementById("score-limit").addEventListener("change", e=> updateGameSettings({ scoreLimit: parseInt(e.target.value) }));
document.getElementById("board-mode").addEventListener("change", e=> updateGameSettings({ boardMode: e.target.value }));

async function updateGameSettings(newSettings){
  if (!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const data = (await getDoc(gameRef)).data();
  await updateDoc(gameRef, { gameSettings: { ...data.gameSettings, ...newSettings } });
}
