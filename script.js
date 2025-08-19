// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js"
import { getFirestore, setLogLevel, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"
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
const APP_ID = 'hues-and-cues-online'

// Estado
let currentUserId = null
let currentGameId = null
let unsubscribeGame = null
let temporaryGuess = null
let currentHostId = null

const playerColors = ['#E53E3E','#DD6B20','#D69E2E','#38A169','#3182CE','#5A67D8','#805AD5','#D53F8C','#718096','#4A5568']

// Tamaño oficial del tablero 30x16
const GRID_COLS = 30
const GRID_ROWS = 16
const COORD_LETTERS = 'ABCDEFGHIJKLMNOP'.split('')

// Paleta exacta por filas A a P y 30 columnas
const PALETTE = {
  A: ['#ff0000','#ff3500','#ff6a00','#ff9e00','#ffd300','#f6ff00','#c1ff00','#8dff00','#58ff00','#23ff00','#00ff12','#00ff46','#00ff7b','#00ffb0','#00ffe5','#00e5ff','#00b0ff','#007bff','#0046ff','#0012ff','#2300ff','#5800ff','#8d00ff','#c100ff','#f600ff','#ff00d3','#ff009e','#ff006a','#ff0035','#ff0000'],
  B: ['#ff0f0f','#ff410f','#ff720f','#ffa40f','#ffd60f','#f7ff0f','#c5ff0f','#94ff0f','#62ff0f','#30ff0f','#0fff20','#0fff51','#0fff83','#0fffb5','#0fffe6','#0fe6ff','#0fb5ff','#0f83ff','#0f51ff','#0f20ff','#300fff','#620fff','#940fff','#c50fff','#f70fff','#ff0fd6','#ff0fa4','#ff0f72','#ff0f41','#ff0f0f'],
  C: ['#ff1f1f','#ff4d1f','#ff7b1f','#ffaa1f','#ffd81f','#f7ff1f','#c9ff1f','#9aff1f','#6cff1f','#3eff1f','#1fff2e','#1fff5d','#1fff8b','#1fffb9','#1fffe8','#1fe8ff','#1fb9ff','#1f8bff','#1f5dff','#1f2eff','#3e1fff','#6c1fff','#9a1fff','#c91fff','#f71fff','#ff1fd8','#ff1faa','#ff1f7b','#ff1f4d','#ff1f1f'],
  D: ['#ff2e2e','#ff592e','#ff842e','#ffb02e','#ffdb2e','#f8ff2e','#cdff2e','#a1ff2e','#76ff2e','#4bff2e','#2eff3c','#2eff68','#2eff93','#2effbe','#2effe9','#2ee9ff','#2ebeff','#2e93ff','#2e68ff','#2e3cff','#4b2eff','#762eff','#a12eff','#cd2eff','#f82eff','#ff2edb','#ff2eb0','#ff2e84','#ff2e59','#ff2e2e'],
  E: ['#ff3d3d','#ff653d','#ff8d3d','#ffb53d','#ffde3d','#f8ff3d','#d0ff3d','#a8ff3d','#80ff3d','#58ff3d','#3dff4b','#3dff73','#3dff9b','#3dffc3','#3dffeb','#3debff','#3dc3ff','#3d9bff','#3d73ff','#3d4bff','#583dff','#803dff','#a83dff','#d03dff','#f83dff','#ff3dde','#ff3db5','#ff3d8d','#ff3d65','#ff3d3d'],
  F: ['#ff4d4d','#ff714d','#ff964d','#ffbb4d','#ffe04d','#f9ff4d','#d4ff4d','#afff4d','#8aff4d','#65ff4d','#4dff59','#4dff7e','#4dffa3','#4dffc8','#4dffed','#4dedff','#4dc8ff','#4da3ff','#4d7eff','#4d59ff','#654dff','#8a4dff','#af4dff','#d44dff','#f94dff','#ff4de0','#ff4dbb','#ff4d96','#ff4d71','#ff4d4d'],
  G: ['#ff5c5c','#ff7e5c','#ff9f5c','#ffc15c','#ffe35c','#f9ff5c','#d8ff5c','#b6ff5c','#94ff5c','#72ff5c','#5cff67','#5cff89','#5cffab','#5cffcc','#5cffee','#5ceeff','#5cccff','#5cabff','#5c89ff','#5c67ff','#725cff','#945cff','#b65cff','#d85cff','#f95cff','#ff5ce3','#ff5cc1','#ff5c9f','#ff5c7e','#ff5c5c'],
  H: ['#ff6b6b','#ff8a6b','#ffa86b','#ffc76b','#ffe66b','#faff6b','#dbff6b','#bdff6b','#9eff6b','#7fff6b','#6bff75','#6bff94','#6bffb2','#6bffd1','#6bfff0','#6bf0ff','#6bd1ff','#6bb2ff','#6b94ff','#6b75ff','#7f6bff','#9e6bff','#bd6bff','#db6bff','#fa6bff','#ff6be5','#ff6bc7','#ff6ba8','#ff6b8a','#ff6b6b'],
  I: ['#ff7a7a','#ff967a','#ffb17a','#ffcd7a','#ffe87a','#faff7a','#dfff7a','#c4ff7a','#a8ff7a','#8dff7a','#7aff84','#7aff9f','#7affba','#7affd6','#7afff1','#7af1ff','#7ad6ff','#7abaff','#7a9fff','#7a84ff','#8d7aff','#a87aff','#c47aff','#df7aff','#fa7aff','#ff7ae8','#ff7acd','#ff7ab1','#ff7a96','#ff7a7a'],
  J: ['#ff8a8a','#ffa28a','#ffba8a','#ffd38a','#ffeb8a','#fbff8a','#e3ff8a','#caff8a','#b2ff8a','#9aff8a','#8aff92','#8affaa','#8affc2','#8affdb','#8afff3','#8af3ff','#8adbff','#8ac2ff','#8aaaff','#8a92ff','#9a8aff','#b28aff','#ca8aff','#e38aff','#fb8aff','#ff8aeb','#ff8ad3','#ff8aba','#ff8aa2','#ff8a8a'],
  K: ['#ff9999','#ffae99','#ffc399','#ffd899','#ffed99','#fbff99','#e6ff99','#d1ff99','#bcff99','#a7ff99','#99ffa0','#99ffb5','#99ffca','#99ffdf','#99fff4','#99f4ff','#99dfff','#99caff','#99b5ff','#99a0ff','#a799ff','#bc99ff','#d199ff','#e699ff','#fb99ff','#ff99ed','#ff99d8','#ff99c3','#ff99ae','#ff9999'],
  L: ['#ffa8a8','#ffbaa8','#ffcca8','#ffdea8','#fff0a8','#fcffa8','#eaffa8','#d8ffa8','#c6ffa8','#b4ffa8','#a8ffae','#a8ffc0','#a8ffd2','#a8ffe4','#a8fff6','#a8f6ff','#a8e4ff','#a8d2ff','#a8c0ff','#a8aeff','#b4a8ff','#c6a8ff','#d8a8ff','#eaa8ff','#fca8ff','#ffa8f0','#ffa8de','#ffa8cc','#ffa8ba','#ffa8a8'],
  M: ['#ffb8b8','#ffc6b8','#ffd5b8','#ffe4b8','#fff3b8','#fdffb8','#eeffb8','#dfffb8','#d0ffb8','#c1ffb8','#b8ffbd','#b8ffcb','#b8ffda','#b8ffe9','#b8fff8','#b8f8ff','#b8e9ff','#b8daff','#b8cbff','#b8bdff','#c1b8ff','#d0b8ff','#dfb8ff','#eeb8ff','#fdb8ff','#ffb8f3','#ffb8e4','#ffb8d5','#ffb8c6','#ffb8b8'],
  N: ['#ffc7c7','#ffd3c7','#ffdec7','#ffeac7','#fff5c7','#fdffc7','#f1ffc7','#e6ffc7','#daffc7','#cfffc7','#c7ffcb','#c7ffd6','#c7ffe2','#c7ffee','#c7fff9','#c7f9ff','#c7eeff','#c7e2ff','#c7d6ff','#c7cbff','#cfc7ff','#dac7ff','#e6c7ff','#f1c7ff','#fdc7ff','#ffc7f5','#ffc7ea','#ffc7de','#ffc7d3','#ffc7c7'],
  O: ['#ffd6d6','#ffdfd6','#ffe7d6','#fff0d6','#fff8d6','#feffd6','#f5ffd6','#edffd6','#e4ffd6','#dcffd6','#d6ffd9','#d6ffe1','#d6ffea','#d6fff2','#d6fffb','#d6fbff','#d6f2ff','#d6eaff','#d6e1ff','#d6d9ff','#dcd6ff','#e4d6ff','#edd6ff','#f5d6ff','#fed6ff','#ffd6f8','#ffd6f0','#ffd6e7','#ffd6df','#ffd6d6'],
  P: ['#ffe5e5','#ffebe5','#fff0e5','#fff5e5','#fffbe5','#feffe5','#f9ffe5','#f4ffe5','#eeffe5','#e9ffe5','#e5ffe7','#e5ffed','#e5fff2','#e5fff7','#e5fffc','#e5fcff','#e5f7ff','#e5f2ff','#e5edff','#e5e7ff','#e9e5ff','#eee5ff','#f4e5ff','#f9e5ff','#fee5ff','#ffe5fb','#ffe5f5','#ffe5f0','#ffe5eb','#ffe5e5']
}

// Utilidad para obtener color por x y
function getColorByXY(x, y) {
  const rowLetter = COORD_LETTERS[y]
  return PALETTE[rowLetter][x]
}

// Elementos del DOM
const lobbyScreen = document.getElementById('lobby-screen')
const waitingRoomScreen = document.getElementById('waiting-room-screen')
const gameScreen = document.getElementById('game-screen')
const colorGrid = document.getElementById('color-grid')
const confirmLeaveModal = document.getElementById('confirm-leave-modal')
const gameOverModal = document.getElementById('game-over-modal')
const roundSummaryModal = document.getElementById('round-summary-modal')
const soundToggle = document.getElementById('sound-toggle')

// Audio
let isMuted = true
let music
const musicSynth = new Tone.PolySynth(Tone.Synth, { oscillator:{type:"triangle"}, envelope:{attack:0.02,decay:0.1,sustain:0.3,release:1} }).toDestination()
musicSynth.volume.value = -24
const actionSynth = new Tone.Synth({ oscillator:{type:"sine"}, envelope:{attack:0.005,decay:0.1,sustain:0,release:0.1} }).toDestination()
actionSynth.volume.value = -10
const soundIcons = {
  muted:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
  unmuted:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>`
}
function playSound(t){ if(isMuted) return; const n=Tone.now(); if(t==='click') actionSynth.triggerAttackRelease("C4","16n",n); else if(t==='select') actionSynth.triggerAttackRelease("C5","16n",n); else if(t==='confirm') actionSynth.triggerAttackRelease("G5","16n",n); else if(t==='start'){ actionSynth.triggerAttackRelease("C4","8n",n); actionSynth.triggerAttackRelease("G4","8n",n+0.1); actionSynth.triggerAttackRelease("C5","8n",n+0.2) } else if(t==='win'){ actionSynth.triggerAttackRelease("G5","8n",n); actionSynth.triggerAttackRelease("C6","8n",n+0.1) } else if(t==='success'){ actionSynth.triggerAttackRelease("C5","16n",n); actionSynth.triggerAttackRelease("E5","16n",n+0.1); actionSynth.triggerAttackRelease("G5","16n",n+0.2) } else if(t==='failure') actionSynth.triggerAttackRelease("A3","8n",n) }
function toggleMusic(){ if(isMuted){ Tone.start(); if(!music){ const notes=["C4","E4","G4","B4","C5","B4","G4","E4"]; let i=0; music=new Tone.Loop(time=>{ musicSynth.triggerAttackRelease(notes[i%notes.length],"8n",time); i++ },"8n").start(0) } Tone.Transport.start(); isMuted=false; soundToggle.innerHTML=soundIcons.unmuted } else { Tone.Transport.stop(); isMuted=true; soundToggle.innerHTML=soundIcons.muted } }
soundToggle.addEventListener('click', toggleMusic)
soundToggle.innerHTML = soundIcons.muted

// Auth
onAuthStateChanged(auth, async user=>{
  if (user){
    currentUserId = user.uid
    const last = JSON.parse(localStorage.getItem('hues-cues-game'))
    if (last && last.gameId) rejoinGame(last.gameId, last.userId)
  } else {
    try { await signInAnonymously(auth) } catch(e){ console.error("Error en la autenticación anónima:", e) }
  }
})

// Lobby y salida
function confirmLeave(){ playSound('click'); confirmLeaveModal.classList.remove('hidden') }
function cancelLeave(){ playSound('click'); confirmLeaveModal.classList.add('hidden') }
async function executeLeave(){
  playSound('click')
  if (unsubscribeGame) unsubscribeGame()
  if (currentUserId === currentHostId && currentGameId){
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
    await deleteDoc(gameRef)
  }
  localStorage.removeItem('hues-cues-game')
  currentGameId = null
  currentHostId = null
  confirmLeaveModal.classList.add('hidden')
  showScreen('lobby')
}
document.getElementById('create-game-btn').addEventListener('click', ()=>{ playSound('click'); createGame() })
document.getElementById('join-game-btn').addEventListener('click', ()=>{ playSound('click'); joinGame() })
document.getElementById('start-game-btn').addEventListener('click', ()=>{ playSound('start'); startGame() })
document.getElementById('game-id-display').addEventListener('click', copyGameId)
document.getElementById('exit-lobby-btn').addEventListener('click', executeLeave)
document.getElementById('leave-game-btn').addEventListener('click', confirmLeave)
document.getElementById('confirm-leave-btn').addEventListener('click', executeLeave)
document.getElementById('cancel-leave-btn').addEventListener('click', cancelLeave)
document.getElementById('new-game-btn').addEventListener('click', ()=>{ playSound('start'); restartGame() })

function getPlayerName(){
  const name = document.getElementById('player-name').value.trim()
  if (!name){
    document.getElementById('lobby-error').textContent = 'Por favor, introduce tu nombre.'
    return null
  }
  return name
}

async function createGame(){
  const playerName = getPlayerName()
  if (!playerName || !currentUserId) return

  const gameId = Math.random().toString(36).substring(2,7).toUpperCase()
  currentGameId = gameId
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)

  const newPlayer = { name: playerName, color: playerColors[0], score: 0, isHost: true }
  const gameData = {
    hostId: currentUserId,
    players: { [currentUserId]: newPlayer },
    playerOrder: [currentUserId],
    gameState: 'waiting',
    gameSettings: { roundLimit: 10, scoreLimit: 25 },
    createdAt: new Date()
  }

  try {
    await setDoc(gameRef, gameData)
    localStorage.setItem('hues-cues-game', JSON.stringify({ gameId, userId: currentUserId }))
    subscribeToGame(gameId)
    showScreen('waiting-room')
  } catch (e) {
    console.error("Error al crear la partida:", e)
  }
}

async function joinGame(){
  const playerName = getPlayerName()
  if (!playerName || !currentUserId) return

  const gameId = document.getElementById('join-game-id').value.trim().toUpperCase()
  if (!gameId){
    document.getElementById('lobby-error').textContent = 'Introduce un código.'
    return
  }

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)
  const gameSnap = await getDoc(gameRef)
  if (!gameSnap.exists()){
    document.getElementById('lobby-error').textContent = 'Partida no encontrada.'
    return
  }

  const gameData = gameSnap.data()
  if (gameData.gameState !== 'waiting'){
    const entry = Object.entries(gameData.players).find(([id,p])=> p.name === playerName)
    if (entry){
      const pid = entry[0]
      localStorage.setItem('hues-cues-game', JSON.stringify({ gameId, userId: pid }))
      rejoinGame(gameId, pid)
      return
    } else {
      document.getElementById('lobby-error').textContent = 'La partida ya ha comenzado.'
      return
    }
  }

  if (Object.keys(gameData.players).length >= 10){
    document.getElementById('lobby-error').textContent = 'La partida está llena.'
    return
  }

  const newColor = playerColors[Object.keys(gameData.players).length]
  const newPlayer = { name: playerName, color: newColor, score: 0, isHost: false }
  const updatedPlayers = { ...gameData.players, [currentUserId]: newPlayer }
  const updatedOrder = [...gameData.playerOrder, currentUserId]

  try {
    await updateDoc(gameRef, { players: updatedPlayers, playerOrder: updatedOrder })
    localStorage.setItem('hues-cues-game', JSON.stringify({ gameId, userId: currentUserId }))
    currentGameId = gameId
    subscribeToGame(gameId)
    showScreen('waiting-room')
  } catch(e){ console.error("Error al unirse:", e) }
}

async function rejoinGame(gameId, userId){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)
  const snap = await getDoc(gameRef)
  if (snap.exists()){
    currentGameId = gameId
    currentUserId = userId
    subscribeToGame(gameId)
  } else {
    localStorage.removeItem('hues-cues-game')
  }
}

function subscribeToGame(gameId){
  if (unsubscribeGame) unsubscribeGame()
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId)
  unsubscribeGame = onSnapshot(gameRef, d=>{
    if (d.exists()){
      const gameData = d.data()
      currentHostId = gameData.hostId
      updateUI(gameData)
    } else {
      localStorage.removeItem('hues-cues-game')
      alert("El anfitrión ha terminado la partida.")
      executeLeave()
    }
  })
}

function copyGameId(){
  playSound('click')
  const code = document.getElementById('game-id-display').textContent
  navigator.clipboard.writeText(code).then(()=>{
    const el = document.getElementById('game-id-display')
    const original = el.textContent
    el.textContent = '¡Copiado!'
    setTimeout(()=> el.textContent = original, 1500)
  })
}

// =========== GRID CON PALETA EXACTA ===========
function generateColorGrid(){
  colorGrid.innerHTML = ''
  for (let y = 0; y < GRID_ROWS; y++){
    for (let x = 0; x < GRID_COLS; x++){
      const cell = document.createElement('div')
      cell.classList.add('color-cell')

      const color = getColorByXY(x, y)
      cell.style.backgroundColor = color

      cell.dataset.x = x
      cell.dataset.y = y
      cell.dataset.coords = `${COORD_LETTERS[y]}${x + 1}`
      cell.title = `${COORD_LETTERS[y]}${x + 1}`

      colorGrid.appendChild(cell)
    }
  }
}

// Carta secreta leyendo desde la misma paleta
function pickRandomCard(){
  const x = Math.floor(Math.random() * GRID_COLS)
  const y = Math.floor(Math.random() * GRID_ROWS)
  return { x, y, color: getColorByXY(x, y) }
}
// ==============================================

async function startGame(){
  if (!currentGameId) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const gameData = snap.data()

  if (gameData.hostId !== currentUserId){ alert("Solo el creador puede empezar."); return }
  if (Object.keys(gameData.players).length < 2){ alert("Se necesitan al menos 2 jugadores."); return }

  const newCard = pickRandomCard()
  await updateDoc(gameRef, {
    gameState: 'giving_clue_1',
    currentRound: 1,
    currentPlayerIndex: 0,
    currentCard: newCard,
    clues: [],
    guesses: {}
  })
}

function updateUI(gameData){
  if (gameData.gameState === 'waiting'){
    gameOverModal.classList.add('hidden')
    showScreen('waiting-room')
    document.getElementById('game-id-display').textContent = currentGameId

    const list = document.getElementById('player-list')
    list.innerHTML = ''
    gameData.playerOrder.forEach(pid=>{
      const p = gameData.players[pid]
      const li = document.createElement('li')
      li.className = 'flex items-center'
      li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2" style="background-color:${p.color}"></div> ${p.name} ${p.isHost ? '(Host)' : ''}`
      list.appendChild(li)
    })

    const isHost = gameData.hostId === currentUserId
    const opts = document.getElementById('game-options')
    const roundLimitInput = document.getElementById('round-limit')
    const scoreLimitInput = document.getElementById('score-limit')
    const limits = document.getElementById('game-limits-display')

    if (isHost){
      opts.classList.remove('hidden')
      limits.classList.add('hidden')
      roundLimitInput.disabled = false
      scoreLimitInput.disabled = false
      roundLimitInput.value = gameData.gameSettings.roundLimit
      scoreLimitInput.value = gameData.gameSettings.scoreLimit
    } else {
      opts.classList.add('hidden')
      limits.classList.remove('hidden')
      limits.textContent = `Jugar a ${gameData.gameSettings.roundLimit} rondas o ${gameData.gameSettings.scoreLimit} puntos.`
    }
    document.getElementById('start-game-btn').style.display = isHost ? 'block' : 'none'
    return
  }

  if (gameData.gameState === 'gameOver'){ showGameOver(gameData); return }
  if (gameData.gameState === 'roundSummary'){ showRoundSummary(gameData); return }

  roundSummaryModal.classList.add('hidden')
  showScreen('game')

  const title = document.getElementById('game-title')
  const names = gameData.playerOrder.map(pid=>gameData.players[pid].name)
  title.textContent = names.length === 2 ? `${names[0]} vs ${names[1]}` : 'Partida Grupal'

  renderScores(gameData)
  renderBoard(gameData)
  renderGameInfo(gameData)
  renderControls(gameData)
}

function renderScores(gameData){
  const c = document.getElementById('player-scores')
  c.innerHTML = ''
  gameData.playerOrder.forEach(pid=>{
    const p = gameData.players[pid]
    const row = document.createElement('div')
    row.className = 'flex justify-between items-center p-2 rounded-md'
    row.innerHTML = `
      <div class="flex items-center">
        <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background-color:${p.color}"></div>
        <span class="font-medium">${p.name}</span>
      </div>
      <span class="font-bold text-lg">${p.score}</span>
    `
    c.appendChild(row)
  })
}

function renderBoard(gameData){
  document.querySelectorAll('.player-marker, .temp-marker, .secret-color-highlight').forEach(el=>{
    if (el.classList.contains('secret-color-highlight')) el.classList.remove('secret-color-highlight')
    else el.remove()
  })
  document.querySelectorAll('.scoring-overlay').forEach(el=> el.classList.add('hidden'))

  const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const isCueGiver = currentUserId === cueGiverId

  const drawMarker = (guess, player, temp=false)=>{
    const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`)
    if (!cell || !player) return
    const m = document.createElement('div')
    m.className = temp ? 'player-marker temp-marker' : 'player-marker'
    m.style.backgroundColor = player.color
    m.textContent = player.name.substring(0,1)
    cell.appendChild(m)
  }

  if (isCueGiver && gameData.gameState !== 'scoring' && gameData.gameState !== 'gameOver' && gameData.gameState !== 'roundSummary'){
    const { x, y } = gameData.currentCard
    const secretCell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`)
    if (secretCell) secretCell.classList.add('secret-color-highlight')
  }

  if (gameData.guesses){
    if (gameData.gameState === 'scoring' || gameData.gameState === 'gameOver' || gameData.gameState === 'roundSummary' || isCueGiver){
      Object.entries(gameData.guesses).forEach(([pid, guesses])=>{
        const p = gameData.players[pid]
        guesses.forEach(g=> drawMarker(g, p))
      })
    } else {
      const mine = gameData.guesses[currentUserId] || []
      const me = gameData.players[currentUserId]
      if (me) mine.forEach(g=> drawMarker(g, me))
    }
  }

  if (temporaryGuess) drawMarker(temporaryGuess, gameData.players[currentUserId], true)

  if (gameData.gameState === 'scoring' || gameData.gameState === 'gameOver' || gameData.gameState === 'roundSummary'){
    const { x, y } = gameData.currentCard
    const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`)
    if (!cell) return

    const w = cell.offsetWidth
    const h = cell.offsetHeight
    const gap = 1

    function drawBox(size, id){
      const box = document.getElementById(id)
      if (!box) return
      box.style.left = `${(x - Math.floor(size / 2)) * (w + gap)}px`
      box.style.top = `${(y - Math.floor(size / 2)) * (h + gap)}px`
      box.style.width = `${size * (w + gap) - gap}px`
      box.style.height = `${size * (h + gap) - gap}px`
      box.classList.remove('hidden')
    }
    drawBox(1, 'scoring-box-3')
    drawBox(3, 'scoring-box-2')
    drawBox(5, 'scoring-box-1')
  }
}

function renderGameInfo(gameData){
  const info = document.getElementById('game-info')
  const giverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const giver = gameData.players[giverId]

  let html = `<p><strong>Ronda:</strong> ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}</p>`
  html += `<p><strong>Dador de pista:</strong> ${giver.name}</p>`

  if (gameData.gameState.includes('guessing')){
    const req = gameData.gameState === 'guessing_1' ? 1 : 2
    const waiting = gameData.playerOrder
      .filter(pid=>pid !== giverId)
      .filter(pid=> (gameData.guesses[pid]?.length || 0) < req)
      .map(pid=> gameData.players[pid].name)
    html += waiting.length > 0
      ? `<p class="text-yellow-400 font-semibold">Turno de adivinar de:<br>${waiting.join(', ')}</p>`
      : `<p class="text-gray-400 font-semibold">Todos han adivinado.</p>`
  } else if (gameData.gameState.includes('giving_clue')){
    html += `<p class="text-cyan-400 font-semibold">Esperando pista de ${giver.name}...</p>`
  } else if (gameData.gameState === 'scoring'){
    html += `<p class="text-green-400 font-semibold">Puntuando...</p>`
  }

  info.innerHTML = html
  document.getElementById('clue-display').innerHTML = (gameData.clues || []).map(c=> `<span>${c}</span>`).join('')

  const cgView = document.getElementById('cue-giver-view')
  if (currentUserId === giverId && gameData.gameState !== 'scoring'){
    cgView.classList.remove('hidden')
    document.getElementById('secret-color-display').style.backgroundColor = gameData.currentCard.color
    document.getElementById('secret-color-coords').textContent = `${COORD_LETTERS[gameData.currentCard.y]}${gameData.currentCard.x + 1}`
  } else {
    cgView.classList.add('hidden')
  }
}

function renderControls(gameData){
  const c = document.getElementById('controls')
  c.innerHTML = ''

  const giverId = gameData.playerOrder[gameData.currentPlayerIndex]
  const isGiver = currentUserId === giverId

  if (isGiver){
    switch (gameData.gameState){
      case 'giving_clue_1':
        if ((gameData.clues || []).length === 0){
          c.innerHTML = createClueInputHTML(1)
          document.getElementById('submit-clue-btn').onclick = ()=> submitClue(1)
        }
        break
      case 'giving_clue_2':
        if ((gameData.clues || []).length === 1){
          c.innerHTML = createClueInputHTML(2)
          document.getElementById('submit-clue-btn').onclick = ()=> submitClue(2)
        }
        break
      case 'guessing_1':
      case 'guessing_2':
        const guessers = gameData.playerOrder.filter(id=> id !== giverId)
        const req = gameData.gameState === 'guessing_1' ? 1 : 2
        const all = guessers.every(id=> (gameData.guesses[id]?.length || 0) >= req)
        if (all){
          c.innerHTML = `<button id="reveal-btn" class="btn-primary" style="background-color:#ef4444">Revelar Color</button>`
          document.getElementById('reveal-btn').onclick = reveal
        } else {
          c.innerHTML = `<p class="text-gray-400">Esperando que los demás adivinen...</p>`
        }
        break
    }
  } else {
    const my = gameData.guesses?.[currentUserId] || []
    const can =
      (gameData.gameState === 'guessing_1' && my.length === 0) ||
      (gameData.gameState === 'guessing_2' && my.length === 1)

    if (temporaryGuess){
      const tempColor = colorGrid.querySelector(`[data-x='${temporaryGuess.x}'][data-y='${temporaryGuess.y}']`).style.backgroundColor
      c.innerHTML = `
        <div class="flex items-center justify-center gap-4">
          <div class="color-preview" style="background-color:${tempColor}"></div>
          <button id="confirm-guess-btn" class="btn-primary">Confirmar Elección</button>
        </div>
      `
      document.getElementById('confirm-guess-btn').onclick = confirmGuess
    } else if (can){
      c.innerHTML = `<p class="text-gray-400">Selecciona un color en el tablero.</p>`
    } else {
      c.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`
    }
  }
}

function createClueInputHTML(n){
  const d = document.createElement('div')
  d.className = 'flex justify-center items-center space-x-2'
  d.innerHTML = `
    <input type="text" id="clue-input" class="input-field" placeholder="Pista de 1 palabra">
    <button id="submit-clue-btn" class="btn-primary">Dar Pista ${n}</button>
  `
  d.querySelector('#clue-input').addEventListener('keydown', e=>{
    if (e.key === 'Enter'){
      e.preventDefault()
      submitClue(n)
    }
  })
  return d.innerHTML
}

const FORBIDDEN_WORDS = ['rojo','verde','azul','amarillo','naranja','morado','violeta','rosa','marrón','negro','blanco','gris','cian','magenta','turquesa','lila','fucsia','celeste','índigo','añil','purpura','escarlata','carmín','granate','oliva','esmeralda','zafiro','cobalto','ocre','siena','beis','beige','crema','dorado','plateado','bronce','cobre','color','tono','matiz','claro','oscuro','brillante','pálido','aguamarina','coral','lavanda','malva','salmón','terracota','caqui']

async function submitClue(n){
  const input = document.getElementById('clue-input')
  const text = input.value.trim()
  const first = text.toLowerCase().split(' ')[0]
  if (!first) return
  if (FORBIDDEN_WORDS.includes(first)){
    alert(`La palabra "${first}" no está permitida. Elige otra pista.`)
    input.value = ''
    return
  }
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const gameData = (await getDoc(gameRef)).data()
  await updateDoc(gameRef, { clues: [...(gameData.clues || []), first], gameState: `guessing_${n}` })
}

async function handleGridClick(e){
  const cell = e.target.closest('.color-cell')
  if (!cell) return

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  if (!snap.exists()) return
  const gameData = snap.data()

  const giverId = gameData.playerOrder[gameData.currentPlayerIndex]
  if (currentUserId === giverId) return

  const my = gameData.guesses?.[currentUserId] || []
  const can =
    (gameData.gameState === 'guessing_1' && my.length === 0) ||
    (gameData.gameState === 'guessing_2' && my.length === 1)
  if (!can) return

  playSound("select")
  temporaryGuess = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) }
  renderBoard(gameData)
  renderControls(gameData)
}

async function confirmGuess(){
  if (!temporaryGuess) return
  playSound("confirm")

  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const gameData = snap.data()

  const mine = gameData.guesses?.[currentUserId] || []
  const updated = { ...gameData.guesses, [currentUserId]: [...mine, temporaryGuess] }
  temporaryGuess = null
  await updateDoc(gameRef, { guesses: updated })

  const guessers = gameData.playerOrder.filter(id=> id !== gameData.playerOrder[gameData.currentPlayerIndex])
  const req = gameData.gameState === 'guessing_1' ? 1 : 2
  const all = guessers.every(id=> (updated[id]?.length || 0) >= req)
  if (all && gameData.gameState === 'guessing_1'){
    await updateDoc(gameRef, { gameState: 'giving_clue_2' })
  }
}

async function reveal(){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  await updateDoc(gameRef, { gameState: 'scoring' })
  setTimeout(calculateAndShowScores, 2500)
}

async function calculateAndShowScores(){
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const gameData = snap.data()

  const { x: tx, y: ty } = gameData.currentCard
  const giverId = gameData.playerOrder[gameData.currentPlayerIndex]
  let giverPts = 0
  const roundPts = {}
  const players = JSON.parse(JSON.stringify(gameData.players))
  Object.keys(players).forEach(pid=> roundPts[pid] = { name: players[pid].name, points: 0 })

  Object.entries(gameData.guesses).forEach(([pid, guesses])=>{
    let pPts = 0
    guesses.forEach(g=>{
      const dx = Math.abs(g.x - tx)
      const dy = Math.abs(g.y - ty)
      let pts = 0
      if (dx === 0 && dy === 0) pts = 3
      else if (dx <= 1 && dy <= 1) pts = 2
      else if (dx <= 2 && dy <= 2) pts = 1
      pPts += pts
      if (pid !== giverId && dx <= 1 && dy <= 1) giverPts++
    })
    players[pid].score += pPts
    roundPts[pid].points = pPts
  })
  players[giverId].score += giverPts
  roundPts[giverId].points = giverPts

  await updateDoc(gameRef, { players, lastRoundSummary: roundPts })

  const winner = Object.values(players).find(p=> p.score >= gameData.gameSettings.scoreLimit)
  const roundsDone = gameData.currentRound >= gameData.gameSettings.roundLimit
  if (winner || roundsDone) await updateDoc(gameRef, { gameState: 'gameOver' })
  else await updateDoc(gameRef, { gameState: 'roundSummary' })
}

function showRoundSummary(gameData){
  const content = document.getElementById('summary-content')
  const title = document.getElementById('summary-title')
  title.textContent = `Fin de la Ronda ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}`

  const total = Object.values(gameData.lastRoundSummary).reduce((s,p)=> s + p.points, 0)
  if (total > 0) playSound('success') else playSound('failure')

  content.innerHTML = Object.values(gameData.lastRoundSummary).map(p=> `<p><strong>${p.name}:</strong> +${p.points} puntos</p>`).join('')
  roundSummaryModal.classList.remove('hidden')
}

document.getElementById('next-round-btn').addEventListener('click', async ()=>{
  playSound('click')
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const gameData = snap.data()

  const nextIndex = (gameData.currentPlayerIndex + 1) % gameData.playerOrder.length
  const nextRound = nextIndex === 0 ? gameData.currentRound + 1 : gameData.currentRound

  await updateDoc(gameRef, {
    gameState: 'giving_clue_1',
    currentRound: nextRound,
    currentPlayerIndex: nextIndex,
    currentCard: pickRandomCard(),
    clues: [],
    guesses: {}
  })
})

function showGameOver(gameData){
  const winner = gameData.playerOrder.reduce((a,b)=> gameData.players[a].score > gameData.players[b].score ? a : b)
  document.getElementById('winner-name').textContent = gameData.players[winner].name
  gameOverModal.classList.remove('hidden')
  playSound("win")
  const canvas = document.getElementById('confetti-canvas')
  const myConfetti = confetti.create(canvas, { resize: true })
  myConfetti({ particleCount: 200, spread: 160, origin: { y: 0.6 } })
}

async function restartGame(){
  if (!currentGameId) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const snap = await getDoc(gameRef)
  const gameData = snap.data()

  if (currentUserId !== gameData.hostId){ alert("Solo el anfitrión puede reiniciar la partida."); return }

  const resetPlayers = {}
  gameData.playerOrder.forEach(pid=>{ resetPlayers[pid] = { ...gameData.players[pid], score: 0 } })
  await updateDoc(gameRef, { players: resetPlayers, gameState: 'waiting' })
  gameOverModal.classList.add('hidden')
}

// Utilidades
function showScreen(name){
  lobbyScreen.classList.add('hidden')
  waitingRoomScreen.classList.add('hidden')
  gameScreen.classList.add('hidden')
  document.getElementById(`${name}-screen`).classList.remove('hidden')
}

// Inicio
generateColorGrid()
colorGrid.addEventListener('click', handleGridClick)

// Ajustes host
document.getElementById('round-limit').addEventListener('change', e=> updateGameSettings({ roundLimit: parseInt(e.target.value) }))
document.getElementById('score-limit').addEventListener('change', e=> updateGameSettings({ scoreLimit: parseInt(e.target.value) }))

async function updateGameSettings(newSettings){
  if (!currentGameId) return
  const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId)
  const data = (await getDoc(gameRef)).data()
  await updateDoc(gameRef, { gameSettings: { ...data.gameSettings, ...newSettings } })
}
