// ================= Firebase =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAL1RF5XAMknDUlwtDRjC2PByUabkMCDOA",
  authDomain: "color-blind-bca19.firebaseapp.com",
  projectId: "color-blind-bca19",
  storageBucket: "color-blind-bca19.firebasestorage.app",
  messagingSenderId: "876142955211",
  appId: "1:876142955211:web:e2e380a21e17d8e940694e"
};

// --- INIT ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const APP_ID = "hues-and-cues-online";

// ================= Constantes del tablero =================
const COORD_LETTERS = "ABCDEFGHIJKLMNOP".split(""); // 16 filas
const FULL_COLS = 30;
const FULL_ROWS = 16;

// Paleta 30x16 exacta (A..P). Cada fila tiene 30 HEX.
const COLORS_30x16 = [
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

// ================= Estado Global =================
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
let temporaryGuess = null;
let currentHostId = null;
let selectedGridSize = "30x16"; // elección en lobby
let currentSubgrid = null;      // {row, col} para 12x8
const playerColors = ['#E53E3E','#DD6B20','#D69E2E','#38A169','#3182CE','#5A67D8','#805AD5','#D53F8C','#718096','#4A5568'];

// ================= DOM =================
const lobbyScreen = document.getElementById("lobby-screen");
const waitingRoomScreen = document.getElementById("waiting-room-screen");
const gameScreen = document.getElementById("game-screen");
const colorGrid = document.getElementById("color-grid");
const soundToggle = document.getElementById("sound-toggle");
const gameOverModal = document.getElementById("game-over-modal");
const roundSummaryModal = document.getElementById("round-summary-modal");
const confirmLeaveModal = document.getElementById("confirm-leave-modal");

// ================= Audio sencillo =================
let isMuted = true;
const actionSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).toDestination();
actionSynth.volume.value = -10;

const soundIcons = {
  muted:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  unmuted:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/></svg>`
};
function playSound(t){ if(isMuted) return; const n=Tone.now(); if(t==="click") actionSynth.triggerAttackRelease("C4","16n",n); if(t==="select") actionSynth.triggerAttackRelease("E4","16n",n); if(t==="confirm") actionSynth.triggerAttackRelease("G4","16n",n); }
soundToggle.addEventListener("click",()=>{ isMuted=!isMuted; soundToggle.innerHTML=isMuted?soundIcons.muted:soundIcons.unmuted;});
soundToggle.innerHTML=soundIcons.muted;

// ================= Auth =================
onAuthStateChanged(auth, async (user)=>{
  if(user){ 
    currentUserId = user.uid;
    const last = JSON.parse(localStorage.getItem("hues-cues-game"));
    if(last && last.gameId) rejoinGame(last.gameId, last.userId || currentUserId);
  } else {
    try { await signInAnonymously(auth);} catch(e){ console.error(e); }
  }
});

// ================= Lobby handlers =================
document.getElementById("size-30x16-btn").addEventListener("click",()=>{ selectedGridSize="30x16"; playSound("click"); });
document.getElementById("size-12x8-btn").addEventListener("click",()=>{ selectedGridSize="12x8"; playSound("click"); });

document.getElementById("create-game-btn").addEventListener("click",()=>{ playSound("click"); createGame(); });
document.getElementById("join-game-btn").addEventListener("click",()=>{ playSound("click"); joinGame(); });
document.getElementById("start-game-btn").addEventListener("click",()=>{ playSound("click"); startGame(); });
document.getElementById("exit-lobby-btn").addEventListener("click", executeLeave);
document.getElementById("leave-game-btn").addEventListener("click", confirmLeave);
document.getElementById("confirm-leave-btn").addEventListener("click", executeLeave);
document.getElementById("cancel-leave-btn").addEventListener("click", ()=>confirmLeaveModal.classList.add("hidden"));
document.getElementById("new-game-btn").addEventListener("click", ()=>{ playSound("click"); restartGame(); });
document.getElementById("game-id-display").addEventListener("click", copyGameId);

// ================= Crear / Unirse =================
function getPlayerName(){
  const n = document.getElementById("player-name").value.trim();
  if(!n){ document.getElementById("lobby-error").textContent="Por favor, introduce tu nombre."; return null; }
  return n;
}

async function createGame(){
  const name = getPlayerName();
  if(!name || !currentUserId) return;

  const id = Math.random().toString(36).substring(2,7).toUpperCase();
  currentGameId = id;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);

  const newPlayer = { name, color: playerColors[0], score: 0, isHost: true };
  const gameData = {
    hostId: currentUserId,
    players: { [currentUserId]: newPlayer },
    playerOrder: [currentUserId],
    gameState: "waiting",
    gameSettings: {
      gridSize: selectedGridSize, // "30x16" o "12x8"
      roundLimit: 10,
      scoreLimit: 25
    },
    createdAt: new Date()
  };

  try{
    await setDoc(gameRef, gameData);
    localStorage.setItem("hues-cues-game", JSON.stringify({ gameId:id, userId: currentUserId }));
    subscribeToGame(id);
    showScreen("waiting-room");
  }catch(e){ console.error("Error al crear partida", e); }
}

async function joinGame(){
  const name = getPlayerName();
  if(!name || !currentUserId) return;

  const id = document.getElementById("join-game-id").value.trim().toUpperCase();
  if(!id){ document.getElementById("lobby-error").textContent="Introduce un código."; return; }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);
  const snap = await getDoc(gameRef);
  if(!snap.exists()){ document.getElementById("lobby-error").textContent="Partida no encontrada."; return; }

  const data = snap.data();
  if(Object.keys(data.players).length >= 10){ document.getElementById("lobby-error").textContent="La partida está llena (máximo 10)."; return; }

  if(data.gameState !== "waiting"){
    // rejoin si el nombre ya está
    const entry = Object.entries(data.players).find(([pid,p])=>p.name===name);
    if(entry){
      const existingId = entry[0];
      localStorage.setItem("hues-cues-game", JSON.stringify({ gameId:id, userId: existingId }));
      rejoinGame(id, existingId);
      return;
    }else{
      document.getElementById("lobby-error").textContent="La partida ya ha comenzado.";
      return;
    }
  }

  const color = playerColors[Object.keys(data.players).length];
  const newPlayer = { name, color, score: 0, isHost: false };
  const updatedPlayers = { ...data.players, [currentUserId]: newPlayer };
  const updatedOrder = [...data.playerOrder, currentUserId];
  try{
    await updateDoc(gameRef, { players: updatedPlayers, playerOrder: updatedOrder });
    localStorage.setItem("hues-cues-game", JSON.stringify({ gameId:id, userId: currentUserId }));
    currentGameId = id;
    subscribeToGame(id);
    showScreen("waiting-room");
  }catch(e){ console.error("Error al unirse", e); }
}

async function rejoinGame(gameId, userId){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
  const snap = await getDoc(gameRef);
  if(snap.exists()){
    currentGameId = gameId;
    currentUserId = userId;
    subscribeToGame(gameId);
  }else{
    localStorage.removeItem("hues-cues-game");
  }
}

function subscribeToGame(id){
  if(unsubscribeGame) unsubscribeGame();
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, id);
  unsubscribeGame = onSnapshot(gameRef, (d)=>{
    if(!d.exists()){
      localStorage.removeItem("hues-cues-game");
      alert("El anfitrión ha terminado la partida.");
      executeLeave();
      return;
    }
    const data = d.data();
    currentHostId = data.hostId;
    // sincronizar tamaño y subgrid si existiera
    selectedGridSize = data.gameSettings?.gridSize || "30x16";
    currentSubgrid = data.currentSubgrid || null;
    updateUI(data);
  });
}

function copyGameId(){
  playSound("click");
  const text = document.getElementById("game-id-display").textContent;
  navigator.clipboard.writeText(text);
}

// ================= Tablero =================
function getGridColor(y, x){ // global indices
  const row = COLORS_30x16[y];
  return row ? row[x] : "#000";
}

function generateColorGrid(){
  // determinar dimensiones de visualización
  const isSmall = selectedGridSize === "12x8";
  const rows = isSmall ? 8 : FULL_ROWS;
  const cols = isSmall ? 12 : FULL_COLS;

  colorGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  colorGrid.innerHTML = "";

  // offset para 12x8
  const row0 = currentSubgrid?.row ?? 0;
  const col0 = currentSubgrid?.col ?? 0;

  for(let r=0; r<rows; r++){
    for(let c=0; c<cols; c++){
      const gy = isSmall ? row0 + r : r; // global row/col
      const gx = isSmall ? col0 + c : c;
      const cell = document.createElement("div");
      cell.className = "color-cell";
      const hex = getGridColor(gy, gx);
      cell.style.backgroundColor = hex;
      cell.dataset.x = gx;
      cell.dataset.y = gy;
      cell.dataset.coords = `${COORD_LETTERS[gy]}${gx+1}`;
      cell.title = cell.dataset.coords;
      colorGrid.appendChild(cell);
    }
  }
}

// ================= Game Flow =================
async function startGame(){
  if(!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if(data.hostId !== currentUserId){ alert("Solo el creador puede empezar."); return; }
  if(Object.keys(data.players).length < 2){ alert("Se necesitan al menos 2 jugadores."); return; }

  // subgrid aleatorio si 12x8
  let sub = null;
  if((data.gameSettings?.gridSize || "30x16") === "12x8"){
    const maxRow = FULL_ROWS - 8;  // 0..8
    const maxCol = FULL_COLS - 12; // 0..18
    sub = { row: Math.floor(Math.random()*(maxRow+1)), col: Math.floor(Math.random()*(maxCol+1)) };
  }

  // 4 candidatos visibles solo para el dador
  const candidates = getRandomCandidates(4, sub);

  await updateDoc(gameRef, {
    gameState: "choosing_secret",
    currentRound: 1,
    currentPlayerIndex: 0,
    currentCard: null,
    currentCandidates: candidates,
    currentSubgrid: sub,
    clues: [],
    guesses: {}
  });
}

function getRandomCandidates(n, sub){
  const res = [];
  const used = new Set();
  const isSmall = (selectedGridSize === "12x8");
  const baseRow = sub?.row ?? 0;
  const baseCol = sub?.col ?? 0;
  const rows = isSmall ? 8 : FULL_ROWS;
  const cols = isSmall ? 12 : FULL_COLS;

  while(res.length < n){
    const lr = Math.floor(Math.random()*rows);
    const lc = Math.floor(Math.random()*cols);
    const y = baseRow + lr;
    const x = baseCol + lc;
    const key = `${y}-${x}`;
    if(used.has(key)) continue;
    used.add(key);
    res.push({ x, y, color: getGridColor(y,x) });
  }
  return res;
}

// ================= Render UI =================
function updateUI(data){
  if(data.gameState === "waiting"){
    gameOverModal.classList.add("hidden");
    showScreen("waiting-room");

    document.getElementById("game-id-display").textContent = currentGameId;
    const list = document.getElementById("player-list");
    list.innerHTML = "";
    data.playerOrder.forEach(pid=>{
      const p = data.players[pid];
      const li = document.createElement("li");
      li.className = "flex items-center";
      li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2 border border-gray-400" style="background-color:${p.color}"></div> ${p.name} ${p.isHost?"(Host)":""}`;
      list.appendChild(li);
    });

    const isHost = data.hostId === currentUserId;
    const opts = document.getElementById("game-options");
    const roundInput = document.getElementById("round-limit");
    const scoreInput = document.getElementById("score-limit");
    const limits = document.getElementById("game-limits-display");

    if(isHost){
      opts.classList.remove("hidden");
      limits.classList.add("hidden");
      roundInput.disabled = false; scoreInput.disabled=false;
      roundInput.value = data.gameSettings.roundLimit;
      scoreInput.value = data.gameSettings.scoreLimit;
    }else{
      opts.classList.add("hidden");
      limits.classList.remove("hidden");
      limits.textContent = `Jugamos a ${data.gameSettings.roundLimit} rondas o ${data.gameSettings.scoreLimit} puntos.`;
    }
    document.getElementById("start-game-btn").style.display = isHost ? "block":"none";
    return;
  }

  if(data.gameState === "gameOver"){ showGameOver(data); return; }

  roundSummaryModal.classList.add("hidden");
  showScreen("game");

  // Re-generar tablero si cambió el tamaño o subgrid
  generateColorGrid();

  renderScores(data);
  renderBoard(data);
  renderGameInfo(data);
  renderControls(data);
}

function renderScores(data){
  const box = document.getElementById("player-scores");
  box.innerHTML = "";
  data.playerOrder.forEach(pid=>{
    const p = data.players[pid];
    const row = document.createElement("div");
    row.className = "flex justify-between items-center p-2 rounded-md";
    row.innerHTML = `<div class="flex items-center">
      <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background-color:${p.color}"></div>
      <span class="font-medium">${p.name}</span>
    </div>
    <span class="font-bold text-lg">${p.score}</span>`;
    box.appendChild(row);
  });
}

function drawPawnSVG(){
  // Peón blanco con sombra
  return `
  <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
    <defs>
      <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,.45)"/>
      </filter>
    </defs>
    <g filter="url(#ds)" fill="#ffffff">
      <circle cx="32" cy="22" r="10" fill="#ffffff"/>
      <path d="M20 40c0-6.6 5.4-12 12-12s12 5.4 12 12v3H20v-3z" fill="#ffffff" />
      <rect x="16" y="43" width="32" height="6" rx="3" fill="#ffffff"/>
      <rect x="12" y="50" width="40" height="6" rx="3" fill="#ffffff"/>
    </g>
  </svg>`;
}

function renderBoard(data){
  // limpiar marcadores y resalto
  document.querySelectorAll(".player-marker, .temp-marker, .secret-color-highlight").forEach(el=>{
    if(el.classList.contains("secret-color-highlight")) el.classList.remove("secret-color-highlight");
    else el.remove();
  });
  // overlays ocultos por defecto
  document.querySelectorAll(".scoring-overlay").forEach(el=>el.classList.add("hidden"));

  const cueId = data.playerOrder[data.currentPlayerIndex];
  const isCue = currentUserId === cueId;

  // Resaltar color secreto al dador
  if(isCue && data.currentCard && data.gameState!=="scoring" && data.gameState!=="roundSummary"){
    const {x,y} = data.currentCard;
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if(cell) cell.classList.add("secret-color-highlight");
  }

  // Dibujar marcadores
  const drawMarker = (guess, player, isTemp=false)=>{
    const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`);
    if(!cell) return;
    const marker = document.createElement("div");
    marker.className = isTemp ? "player-marker temp-marker" : "player-marker";
    marker.style.backgroundColor = player.color;

    // En desktop peón, en móvil letra
    if(window.innerWidth >= 1024){
      marker.innerHTML = drawPawnSVG();
    }else{
      const span = document.createElement("div");
      span.className = "initial";
      span.textContent = player.name.substring(0,1).toUpperCase();
      marker.appendChild(span);
    }

    cell.appendChild(marker);
  };

  // Mostrar adivinanzas
  if(data.guesses){
    const canReveal = data.gameState==="scoring" || data.gameState==="gameOver" || data.gameState==="roundSummary" || isCue;
    if(canReveal){
      Object.entries(data.guesses).forEach(([pid, guesses])=>{
        const player = data.players[pid];
        (guesses||[]).forEach(g=>drawMarker(g, player));
      });
    }else{
      const me = data.players[currentUserId];
      (data.guesses[currentUserId]||[]).forEach(g=>drawMarker(g, me));
    }
  }

  if(temporaryGuess){
    drawMarker(temporaryGuess, data.players[currentUserId], true);
  }

  // Dibujar overlays de puntuación
  if(data.gameState==="scoring" || data.gameState==="gameOver" || data.gameState==="roundSummary"){
    if(!data.currentCard) return;
    const {x,y} = data.currentCard;
    const anyCell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
    if(!anyCell) return;
    const cw = anyCell.offsetWidth, ch = anyCell.offsetHeight, gap=1;

    const placeBox = (size, id)=>{
      const box = document.getElementById(id);
      if(!box) return;
      box.style.left = `${(x-Math.floor(size/2))*(cw+gap)}px`;
      box.style.top = `${(y-Math.floor(size/2))*(ch+gap)}px`;
      box.style.width = `${size*(cw+gap)-gap}px`;
      box.style.height = `${size*(ch+gap)-gap}px`;
      box.classList.remove("hidden");
    };

    // Si es 12x8 mostramos solo el 3x3 amarillo
    if(selectedGridSize==="12x8"){
      placeBox(3,"scoring-box-2");
    }else{
      placeBox(1,"scoring-box-3");
      placeBox(3,"scoring-box-2");
      placeBox(5,"scoring-box-1");
    }
  }
}

function renderGameInfo(data){
  const info = document.getElementById("game-info");
  const title = document.getElementById("game-title");
  const cueId = data.playerOrder[data.currentPlayerIndex];
  const cue = data.players[cueId];

  const playerNames = data.playerOrder.map(pid=>data.players[pid].name);
  title.textContent = playerNames.length===2 ? `${playerNames[0]} vs ${playerNames[1]}` : "Partida Grupal";

  let html = `<p><strong>Ronda:</strong> ${data.currentRound} / ${data.gameSettings.roundLimit}</p>`;
  html += `<p><strong>Dador de pista:</strong> ${cue.name}</p>`;

  if(data.gameState==="choosing_secret"){
    html += `<p class="text-cyan-400 font-semibold">${currentUserId===cueId ? "ES TU TURNO DE ELEGIR UN COLOR SECRETO" : "El dador está eligiendo el color secreto."}</p>`;
  }else if(data.gameState.includes("guessing")){
    const need = data.gameState==="guessing_1" ? 1 : 2;
    const pending = data.playerOrder
      .filter(pid=>pid!==cueId)
      .filter(pid=>((data.guesses[pid]?.length)||0) < need)
      .map(pid=>data.players[pid].name);
    html += `<p class="text-yellow-400 font-semibold">${pending.length?`Turno de adivinar de: ${pending.join(", ")}`:"Todos han adivinado."}</p>`;
  }else if(data.gameState.includes("giving_clue")){
    html += `<p class="text-cyan-400 font-semibold">Esperando pista de ${cue.name}...</p>`;
  }else if(data.gameState==="scoring"){
    html += `<p class="text-green-400 font-semibold">Puntuando...</p>`;
  }

  info.innerHTML = html;

  // Clues mostradas
  document.getElementById("clue-display").innerHTML = (data.clues||[]).map(c=>`<span>${c}</span>`).join("");

  // Panel del dador
  const cgView = document.getElementById("cue-giver-view");
  const candidatesBox = document.getElementById("candidate-swatches");
  const clueForm = document.getElementById("clue-form");
  const cueTitle = document.getElementById("cue-giver-title");

  if(currentUserId===cueId && data.gameState!=="scoring"){
    cgView.classList.remove("hidden");
    // Estado elegir secreto
    if(data.gameState==="choosing_secret"){
      cueTitle.textContent = "ES TU TURNO DE ELEGIR UN COLOR SECRETO";
      document.getElementById("secret-color-display").style.backgroundColor = "transparent";
      document.getElementById("secret-color-coords").textContent = "";
      // pintar 4 muestras
      candidatesBox.innerHTML = "";
      (data.currentCandidates||[]).forEach((c,i)=>{
        const sw = document.createElement("div");
        sw.className = "swatch";
        sw.style.backgroundColor = c.color;
        sw.title = `${COORD_LETTERS[c.y]}${c.x+1}`;
        sw.addEventListener("click", ()=>chooseSecret(c));
        candidatesBox.appendChild(sw);
      });
      candidatesBox.classList.remove("hidden");
      clueForm.classList.add("hidden");
    }else{
      // secreto ya elegido
      if(data.currentCard){
        document.getElementById("secret-color-display").style.backgroundColor = data.currentCard.color;
        document.getElementById("secret-color-coords").textContent = `${COORD_LETTERS[data.currentCard.y]}${data.currentCard.x+1}`;
      }
      cueTitle.textContent = "Tu color secreto";
      candidatesBox.classList.add("hidden");
      clueForm.classList.remove("hidden");
      // botón envía pista
      const submitBtn = document.getElementById("submit-clue-btn");
      submitBtn.onclick = ()=>submitClue(1);
      document.getElementById("clue-input").onkeydown = (e)=>{ if(e.key==="Enter"){ e.preventDefault(); submitClue(1);} };
    }
  }else{
    cgView.classList.add("hidden");
  }
}

async function chooseSecret(sel){
  playSound("confirm");
  if(!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  await updateDoc(gameRef, {
    currentCard: sel,
    currentCandidates: [],
    gameState: "giving_clue_1"
  });
}

function renderControls(data){
  const box = document.getElementById("controls");
  box.innerHTML = "";

  const cueId = data.playerOrder[data.currentPlayerIndex];
  const isCue = currentUserId===cueId;

  if(isCue){
    if(data.gameState==="guessing_1" || data.gameState==="guessing_2"){
      const others = data.playerOrder.filter(id=>id!==cueId);
      const need = data.gameState==="guessing_1" ? 1 : 2;
      const all = others.every(id=>((data.guesses[id]?.length)||0) >= need);
      if(all){
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.backgroundColor = "#ef4444";
        btn.textContent = "Revelar Color";
        btn.onclick = reveal;
        box.appendChild(btn);
      }else{
        box.innerHTML = `<p class="text-gray-400">Esperando que los demás adivinen...</p>`;
      }
    }
  }else{
    const my = data.guesses?.[currentUserId] || [];
    const can = (data.gameState==="guessing_1" && my.length===0) || (data.gameState==="guessing_2" && my.length===1);
    if(temporaryGuess){
      const cell = colorGrid.querySelector(`[data-x='${temporaryGuess.x}'][data-y='${temporaryGuess.y}']`);
      const chosen = cell ? cell.style.backgroundColor : "transparent";
      box.innerHTML = `<div class="flex items-center justify-center gap-4">
        <div class="color-preview" style="background-color:${chosen}"></div>
        <button id="confirm-guess-btn" class="btn-primary">Confirmar Elección</button>
      </div>`;
      document.getElementById("confirm-guess-btn").onclick = confirmGuess;
    }else if(can){
      box.innerHTML = `<p class="text-gray-400">Selecciona un color en el tablero.</p>`;
    }else{
      box.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`;
    }
  }
}

// ================= Interacciones tablero =================
colorGrid.addEventListener("click", handleGridClick);

async function handleGridClick(e){
  const cell = e.target.closest(".color-cell");
  if(!cell) return;

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  if(!snap.exists()) return;
  const data = snap.data();

  // Dador no puede marcar durante guessing
  const cueId = data.playerOrder[data.currentPlayerIndex];
  if(currentUserId===cueId) return;

  const my = data.guesses?.[currentUserId] || [];
  const can = (data.gameState==="guessing_1" && my.length===0) || (data.gameState==="guessing_2" && my.length===1);
  if(!can) return;

  playSound("select");
  temporaryGuess = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) };
  renderBoard(data);
  renderControls(data);
}

async function confirmGuess(){
  if(!temporaryGuess) return;
  playSound("confirm");

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  const my = data.guesses?.[currentUserId] || [];
  const updated = { ...data.guesses, [currentUserId]: [...my, temporaryGuess] };
  temporaryGuess = null;
  await updateDoc(gameRef, { guesses: updated });

  const cueId = data.playerOrder[data.currentPlayerIndex];
  const need = data.gameState==="guessing_1" ? 1 : 2;
  const others = data.playerOrder.filter(id=>id!==cueId);
  const all = others.every(id=>((updated[id]?.length)||0) >= need);
  if(all && data.gameState==="guessing_1"){
    await updateDoc(gameRef, { gameState: "giving_clue_2" });
  }
}

async function submitClue(num){
  const input = document.getElementById("clue-input");
  const text = (input.value||"").trim();
  if(!text) return;
  const word = text.split(" ")[0];
  input.value = "";

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  await updateDoc(gameRef, { clues:[...(data.clues||[]), word], gameState: `guessing_${num}` });
}

async function reveal(){
  if(!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  await updateDoc(gameRef, { gameState: "scoring" });
  setTimeout(calculateAndShowScores, 1500);
}

async function calculateAndShowScores(){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  if(!data.currentCard) return;

  const {x: tx, y: ty} = data.currentCard;
  const cueId = data.playerOrder[data.currentPlayerIndex];
  let cuePts = 0;
  const roundPts = {};
  const players = JSON.parse(JSON.stringify(data.players));
  Object.keys(players).forEach(pid=>roundPts[pid] = { name: players[pid].name, points: 0 });

  Object.entries(data.guesses).forEach(([pid, guesses])=>{
    let pts = 0;
    (guesses||[]).forEach(g=>{
      const dx = Math.abs(g.x - tx), dy = Math.abs(g.y - ty);
      let p = 0;
      if(dx===0 && dy===0) p=3;
      else if(dx<=1 && dy<=1) p=2;
      else if(dx<=2 && dy<=2) p=1;
      pts += p;
      if(pid!==cueId && dx<=1 && dy<=1) cuePts++;
    });
    players[pid].score += pts;
    roundPts[pid].points = pts;
  });

  players[cueId].score += cuePts;
  roundPts[cueId].points = cuePts;

  await updateDoc(gameRef, { players, lastRoundSummary: roundPts });

  const winner = Object.values(players).find(p=>p.score >= Math.min(25, (data.gameSettings?.scoreLimit||25)));
  const limitReached = data.currentRound >= (data.gameSettings?.roundLimit||10);

  if(winner || limitReached) await updateDoc(gameRef, { gameState:"gameOver" });
  else await updateDoc(gameRef, { gameState:"roundSummary" });
}

document.getElementById("next-round-btn").addEventListener("click", async ()=>{
  playSound("click");
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();

  const nextIdx = (data.currentPlayerIndex + 1) % data.playerOrder.length;
  const nextRound = nextIdx===0 ? data.currentRound+1 : data.currentRound;

  // nuevo subgrid si 12x8
  let sub = null;
  if((data.gameSettings?.gridSize || "30x16")==="12x8"){
    const maxRow = FULL_ROWS - 8;
    const maxCol = FULL_COLS - 12;
    sub = { row: Math.floor(Math.random()*(maxRow+1)), col: Math.floor(Math.random()*(maxCol+1)) };
  }
  const candidates = getRandomCandidates(4, sub);

  await updateDoc(gameRef, {
    gameState: "choosing_secret",
    currentRound: nextRound,
    currentPlayerIndex: nextIdx,
    currentCard: null,
    currentCandidates: candidates,
    currentSubgrid: sub,
    clues: [],
    guesses: {}
  });
});

// ================= Game Over / Leave =================
function showGameOver(data){
  document.getElementById("winner-name").textContent =
    data.players[data.playerOrder.reduce((a,b)=>data.players[a].score>data.players[b].score?a:b)].name;
  gameOverModal.classList.remove("hidden");

  const canvas = document.getElementById("confetti-canvas");
  const shoot = confetti.create(canvas, { resize:true });
  shoot({ particleCount:160, spread:140, origin:{y:0.6} });
}

function confirmLeave(){ playSound("click"); confirmLeaveModal.classList.remove("hidden"); }
async function executeLeave(){
  playSound("click");
  if(unsubscribeGame) unsubscribeGame();
  if(currentUserId===currentHostId && currentGameId){
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    await deleteDoc(gameRef);
  }
  localStorage.removeItem("hues-cues-game");
  currentGameId = null; currentHostId = null;
  confirmLeaveModal.classList.add("hidden");
  showScreen("lobby");
}

async function restartGame(){
  if(!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  if(currentUserId !== data.hostId){ alert("Solo el anfitrión puede reiniciar la partida."); return; }

  const reset = {};
  data.playerOrder.forEach(pid=> reset[pid] = { ...data.players[pid], score:0 });

  await updateDoc(gameRef, { players: reset, gameState: "waiting" });
  gameOverModal.classList.add("hidden");
}

// ================= Utilidades UI =================
function showScreen(name){
  lobbyScreen.classList.add("hidden");
  waitingRoomScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  document.getElementById(`${name}-screen`).classList.remove("hidden");
}

// Host settings guardadas con tope de 25 puntos
document.getElementById("round-limit").addEventListener("change", e=> updateGameSettings({ roundLimit: Math.max(1, parseInt(e.target.value)||1) }));
document.getElementById("score-limit").addEventListener("change", e=> {
  const v = Math.min(25, Math.max(1, parseInt(e.target.value)||1));
  e.target.value = v;
  updateGameSettings({ scoreLimit: v });
});
async function updateGameSettings(newSettings){
  if(!currentGameId) return;
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
  const snap = await getDoc(gameRef);
  const data = snap.data();
  await updateDoc(gameRef, { gameSettings: { ...data.gameSettings, ...newSettings }});
}

// =============== Init ===============
generateColorGrid();
