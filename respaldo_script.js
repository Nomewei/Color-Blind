// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js"
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js"

// Config
const firebaseConfig = {
  apiKey: "AIzaSyAL1RF5XAMknDUlwtDRjC2PByUabkMCDOA",
  authDomain: "color-blind-bca19.firebaseapp.com",
  projectId: "color-blind-bca19",
  storageBucket: "color-blind-bca19.firebasestorage.app",
  messagingSenderId: "876142955211",
  appId: "1:876142955211:web:e2e380a21e17d8e940694e"
}

// Init
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const APP_ID = "hues-and-cues-online"

// Globals
let currentUserId = null
let currentGameId = null
let unsubscribeGame = null
let temporaryGuess = null
let currentHostId = null
let lastRenderedGridKey = ""

const playerColors = ["#E53E3E","#DD6B20","#D69E2E","#38A169","#3182CE","#5A67D8","#805AD5","#D53F8C","#718096","#4A5568"]

const FULL_COLS = 30
const FULL_ROWS = 16
const COORD_LETTERS = "ABCDEFGHIJKLMNOP".split("")

// Paleta exacta 16 x 30
const HEX_MATRIX = [
["#652F0D","#722C0F","#7D2913","#8A2717","#9E291B","#AA291D","#BA2C21","#D23124","#F03225","#FC3022","#FD3221","#FD3223","#FD312B","#FF3139","#FD3044","#F82F51","#F42E64","#F22975","#E72881","#E32D8D","#D43D91","#C74091","#BC4597","#B14594","#A74697","#984696","#904A97","#874997","#80499A","#764A9B"],
["#8D4D1C","#9B4B1D","#A4461E","#B74822","#C44323","#D33C26","#E23925","#F43423","#FC3521","#FD3B28","#FF3D30","#FD3B3A","#FD3541","#FE364A","#FC345D","#FD316F","#FD2B7B","#F92A8E","#E74092","#D74C95","#C85097","#BB4D96","#B04C95","#A54C95","#9D4B97","#934A96","#854A97","#80499A","#764897","#6A4596"],
["#AA6424","#B45E22","#C36023","#CB5724","#D85324","#E24D24","#ED4823","#F94220","#FD482B","#FE4E3D","#FE514B","#FD4E4F","#FD4E5B","#FD4765","#FD4777","#FD4385","#F84895","#E6579A","#D45B99","#C35B9E","#BC589A","#AD5599","#A45299","#99509A","#904E9B","#884A9A","#7C4896","#754795","#6B4397","#5D3993"],
["#D28426","#DF8424","#E57C22","#F37E20","#F17221","#F86820","#FD6B25","#FE6330","#FF5E3A","#FD654F","#FD6C62","#FB6C69","#FD686F","#FD677E","#FA628C","#FA639C","#E8669D","#D867A1","#C56BA4","#BD65A2","#AA60A1","#A35A9F","#9A589E","#90559D","#864F9C","#7E4C99","#71479A","#684097","#5B3D93","#49368C"],
["#EE9A1E","#F89918","#FF9517","#FF9018","#FF8A21","#FF8029","#FE8139","#FE7840","#FE7B50","#FC8263","#FC8272","#FC847F","#FD8487","#FA7F94","#FB7AA5","#F07FA8","#D97EAC","#CD7DAD","#C07CAE","#B272A9","#A369A7","#9963A6","#8F5EA2","#875AA2","#7D529E","#704E9A","#66479C","#5A3B92","#4A3694","#323286"],
["#FFB20D","#FFAF1C","#FFAA25","#FFAC34","#FFA83B","#FFA747","#FF9B52","#FF9559","#FE9060","#FE926F","#FC9781","#FC9990","#FC9896","#FC979F","#FA93B3","#E698BE","#D596BE","#CA95BC","#BC8ABA","#AE82B5","#9F7AB2","#936FAE","#8866A9","#7E61A7","#7459A3","#66519E","#5A499A","#4C3B93","#37368F","#292D7A"],
["#FFBB13","#FFBD22","#FFB525","#FFB434","#FFBA59","#FFAC50","#FFAE61","#FFA769","#FFA775","#FEA782","#FDA693","#FEA597","#FDA7A4","#FBA4A8","#FBA6C0","#E5ACC9","#D3ACCC","#D0B1D1","#B89EC6","#A790C1","#9B88BF","#8B7CB6","#8073B1","#736AAE","#6661AB","#5A5AA7","#4F50A4","#43469C","#2F3B98","#2A3488"],
["#FFCA10","#FFC822","#FFC428","#FFC43A","#FFC443","#FFBE50","#FFBB5C","#FFBA68","#FFB675","#FFB57D","#FFB389","#FEB89A","#F9BBA9","#F7BCB3","#F0BCC8","#DBBBD4","#CFBCDA","#CEBFDE","#B3ABD1","#A6A3CC","#9598C9","#828BC2","#7680C0","#6778BB","#5A6CB3","#5064AF","#465CAB","#3B51A3","#2D47A1","#213D96"],
["#FFD70F","#FFD520","#FFD42C","#FFD33B","#FFD745","#FFD452","#FFD65B","#FED465","#F9D778","#F3DD8E","#EFDA9A","#E7DDAD","#E0DEBE","#DADFC7","#D1DDCF","#C4DAE5","#BED7F1","#BED7F1","#A3C6E9","#95B8E2","#87A9DA","#76A1D7","#6D93CF","#6184C3","#5279BB","#496EB7","#3F63AF","#385BAC","#2F50A4","#24479F"],
["#FBE11C","#FCE020","#FEE32E","#FBE63D","#FAE745","#FCEA55","#F8E964","#F0E87C","#E7E487","#DEE298","#D7E3A9","#CFE3BA","#CFE4C8","#C9E4D0","#C3E2D4","#B7E0E4","#AEDEF0","#AFDFF6","#98D7F6","#7FCEF7","#76C1ED","#6AB0E7","#5EA4DF","#5894D3","#4C88CC","#467BBE","#3B6DB8","#3466B3","#315CAB","#2B51A4"],
["#F9E435","#FAE53A","#F6E541","#F6E547","#F3E456","#EDE562","#E7E175","#DEE080","#D7DD80","#C7D788","#BCD591","#B1D39E","#B0D4AC","#ADD4B4","#A9D4BF","#A9D7D5","#A4D7DE","#A4D7E0","#92D2E5","#81D0EE","#6CCAF6","#5AC2F8","#56B6EB","#51A5DF","#4E98D7","#4387CC","#397BC4","#356EB8","#3164AF","#2D5DAB"],
["#F3DF1B","#F3DF24","#EEDF2C","#E9DE31","#E6DC3C","#DEDB4C","#D1D659","#BFD061","#B1CC6A","#A6C973","#9BC67D","#93C585","#8EC594","#86C39C","#89C5A2","#86C6B0","#88C9C0","#86C9C5","#7DC6C8","#73C7D1","#61C1DB","#4CBFE2","#30BAEF","#2DB0EF","#32A2E4","#3393D8","#3A85CD","#3277C0","#356EB8","#2E64B3"],
["#E0D619","#DBD520","#D8D529","#D2D331","#C9D03C","#B9CA3E","#ADC648","#9CC04C","#8DBD54","#82BA5B","#73B664","#6BB66E","#6AB67A","#65B67F","#67B686","#6AB992","#69BA9C","#6CBCA2","#6EBEA7","#63BCB5","#57B9B9","#4BBAC7","#3CB7CF","#23B3DB","#0CADE8","#14A0E4","#1D94D9","#2F88D1","#2A7AC3","#2570BC"],
["#C1CC25","#BBCA29","#B3C62D","#A9C233","#9EC036","#91BB39","#7CB43C","#75B13D","#66AD3F","#58A544","#4DA548","#47A350","#3FA859","#41A966","#48AB70","#4EAF78","#51AF7E","#54B182","#59B488","#58B58F","#52B49B","#48B4A9","#3CB3B1","#2BB2C0","#1BB0D0","#07ABDA","#01A1E0","#0A9ADF","#188DD4","#1F7FC8"],
["#9CB834","#97B837","#92B639","#85B13C","#7BAE3E","#69A440","#5EA241","#509A42","#489844","#399045","#2D8D45","#279247","#219848","#219D48","#26A153","#2EA459","#39A863","#3DA96E","#41AB70","#49AD74","#4BAF83","#41AF91","#3BB19C","#2EB0A9","#22AFB5","#1BAFC6","#0DADD4","#00A4D7","#009BDC","#0994DD"],
["#789A3B","#759E3E","#6B9A3F","#61963F","#549741","#479142","#3B8B42","#328842","#218243","#177A41","#0F793E","#0A7F42","#0C8847","#0E8E47","#109748","#159C4A","#23A048","#29A254","#31A55D","#36A764","#37A86E","#30A97B","#27AA87","#1FA995","#15AAA0","#0CA9AE","#0CACBE","#06ACCA","#03A8D8","#00A3E4"]
]

// DOM
const lobbyScreen = document.getElementById("lobby-screen")
const waitingRoomScreen = document.getElementById("waiting-room-screen")
const gameScreen = document.getElementById("game-screen")
const colorGrid = document.getElementById("color-grid")
const confirmLeaveModal = document.getElementById("confirm-leave-modal")
const gameOverModal = document.getElementById("game-over-modal")
const roundSummaryModal = document.getElementById("round-summary-modal")
const soundToggle = document.getElementById("sound-toggle")

// Audio simple
let isMuted = true
const actionSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).toDestination()
actionSynth.volume.value = -10

const soundIcons = {
  muted: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  unmuted: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>`
}
soundToggle.addEventListener("click", () => {
  if (isMuted) Tone.start()
  isMuted = !isMuted
  soundToggle.innerHTML = isMuted ? soundIcons.muted : soundIcons.unmuted
})
soundToggle.innerHTML = soundIcons.muted

function play(type) {
  if (isMuted) return
  const now = Tone.now()
  if (type === "click") actionSynth.triggerAttackRelease("C4", "16n", now)
  if (type === "select") actionSynth.triggerAttackRelease("E4", "16n", now)
  if (type === "confirm") actionSynth.triggerAttackRelease("G4", "16n", now)
  if (type === "win") actionSynth.triggerAttackRelease("C5", "8n", now)
}

// Auth
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUserId = user.uid
    const last = JSON.parse(localStorage.getItem("hues-cues-game"))
    if (last && last.gameId) rejoinGame(last.gameId, last.userId)
  } else {
    try { await signInAnonymously(auth) } catch (e) { console.error(e) }
  }
})

// Lobby handlers
document.getElementById("create-game-btn").addEventListener("click", () => { play("click"); createGame() })
document.getElementById("join-game-btn").addEventListener("click", () => { play("click"); joinGame() })
document.getElementById("start-game-btn").addEventListener("click", () => { play("click"); startGame() })
document.getElementById("game-id-display").addEventListener("click", copyGameId)
document.getElementById("exit-lobby-btn").addEventListener("click", executeLeave)
document.getElementById("leave-game-btn").addEventListener("click", confirmLeave)
document.getElementById("confirm-leave-btn").addEventListener("click", executeLeave)
document.getElementById("cancel-leave-btn").addEventListener("click", () => confirmLeaveModal.classList.add("hidden"))
document.getElementById("new-game-btn").addEventListener("click", () => { play("click"); restartGame() })
document.getElementById("next-round-btn").addEventListener("click", nextRound)

// Espera cambios a condiciones
document.getElementById("round-limit").addEventListener("change", e => updateGameSettings({ roundLimit: parseInt(e.target.value) }))
document.getElementById("score-limit").addEventListener("change", e => updateGameSettings({ scoreLimit: parseInt(e.target.value) }))
document.getElementById("grid-size-select").addEventListener("change", e => updateGameSettings({ gridMode: e.target.value }))

// Forbidden palabras
const FORBIDDEN_WORDS = [
  "rojo","verde","azul","amarillo","naranja","morado","violeta","rosa","marrón",
  "negro","blanco","gris","cian","magenta","turquesa","lila","fucsia","celeste",
  "índigo","añil","purpura","escarlata","carmín","granate","oliva","esmeralda",
  "zafiro","cobalto","ocre","siena","beis","beige","crema","dorado","plateado",
  "bronce","cobre","color","tono","matiz","claro","oscuro","brillante","pálido",
  "aguamarina","coral","lavanda","malva","salmón","terracota","caqui"
]

// Utilidades
function hexAt(x, y) { return HEX_MATRIX[y][x] }

function showScreen(name) {
  lobbyScreen.classList.add("hidden")
  waitingRoomScreen.classList.add("hidden")
  gameScreen.classList.add("hidden")
  document.getElementById(`${name}-screen`).classList.remove("hidden")
}

function getPlayerName() {
  const name = document.getElementById("player-name").value.trim()
  if (!name) {
    document.getElementById("lobby-error").textContent = "Por favor, introduce tu nombre."
    return null
  }
  return name
}

function copyGameId() {
  play("click")
  const id = document.getElementById("game-id-display").textContent
  navigator.clipboard.writeText(id).then(() => {
    const el = document.getElementById("game-id-display")
    const old = el.textContent
    el.textContent = "¡Copiado!"
    setTimeout(() => el.textContent = old, 1500)
  })
}

function confirmLeave() {
  play("click")
  confirmLeaveModal.classList.remove("hidden")
}

async function executeLeave() {
  play("click")
  if (unsubscribeGame) unsubscribeGame()
  if (currentUserId === currentHostId && currentGameId) {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
    await deleteDoc(gameRef)
  }
  localStorage.removeItem("hues-cues-game")
  currentGameId = null
  currentHostId = null
  confirmLeaveModal.classList.add("hidden")
  showScreen("lobby")
}

// Crear y unirse
async function createGame() {
  const name = getPlayerName()
  if (!name || !currentUserId) return

  const gameId = Math.random().toString(36).substring(2, 7).toUpperCase()
  currentGameId = gameId
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)

  const newPlayer = { name, color: playerColors[0], score: 0, isHost: true }
  const data = {
    hostId: currentUserId,
    players: { [currentUserId]: newPlayer },
    playerOrder: [currentUserId],
    gameState: "waiting",
    gameSettings: {
      roundLimit: 10,
      scoreLimit: 25,
      gridMode: "30x16"
    },
    createdAt: new Date()
  }

  try {
    await setDoc(gameRef, data)
    localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: currentUserId }))
    subscribeToGame(gameId)
    showScreen("waiting-room")
  } catch (e) { console.error(e) }
}

async function joinGame() {
  const name = getPlayerName()
  if (!name || !currentUserId) return
  const gameId = document.getElementById("join-game-id").value.trim().toUpperCase()
  if (!gameId) {
    document.getElementById("lobby-error").textContent = "Introduce un código."
    return
  }
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)
  const snap = await getDoc(gameRef)
  if (!snap.exists()) {
    document.getElementById("lobby-error").textContent = "Partida no encontrada."
    return
  }
  const data = snap.data()
  if (data.gameState !== "waiting") {
    const entry = Object.entries(data.players).find(([id, p]) => p.name === name)
    if (entry) {
      const existingId = entry[0]
      localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: existingId }))
      rejoinGame(gameId, existingId)
      return
    } else {
      document.getElementById("lobby-error").textContent = "La partida ya ha comenzado."
      return
    }
  }
  if (Object.keys(data.players).length >= 10) {
    document.getElementById("lobby-error").textContent = "La partida está llena."
    return
  }
  const color = playerColors[Object.keys(data.players).length]
  const newPlayer = { name, color, score: 0, isHost: false }
  await updateDoc(gameRef, {
    players: { ...data.players, [currentUserId]: newPlayer },
    playerOrder: [...data.playerOrder, currentUserId]
  })
  localStorage.setItem("hues-cues-game", JSON.stringify({ gameId, userId: currentUserId }))
  currentGameId = gameId
  subscribeToGame(gameId)
  showScreen("waiting-room")
}

async function rejoinGame(gameId, userId) {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)
  const snap = await getDoc(gameRef)
  if (snap.exists()) {
    currentGameId = gameId
    currentUserId = userId
    subscribeToGame(gameId)
  } else {
    localStorage.removeItem("hues-cues-game")
  }
}

function subscribeToGame(gameId) {
  if (unsubscribeGame) unsubscribeGame()
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)
  unsubscribeGame = onSnapshot(gameRef, d => {
    if (!d.exists()) {
      localStorage.removeItem("hues-cues-game")
      alert("El anfitrión ha terminado la partida.")
      executeLeave()
      return
    }
    const data = d.data()
    currentHostId = data.hostId
    updateUI(data)
  })
}

// Grid helpers
function currentGridFromSettings(gameSettings) {
  if (gameSettings.gridMode === "12x8") {
    // el origen se calcula al iniciar cada ronda
    return null
  }
  return { mode: "30x16", originX: 0, originY: 0, cols: FULL_COLS, rows: FULL_ROWS }
}

function pickRandomOrigin(cols, rows) {
  const maxX = FULL_COLS - cols
  const maxY = FULL_ROWS - rows
  return { originX: Math.floor(Math.random() * (maxX + 1)), originY: Math.floor(Math.random() * (maxY + 1)) }
}

function gridKey(g) { return `${g.mode}:${g.originX},${g.originY}:${g.cols}x${g.rows}` }

function ensureGridRendered(g) {
  if (!g) return
  const key = gridKey(g)
  if (key === lastRenderedGridKey) return
  generateColorGrid(g)
  lastRenderedGridKey = key
}

function generateColorGrid(g) {
  colorGrid.innerHTML = ""
  colorGrid.style.setProperty("--grid-cols", g.cols)
  colorGrid.style.setProperty("--grid-rows", g.rows)
  colorGrid.style.gridTemplateColumns = `repeat(${g.cols}, 1fr)`
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      const gx = g.originX + x
      const gy = g.originY + y
      const cell = document.createElement("div")
      cell.className = "color-cell"
      cell.style.backgroundColor = hexAt(gx, gy)
      cell.dataset.x = String(gx)
      cell.dataset.y = String(gy)
      cell.dataset.coords = `${COORD_LETTERS[gy]}${gx + 1}`
      cell.title = cell.dataset.coords
      colorGrid.appendChild(cell)
    }
  }
}

// Inicio de la partida
async function startGame() {
  if (!currentGameId) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const data = snap.data()
  if (data.hostId !== currentUserId) { alert("Solo el creador puede empezar."); return }
  if (Object.keys(data.players).length < 2) { alert("Se necesitan al menos 2 jugadores."); return }

  let grid = null
  if (data.gameSettings.gridMode === "12x8") {
    const origin = pickRandomOrigin(12, 8)
    grid = { mode: "12x8", cols: 12, rows: 8, ...origin }
  } else {
    grid = { mode: "30x16", cols: FULL_COLS, rows: FULL_ROWS, originX: 0, originY: 0 }
  }
  const card = pickRandomCard(grid)
  await updateDoc(gameRef, {
    gameState: "giving_clue_1",
    currentRound: 1,
    currentPlayerIndex: 0,
    currentCard: card,
    currentGrid: grid,
    clues: [],
    guesses: {}
  })
}

function pickRandomCard(grid) {
  const x = grid.originX + Math.floor(Math.random() * grid.cols)
  const y = grid.originY + Math.floor(Math.random() * grid.rows)
  const color = hexAt(x, y)
  return { x, y, color }
}

// UI
function updateUI(gameData) {
  if (gameData.gameState === "waiting") {
    gameOverModal.classList.add("hidden")
    showScreen("waiting-room")

    document.getElementById("game-id-display").textContent = currentGameId
    const list = document.getElementById("player-list")
    list.innerHTML = ""
    gameData.playerOrder.forEach(pid => {
      const p = gameData.players[pid]
      const li = document.createElement("li")
      li.className = "flex items-center"
      li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2 border border-gray-400" style="background-color:${p.color}"></div> ${p.name} ${p.isHost ? "(Host)" : ""}`
      list.appendChild(li)
    })

    const isHost = gameData.hostId === currentUserId
    const gameOptions = document.getElementById("game-options")
    const roundLimitInput = document.getElementById("round-limit")
    const scoreLimitInput = document.getElementById("score-limit")
    const gridSizeSelect = document.getElementById("grid-size-select")
    const limitsDisplay = document.getElementById("game-limits-display")

    if (isHost) {
      gameOptions.classList.remove("hidden")
      limitsDisplay.classList.add("hidden")
      roundLimitInput.disabled = false
      scoreLimitInput.disabled = false
      gridSizeSelect.disabled = false
      roundLimitInput.value = gameData.gameSettings.roundLimit
      scoreLimitInput.value = gameData.gameSettings.scoreLimit
      gridSizeSelect.value = gameData.gameSettings.gridMode || "30x16"
    } else {
      gameOptions.classList.add("hidden")
      limitsDisplay.classList.remove("hidden")
      const mode = gameData.gameSettings.gridMode || "30x16"
      limitsDisplay.textContent = `Jugar a ${gameData.gameSettings.roundLimit} rondas o ${gameData.gameSettings.scoreLimit} puntos. Tablero ${mode}.`
    }

    document.getElementById("start-game-btn").style.display = isHost ? "block" : "none"
    return
  }

  if (gameData.gameState === "gameOver") {
    showGameOver(gameData)
    return
  }

  if (gameData.gameState === "roundSummary") {
    showRoundSummary(gameData)
    return
  }

  roundSummaryModal.classList.add("hidden")
  showScreen("game")

  const playerNames = gameData.playerOrder.map(pid => gameData.players[pid].name)
  const titleEl = document.getElementById("game-title")
  titleEl.textContent = playerNames.length === 2 ? `${playerNames[0]} vs ${playerNames[1]}` : "Partida Grupal"

  renderScores(gameData)
  ensureGridRendered(gameData.currentGrid || currentGridFromSettings(gameData.gameSettings))
  renderBoard(gameData)
  renderGameInfo(gameData)
  renderControls(gameData)
  updateTurnHint(gameData)
}

function renderScores(gameData) {
  const box = document.getElementById("player-scores")
  box.innerHTML = ""
  gameData.playerOrder.forEach(pid => {
    const p = gameData.players[pid]
    const el = document.createElement("div")
    el.className = "flex justify-between items-center p-2 rounded-md"
    el.innerHTML = `
      <div class="flex items-center">
        <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background-color:${p.color}"></div>
        <span class="font-medium">${p.name}</span>
      </div>
      <span class="font-bold text-lg">${p.score}</span>
    `
    box.appendChild(el)
  })
}

function renderBoard(gameData) {
  // limpiar marcadores y resaltados
  document.querySelectorAll(".player-marker, .temp-marker, .secret-color-highlight").forEach(el => {
    if (el.classList.contains("secret-color-highlight")) el.classList.remove("secret-color-highlight")
    else el.remove()
  })
  document.querySelectorAll(".scoring-overlay").forEach(el => el.classList.add("hidden"))

  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const isCueGiver = currentUserId === cueGiverId

  // resaltar color secreto al dador
  if (isCueGiver && !["scoring","gameOver","roundSummary"].includes(gameData.gameState)) {
    const { x, y } = gameData.currentCard
    const secretCell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`)
    if (secretCell) secretCell.classList.add("secret-color-highlight")
  }

  const drawMarker = (guess, player, isTemp = false) => {
    const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`)
    if (!cell) return
    const m = document.createElement("div")
    m.className = isTemp ? "player-marker temp-marker" : "player-marker"
    m.style.backgroundColor = player.color
    m.textContent = player.name.substring(0,1)
    cell.appendChild(m)
  }

  if (gameData.guesses) {
    if (["scoring","gameOver","roundSummary"].includes(gameData.gameState) || isCueGiver) {
      Object.entries(gameData.guesses).forEach(([pid, guesses]) => {
        const p = gameData.players[pid]
        guesses.forEach(g => drawMarker(g, p))
      })
    } else {
      const mine = gameData.guesses[currentUserId] || []
      const me = gameData.players[currentUserId]
      mine.forEach(g => drawMarker(g, me))
    }
  }

  if (temporaryGuess) drawMarker(temporaryGuess, gameData.players[currentUserId], true)

  if (["scoring","gameOver","roundSummary"].includes(gameData.gameState)) {
    const { x, y } = gameData.currentCard
    const relX = x - gameData.currentGrid.originX
    const relY = y - gameData.currentGrid.originY
    const anyCell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`)
    if (!anyCell) return
    const cw = anyCell.offsetWidth
    const ch = anyCell.offsetHeight
    const gap = 1

    function drawBox(size, id) {
      const box = document.getElementById(id)
      if (!box) return
      const left = (relX - Math.floor(size / 2)) * (cw + gap)
      const top = (relY - Math.floor(size / 2)) * (ch + gap)
      box.style.left = `${left}px`
      box.style.top = `${top}px`
      box.style.width = `${size * (cw + gap) - gap}px`
      box.style.height = `${size * (ch + gap) - gap}px`
      box.classList.remove("hidden")
    }

    drawBox(1, "scoring-box-3")
    drawBox(3, "scoring-box-2")
    drawBox(5, "scoring-box-1")
  }
}

function renderGameInfo(gameData) {
  const info = document.getElementById("game-info")
  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const cueGiver = gameData.players[cueGiverId]

  let html = `<p><strong>Ronda:</strong> ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}</p>`
  html += `<p><strong>Dador de pista:</strong> ${cueGiver.name}</p>`

  if (gameData.gameState.includes("guessing")) {
    const required = gameData.gameState === "guessing_1" ? 1 : 2
    const toGuess = gameData.playerOrder
      .filter(pid => pid !== cueGiverId)
      .filter(pid => (gameData.guesses[pid]?.length || 0) < required)
      .map(pid => gameData.players[pid].name)
    html += toGuess.length > 0
      ? `<p class="text-yellow-400 font-semibold">Turno de adivinar de:<br>${toGuess.join(", ")}</p>`
      : `<p class="text-gray-400 font-semibold">Todos han adivinado.</p>`
  } else if (gameData.gameState.includes("giving_clue")) {
    html += `<p class="text-cyan-400 font-semibold">Esperando pista de ${cueGiver.name}...</p>`
  } else if (gameData.gameState === "scoring") {
    html += `<p class="text-green-400 font-semibold">Puntuando...</p>`
  }

  info.innerHTML = html

  document.getElementById("clue-display").innerHTML =
    (gameData.clues || []).map(c => `<span>${c}</span>`).join("")

  const cueView = document.getElementById("cue-giver-view")
  if (currentUserId === cueGiverId && gameData.gameState !== "scoring") {
    cueView.classList.remove("hidden")
    document.getElementById("secret-color-display").style.backgroundColor = gameData.currentCard.color
    document.getElementById("secret-color-coords").textContent = `${COORD_LETTERS[gameData.currentCard.y]}${gameData.currentCard.x + 1}`
  } else {
    cueView.classList.add("hidden")
  }
}

function renderControls(gameData) {
  const ctr = document.getElementById("controls")
  ctr.innerHTML = ""
  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const isCueGiver = currentUserId === cueGiverId

  if (isCueGiver) {
    switch (gameData.gameState) {
      case "giving_clue_1":
        if ((gameData.clues || []).length === 0) {
          ctr.innerHTML = createClueInputHTML(1)
          document.getElementById("submit-clue-btn").onclick = () => submitClue(1)
        }
        break
      case "giving_clue_2":
        if ((gameData.clues || []).length === 1) {
          ctr.innerHTML = createClueInputHTML(2)
          document.getElementById("submit-clue-btn").onclick = () => submitClue(2)
        }
        break
      case "guessing_1":
      case "guessing_2":
        const guessers = gameData.playerOrder.filter(id => id !== cueGiverId)
        const req = gameData.gameState === "guessing_1" ? 1 : 2
        const all = guessers.every(id => (gameData.guesses[id]?.length || 0) >= req)
        if (all) {
          ctr.innerHTML = `<button id="reveal-btn" class="btn-primary" style="background-color:#ef4444">Revelar Color</button>`
          document.getElementById("reveal-btn").onclick = reveal
        } else {
          ctr.innerHTML = `<p class="text-gray-400">Esperando que los demás adivinen...</p>`
        }
        break
    }
  } else {
    const mine = gameData.guesses?.[currentUserId] || []
    const canGuess =
      (gameData.gameState === "guessing_1" && mine.length === 0) ||
      (gameData.gameState === "guessing_2" && mine.length === 1)

    if (temporaryGuess) {
      const cell = colorGrid.querySelector(`[data-x='${temporaryGuess.x}'][data-y='${temporaryGuess.y}']`)
      const tempColor = cell ? cell.style.backgroundColor : "#000"
      ctr.innerHTML = `
        <div class="flex items-center justify-center gap-4">
          <div class="color-preview" style="background-color:${tempColor}"></div>
          <button id="confirm-guess-btn" class="btn-primary">Confirmar Elección</button>
        </div>
      `
      document.getElementById("confirm-guess-btn").onclick = confirmGuess
    } else if (canGuess) {
      ctr.innerHTML = `<p class="text-gray-400">Selecciona un color en el tablero.</p>`
    } else {
      ctr.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`
    }
  }
}

function createClueInputHTML(num) {
  const c = document.createElement("div")
  c.className = "flex justify-center items-center gap-2"
  c.innerHTML = `
    <input type="text" id="clue-input" class="input-field" placeholder="Pista de 1 palabra">
    <button id="submit-clue-btn" class="btn-primary">Dar pista ${num}</button>
  `
  c.querySelector("#clue-input").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault()
      submitClue(num)
    }
  })
  return c.innerHTML
}

async function submitClue(num) {
  const input = document.getElementById("clue-input")
  const text = input.value.trim()
  const first = text.toLowerCase().split(" ")[0]
  if (!first) return
  if (FORBIDDEN_WORDS.includes(first)) {
    alert(`La palabra "${first}" no está permitida.`)
    input.value = ""
    return
  }
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const data = (await getDoc(gameRef)).data()
  await updateDoc(gameRef, {
    clues: [...(data.clues || []), text.split(" ")[0]],
    gameState: `guessing_${num}`
  })
}

colorGrid.addEventListener("click", handleGridClick)

async function handleGridClick(e) {
  const cell = e.target.closest(".color-cell")
  if (!cell) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  if (!snap.exists()) return
  const data = snap.data()

  const cueGiverId = data.playerOrder[data.currentPlayerIndex]
  if (currentUserId === cueGiverId) return

  const mine = data.guesses?.[currentUserId] || []
  const canGuess =
    (data.gameState === "guessing_1" && mine.length === 0) ||
    (data.gameState === "guessing_2" && mine.length === 1)
  if (!canGuess) return

  play("select")
  temporaryGuess = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) }
  renderBoard(data)
  renderControls(data)
}

async function confirmGuess() {
  if (!temporaryGuess) return
  play("confirm")
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const data = snap.data()
  const mine = data.guesses?.[currentUserId] || []
  const updated = { ...data.guesses, [currentUserId]: [...mine, temporaryGuess] }
  temporaryGuess = null
  await updateDoc(gameRef, { guesses: updated })

  const guessers = data.playerOrder.filter(id => id !== data.playerOrder[data.currentPlayerIndex])
  const req = data.gameState === "guessing_1" ? 1 : 2
  const all = guessers.every(id => (updated[id]?.length || 0) >= req)
  if (all && data.gameState === "guessing_1") {
    await updateDoc(gameRef, { gameState: "giving_clue_2" })
  }
}

async function reveal() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  await updateDoc(gameRef, { gameState: "scoring" })
  setTimeout(calculateAndShowScores, 1600)
}

async function calculateAndShowScores() {
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const data = snap.data()

  const { x: tx, y: ty } = data.currentCard
  const cueGiverId = data.playerOrder[data.currentPlayerIndex]
  let cueGiverPoints = 0
  const roundPoints = {}
  const players = JSON.parse(JSON.stringify(data.players))
  Object.keys(players).forEach(pid => roundPoints[pid] = { name: players[pid].name, points: 0 })

  Object.entries(data.guesses).forEach(([pid, guesses]) => {
    let sum = 0
    guesses.forEach(g => {
      const dx = Math.abs(g.x - tx)
      const dy = Math.abs(g.y - ty)
      let pts = 0
      if (dx === 0 && dy === 0) pts = 3
      else if (dx <= 1 && dy <= 1) pts = 2
      else if (dx <= 2 && dy <= 2) pts = 1
      sum += pts
      if (pid !== cueGiverId && dx <= 1 && dy <= 1) cueGiverPoints++
    })
    players[pid].score += sum
    roundPoints[pid].points = sum
  })

  players[cueGiverId].score += cueGiverPoints
  roundPoints[cueGiverId].points = cueGiverPoints

  await updateDoc(gameRef, { players, lastRoundSummary: roundPoints })

  const winner = Object.values(players).find(p => p.score >= data.gameSettings.scoreLimit)
  const roundLimitReached = data.currentRound >= data.gameSettings.roundLimit
  if (winner || roundLimitReached) {
    await updateDoc(gameRef, { gameState: "gameOver" })
  } else {
    await updateDoc(gameRef, { gameState: "roundSummary" })
  }
}

function showRoundSummary(data) {
  const content = document.getElementById("summary-content")
  const title = document.getElementById("summary-title")
  title.textContent = `Fin de la Ronda ${data.currentRound} / ${data.gameSettings.roundLimit}`
  content.innerHTML = Object.values(data.lastRoundSummary).map(p => `<p><strong>${p.name}:</strong> +${p.points} puntos</p>`).join("")
  roundSummaryModal.classList.remove("hidden")
}

async function nextRound() {
  play("click")
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const data = snap.data()

  const nextPlayerIndex = (data.currentPlayerIndex + 1) % data.playerOrder.length
  const nextRoundNum = nextPlayerIndex === 0 ? data.currentRound + 1 : data.currentRound

  let grid = null
  if ((data.gameSettings.gridMode || "30x16") === "12x8") {
    const origin = pickRandomOrigin(12, 8)
    grid = { mode: "12x8", cols: 12, rows: 8, ...origin }
  } else {
    grid = { mode: "30x16", cols: FULL_COLS, rows: FULL_ROWS, originX: 0, originY: 0 }
  }

  await updateDoc(gameRef, {
    gameState: "giving_clue_1",
    currentRound: nextRoundNum,
    currentPlayerIndex: nextPlayerIndex,
    currentCard: pickRandomCard(grid),
    currentGrid: grid,
    clues: [],
    guesses: {}
  })
}

function showGameOver(data) {
  const winner = data.playerOrder.reduce((a, b) => data.players[a].score > data.players[b].score ? a : b)
  document.getElementById("winner-name").textContent = data.players[winner].name
  gameOverModal.classList.remove("hidden")
  play("win")
  const canvas = document.getElementById("confetti-canvas")
  const myConfetti = confetti.create(canvas, { resize: true })
  myConfetti({ particleCount: 200, spread: 160, origin: { y: 0.6 } })
}

async function restartGame() {
  if (!currentGameId) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const data = snap.data()
  if (currentUserId !== data.hostId) { alert("Solo el anfitrión puede reiniciar la partida."); return }

  const resetPlayers = {}
  data.playerOrder.forEach(pid => { resetPlayers[pid] = { ...data.players[pid], score: 0 } })
  await updateDoc(gameRef, { players: resetPlayers, gameState: "waiting" })
  gameOverModal.classList.add("hidden")
}

// Actualizar settings
async function updateGameSettings(newSettings) {
  if (!currentGameId) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const data = (await getDoc(gameRef)).data()
  await updateDoc(gameRef, { gameSettings: { ...data.gameSettings, ...newSettings } })
}

// Turn hint
function updateTurnHint(gameData) {
  const hint = document.getElementById("turn-hint")
  if (!hint) return
  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const isCueGiver = currentUserId === cueGiverId
  const mine = gameData.guesses?.[currentUserId] || []
  const canGuess =
    (gameData.gameState === "guessing_1" && mine.length === 0) ||
    (gameData.gameState === "guessing_2" && mine.length === 1)

  let msg = ""
  if (gameData.gameState === "giving_clue_1" || gameData.gameState === "giving_clue_2") {
    msg = isCueGiver ? "Es tu turno. Da la pista" : `Esperando pista de ${gameData.players[cueGiverId].name}`
  } else if (gameData.gameState === "guessing_1" || gameData.gameState === "guessing_2") {
    msg = isCueGiver ? "Mirando elecciones" : (canGuess ? "Es tu turno. Toca un color" : "Espera tu turno o la siguiente pista")
  } else if (gameData.gameState === "scoring") {
    msg = "Revelando y puntuando"
  } else {
    msg = ""
  }
  if (msg) {
    hint.textContent = msg
    hint.classList.remove("hidden")
  } else {
    hint.classList.add("hidden")
  }
}
