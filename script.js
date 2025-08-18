// Importa las funciones necesarias de Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, setLogLevel, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAL1RF5XAMknDUlwtDRjC2PByUabkMCDOA",
  authDomain: "color-blind-bca19.firebaseapp.com",
  projectId: "color-blind-bca19",
  storageBucket: "color-blind-bca19.firebasestorage.app",
  messagingSenderId: "876142955211",
  appId: "1:876142955211:web:e2e380a21e17d8e940694e"
};

// --- INICIALIZACIÓN DE FIREBASE (No cambiar) ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const APP_ID = 'hues-and-cues-online';

// --- VARIABLES GLOBALES ---
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
let temporaryGuess = null; // Para la pre-selección
let currentHostId = null; // Para saber quién es el host actual
const playerColors = ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE', '#5A67D8', '#805AD5', '#D53F8C', '#718096', '#4A5568'];
const GRID_COLS = 30;
const GRID_ROWS = 20;
const COORD_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').concat(["AA", "AB", "AC", "AD"]);
const FORBIDDEN_WORDS = [
    'rojo', 'verde', 'azul', 'amarillo', 'naranja', 'morado', 'violeta', 'rosa', 'marrón',
    'negro', 'blanco', 'gris', 'cian', 'magenta', 'turquesa', 'lila', 'fucsia', 'celeste',
    'índigo', 'añil', 'purpura', 'escarlata', 'carmín', 'granate', 'oliva', 'esmeralda',
    'zafiro', 'cobalto', 'ocre', 'siena', 'beis', 'beige', 'crema', 'dorado', 'plateado',
    'bronce', 'cobre', 'color', 'tono', 'matiz', 'claro', 'oscuro', 'brillante', 'pálido',
    'aguamarina', 'coral', 'lavanda', 'malva', 'salmón', 'terracota', 'caqui'
];


// --- ELEMENTOS DEL DOM ---
const lobbyScreen = document.getElementById('lobby-screen');
const waitingRoomScreen = document.getElementById('waiting-room-screen');
const gameScreen = document.getElementById('game-screen');
const colorGrid = document.getElementById('color-grid');
const confirmLeaveModal = document.getElementById('confirm-leave-modal');
const gameOverModal = document.getElementById('game-over-modal');
const soundToggle = document.getElementById('sound-toggle');

// --- LÓGICA DE AUDIO ---
let isMuted = true;
let music;
const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 1 },
}).toDestination();
synth.volume.value = -12;

const soundIcons = {
    muted: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`,
    unmuted: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>`
};

function playSound(type) {
    if (!isMuted) {
        const now = Tone.now();
        switch (type) {
            case 'select':
                synth.triggerAttackRelease("C5", "16n", now);
                break;
            case 'confirm':
                synth.triggerAttackRelease("E5", "16n", now);
                synth.triggerAttackRelease("G5", "16n", now + 0.1);
                break;
            case 'win':
                synth.triggerAttackRelease("C6", "8n", now);
                break;
        }
    }
}

function toggleMusic() {
    if (isMuted) {
        Tone.start();
        if (!music) {
            const notes = ["C4", "E4", "G4", "B4"];
            let index = 0;
            music = new Tone.Loop(time => {
                let note = notes[index % notes.length];
                synth.triggerAttackRelease(note, "8n", time);
                index++;
            }, "4n").start(0);
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
soundToggle.addEventListener('click', toggleMusic);
soundToggle.innerHTML = soundIcons.muted;

// --- LÓGICA DE AUTENTICACIÓN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        const lastGame = JSON.parse(localStorage.getItem('hues-cues-game'));
        if (lastGame && lastGame.gameId) {
            rejoinGame(lastGame.gameId, lastGame.userId);
        }
    } else {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error en la autenticación anónima:", error);
        }
    }
});

// --- LÓGICA DEL LOBBY Y SALIDA ---
function confirmLeave() {
    confirmLeaveModal.classList.remove('hidden');
}

function cancelLeave() {
    confirmLeaveModal.classList.add('hidden');
}

async function executeLeave() {
    if (unsubscribeGame) unsubscribeGame();
    
    if (currentUserId === currentHostId && currentGameId) {
        const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
        await deleteDoc(gameRef);
    }

    localStorage.removeItem('hues-cues-game');
    currentGameId = null;
    currentHostId = null;
    confirmLeaveModal.classList.add('hidden');
    showScreen('lobby');
}

document.getElementById('create-game-btn').addEventListener('click', createGame);
document.getElementById('join-game-btn').addEventListener('click', joinGame);
document.getElementById('start-game-btn').addEventListener('click', startGame);
document.getElementById('game-id-display').addEventListener('click', copyGameId);
document.getElementById('exit-lobby-btn').addEventListener('click', executeLeave);
document.getElementById('leave-game-btn').addEventListener('click', confirmLeave);
document.getElementById('confirm-leave-btn').addEventListener('click', executeLeave);
document.getElementById('cancel-leave-btn').addEventListener('click', cancelLeave);
document.getElementById('new-game-btn').addEventListener('click', restartGame);


function getPlayerName() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) {
        document.getElementById('lobby-error').textContent = 'Por favor, introduce tu nombre.';
        return null;
    }
    return name;
}

async function createGame() {
    const playerName = getPlayerName();
    if (!playerName || !currentUserId) return;

    const gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    currentGameId = gameId;
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);

    const newPlayer = { name: playerName, color: playerColors[0], score: 0, isHost: true };
    const gameData = {
        hostId: currentUserId,
        players: { [currentUserId]: newPlayer },
        playerOrder: [currentUserId],
        gameState: 'waiting',
        gameSettings: {
            roundLimit: 10,
            scoreLimit: 25,
        },
        createdAt: new Date(),
    };

    try {
        await setDoc(gameRef, gameData);
        localStorage.setItem('hues-cues-game', JSON.stringify({ gameId, userId: currentUserId }));
        subscribeToGame(gameId);
        showScreen('waiting-room');
    } catch (error) {
        console.error("Error al crear la partida:", error);
    }
}

async function joinGame() {
    const playerName = getPlayerName();
    if (!playerName || !currentUserId) return;

    const gameId = document.getElementById('join-game-id').value.trim().toUpperCase();
    if (!gameId) {
        document.getElementById('lobby-error').textContent = 'Introduce un código.';
        return;
    }

    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
        document.getElementById('lobby-error').textContent = 'Partida no encontrada.';
        return;
    }

    const gameData = gameSnap.data();
    
    if (gameData.gameState !== 'waiting') {
        const playerEntry = Object.entries(gameData.players).find(([id, p]) => p.name === playerName);
        if (playerEntry) {
            const existingPlayerId = playerEntry[0];
            localStorage.setItem('hues-cues-game', JSON.stringify({ gameId, userId: existingPlayerId }));
            rejoinGame(gameId, existingPlayerId);
            return;
        } else {
            document.getElementById('lobby-error').textContent = 'La partida ya ha comenzado.';
            return;
        }
    }
    
    if (Object.keys(gameData.players).length >= 10) {
        document.getElementById('lobby-error').textContent = 'La partida está llena.';
        return;
    }

    const newPlayerColor = playerColors[Object.keys(gameData.players).length];
    const newPlayer = { name: playerName, color: newPlayerColor, score: 0, isHost: false };
    
    const updatedPlayers = { ...gameData.players, [currentUserId]: newPlayer };
    const updatedPlayerOrder = [...gameData.playerOrder, currentUserId];

    try {
        await updateDoc(gameRef, { players: updatedPlayers, playerOrder: updatedPlayerOrder });
        localStorage.setItem('hues-cues-game', JSON.stringify({ gameId, userId: currentUserId }));
        currentGameId = gameId;
        subscribeToGame(gameId);
        showScreen('waiting-room');
    } catch (error) {
        console.error("Error al unirse:", error);
    }
}

async function rejoinGame(gameId, userId) {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
        currentGameId = gameId;
        currentUserId = userId;
        subscribeToGame(gameId);
    } else {
        localStorage.removeItem('hues-cues-game');
    }
}

function subscribeToGame(gameId) {
    if (unsubscribeGame) unsubscribeGame();
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
    unsubscribeGame = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
            const gameData = doc.data();
            currentHostId = gameData.hostId;
            updateUI(gameData);
        } else {
            localStorage.removeItem('hues-cues-game');
            alert("El anfitrión ha terminado la partida.");
            executeLeave();
        }
    });
}

function copyGameId() {
    const gameId = document.getElementById('game-id-display').textContent;
    navigator.clipboard.writeText(gameId).then(() => {
        const display = document.getElementById('game-id-display');
        const originalText = display.textContent;
        display.textContent = '¡Copiado!';
        setTimeout(() => { display.textContent = originalText; }, 1500);
    });
}

// --- LÓGICA DEL JUEGO ---
function generateColorGrid() {
    colorGrid.innerHTML = '';
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            const cell = document.createElement('div');
            cell.classList.add('color-cell');
            
            const hue = (x / GRID_COLS) * 340;
            const saturation = 40 + (y / GRID_ROWS) * 60;
            const lightness = 90 - (y / GRID_ROWS) * 60;
            
            cell.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.dataset.coords = `${COORD_LETTERS[x]}${y + 1}`;
            cell.title = `${COORD_LETTERS[x]}${y + 1}`;
            colorGrid.appendChild(cell);
        }
    }
}

async function startGame() {
    if (!currentGameId) return;
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    if (gameData.hostId !== currentUserId) {
        alert("Solo el creador puede empezar.");
        return;
    }
    if (Object.keys(gameData.players).length < 2) {
         alert("Se necesitan al menos 2 jugadores.");
        return;
    }
    
    const newCard = pickRandomCard();
    await updateDoc(gameRef, {
        gameState: 'giving_clue_1',
        currentRound: 1,
        currentPlayerIndex: 0,
        currentCard: newCard,
        clues: [],
        guesses: {},
    });
}

function pickRandomCard() {
    const x = Math.floor(Math.random() * GRID_COLS);
    const y = Math.floor(Math.random() * GRID_ROWS);
    const hue = (x / GRID_COLS) * 340;
    const saturation = 40 + (y / GRID_ROWS) * 60;
    const lightness = 90 - (y / GRID_ROWS) * 60;
    return { x, y, color: `hsl(${hue}, ${saturation}%, ${lightness}%)` };
}

function updateUI(gameData) {
    if (gameData.gameState === 'waiting') {
        gameOverModal.classList.add('hidden');
        showScreen('waiting-room');
        document.getElementById('game-id-display').textContent = currentGameId;
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = '';
        gameData.playerOrder.forEach(pid => {
            const player = gameData.players[pid];
            const li = document.createElement('li');
            li.className = 'flex items-center';
            li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2" style="background-color: ${player.color};"></div> ${player.name} ${player.isHost ? '(Host)' : ''}`;
            playerList.appendChild(li);
        });

        const isHost = gameData.hostId === currentUserId;
        const gameOptions = document.getElementById('game-options');
        const roundLimitInput = document.getElementById('round-limit');
        const scoreLimitInput = document.getElementById('score-limit');
        const limitsDisplay = document.getElementById('game-limits-display');

        if (isHost) {
            gameOptions.classList.remove('hidden');
            limitsDisplay.classList.add('hidden');
            roundLimitInput.disabled = false;
            scoreLimitInput.disabled = false;
            roundLimitInput.value = gameData.gameSettings.roundLimit;
            scoreLimitInput.value = gameData.gameSettings.scoreLimit;
        } else {
            gameOptions.classList.add('hidden');
            limitsDisplay.classList.remove('hidden');
            limitsDisplay.textContent = `Jugar a ${gameData.gameSettings.roundLimit} rondas o ${gameData.gameSettings.scoreLimit} puntos.`;
        }

        document.getElementById('start-game-btn').style.display = isHost ? 'block' : 'none';
    } else if (gameData.gameState === 'gameOver') {
        showGameOver(gameData);
    }
    else {
        showScreen('game');
        renderScores(gameData);
        renderBoard(gameData);
        renderGameInfo(gameData);
        renderControls(gameData);
    }
}

function renderScores(gameData) {
    const scoresContainer = document.getElementById('player-scores');
    scoresContainer.innerHTML = '';
    gameData.playerOrder.forEach(pid => {
        const player = gameData.players[pid];
        const scoreEl = document.createElement('div');
        scoreEl.className = 'flex justify-between items-center p-2 rounded-md';
        scoreEl.innerHTML = `
            <div class="flex items-center">
                <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background-color: ${player.color};"></div>
                <span class="font-medium">${player.name}</span>
            </div>
            <span class="font-bold text-lg">${player.score}</span>
        `;
        scoresContainer.appendChild(scoreEl);
    });
}

function renderBoard(gameData) {
    document.querySelectorAll('.player-marker, .temp-marker').forEach(el => el.remove());
    const scoringFrame = document.getElementById('scoring-frame');
    scoringFrame.classList.add('hidden');
    const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
    const isCueGiver = currentUserId === cueGiverId;

    const drawMarker = (guess, player, isTemp = false) => {
        const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`);
        if (cell && player) {
            const marker = document.createElement('div');
            marker.className = isTemp ? 'player-marker temp-marker' : 'player-marker';
            marker.style.backgroundColor = player.color;
            marker.textContent = player.name.substring(0, 1);
            cell.appendChild(marker);
        }
    };

    if (gameData.guesses) {
        if (gameData.gameState === 'scoring' || gameData.gameState === 'gameOver' || isCueGiver) {
            Object.entries(gameData.guesses).forEach(([playerId, guesses]) => {
                const player = gameData.players[playerId];
                guesses.forEach(guess => drawMarker(guess, player));
            });
        } else {
            const myGuesses = gameData.guesses[currentUserId] || [];
            const me = gameData.players[currentUserId];
            if (me) {
                myGuesses.forEach(guess => drawMarker(guess, me));
            }
        }
    }
    
    if (temporaryGuess) {
        drawMarker(temporaryGuess, gameData.players[currentUserId], true);
    }

    if (gameData.gameState === 'scoring' || gameData.gameState === 'gameOver') {
        const { x, y } = gameData.currentCard;
        const cell = colorGrid.querySelector(`[data-x='${x}'][data-y='${y}']`);
        if (!cell) return;

        const cellSize = cell.offsetWidth;
        const gap = 1;

        scoringFrame.style.setProperty('--cell-size', `${cellSize + gap}px`);
        scoringFrame.style.width = `${cellSize}px`;
        scoringFrame.style.height = `${cellSize}px`;
        scoringFrame.style.left = `${cell.offsetLeft}px`;
        scoringFrame.style.top = `${cell.offsetTop}px`;
        scoringFrame.classList.remove('hidden');
    }
}

function renderGameInfo(gameData) {
    const infoContainer = document.getElementById('game-info');
    const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
    const cueGiver = gameData.players[cueGiverId];

    let statusHTML = `<p><strong>Ronda:</strong> ${gameData.currentRound} / ${gameData.gameSettings.roundLimit}</p>`;
    statusHTML += `<p><strong>Dador de pista:</strong> ${cueGiver.name}</p>`;
    
    if (gameData.gameState.includes('guessing')) {
        const requiredGuesses = gameData.gameState === 'guessing_1' ? 1 : 2;
        const playersToGuess = gameData.playerOrder
            .filter(pid => pid !== cueGiverId)
            .filter(pid => (gameData.guesses[pid]?.length || 0) < requiredGuesses)
            .map(pid => gameData.players[pid].name);

        if (playersToGuess.length > 0) {
            statusHTML += `<p class="text-yellow-400 font-semibold">Turno de adivinar de:<br>${playersToGuess.join(', ')}</p>`;
        } else {
            statusHTML += `<p class="text-gray-400 font-semibold">Todos han adivinado.</p>`;
        }
    } else if (gameData.gameState.includes('giving_clue')) {
        statusHTML += `<p class="text-cyan-400 font-semibold">Esperando pista de ${cueGiver.name}...</p>`;
    } else if (gameData.gameState === 'scoring') {
        statusHTML += `<p class="text-green-400 font-semibold">Puntuando...</p>`;
    }

    infoContainer.innerHTML = statusHTML;
    document.getElementById('clue-display').innerHTML = (gameData.clues || []).map((clue) => `<span>${clue}</span>`).join('');

    const cueGiverView = document.getElementById('cue-giver-view');
    if (currentUserId === cueGiverId && gameData.gameState !== 'scoring') {
        cueGiverView.classList.remove('hidden');
        document.getElementById('secret-color-display').style.backgroundColor = gameData.currentCard.color;
        document.getElementById('secret-color-coords').textContent = `${COORD_LETTERS[gameData.currentCard.x]}${gameData.currentCard.y + 1}`;
    } else {
        cueGiverView.classList.add('hidden');
    }
}

function renderControls(gameData) {
    const controlsContainer = document.getElementById('controls');
    controlsContainer.innerHTML = '';
    
    const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
    const isCueGiver = currentUserId === cueGiverId;
    
    if (isCueGiver) {
        switch (gameData.gameState) {
            case 'giving_clue_1':
                if ((gameData.clues || []).length === 0) {
                    controlsContainer.innerHTML = createClueInputHTML(1);
                    document.getElementById('submit-clue-btn').onclick = () => submitClue(1);
                }
                break;
            case 'giving_clue_2':
                if ((gameData.clues || []).length === 1) {
                    controlsContainer.innerHTML = createClueInputHTML(2);
                    document.getElementById('submit-clue-btn').onclick = () => submitClue(2);
                }
                break;
            case 'guessing_1':
            case 'guessing_2':
                const guessers = gameData.playerOrder.filter(id => id !== cueGiverId);
                const requiredGuesses = gameData.gameState === 'guessing_1' ? 1 : 2;
                const allHaveGuessed = guessers.every(id => (gameData.guesses[id]?.length || 0) >= requiredGuesses);
                
                if (allHaveGuessed) {
                    controlsContainer.innerHTML = `<button id="reveal-btn" class="btn-primary" style="background-color: #ef4444;">Revelar Color</button>`;
                    document.getElementById('reveal-btn').onclick = reveal;
                } else {
                    controlsContainer.innerHTML = `<p class="text-gray-400">Esperando que los demás adivinen...</p>`;
                }
                break;
        }
    } else { // If not the cue giver
        const myGuesses = gameData.guesses?.[currentUserId] || [];
        const canGuessNow = (gameData.gameState === 'guessing_1' && myGuesses.length === 0) || (gameData.gameState === 'guessing_2' && myGuesses.length === 1);
        
        if (temporaryGuess) {
            const tempColor = colorGrid.querySelector(`[data-x='${temporaryGuess.x}'][data-y='${temporaryGuess.y}']`).style.backgroundColor;
            controlsContainer.innerHTML = `
                <div class="flex items-center justify-center gap-4">
                    <div class="color-preview" style="background-color: ${tempColor};"></div>
                    <button id="confirm-guess-btn" class="btn-primary">Confirmar Elección</button>
                </div>`;
            document.getElementById('confirm-guess-btn').onclick = confirmGuess;
        } else if (canGuessNow) {
            controlsContainer.innerHTML = `<p class="text-gray-400">Selecciona un color en el tablero.</p>`;
        } else {
            controlsContainer.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`;
        }
    }
}

function createClueInputHTML(clueNumber) {
    return `
        <div class="flex justify-center items-center space-x-2">
            <input type="text" id="clue-input" class="input-field" placeholder="Pista de 1 palabra">
            <button id="submit-clue-btn" class="btn-primary">Dar Pista ${clueNumber}</button>
        </div>`;
}

async function submitClue(clueNumber) {
    const clueInput = document.getElementById('clue-input');
    const clueText = clueInput.value.trim();
    const firstWord = clueText.toLowerCase().split(' ')[0];
    
    if (!firstWord) return;

    if (FORBIDDEN_WORDS.includes(firstWord)) {
        alert(`La palabra "${firstWord}" no está permitida. Por favor, elige una pista que no sea un color.`);
        clueInput.value = '';
        return;
    }
    
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameData = (await getDoc(gameRef)).data();
    await updateDoc(gameRef, {
        clues: [...(gameData.clues || []), clueText.split(' ')[0]],
        gameState: `guessing_${clueNumber}`
    });
}

async function handleGridClick(e) {
    const cell = e.target.closest('.color-cell');
    if (!cell) return;
    
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return;
    const gameData = gameSnap.data();

    const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
    if (currentUserId === cueGiverId) return;

    const myGuesses = gameData.guesses?.[currentUserId] || [];
    const canGuessNow = (gameData.gameState === 'guessing_1' && myGuesses.length === 0) || (gameData.gameState === 'guessing_2' && myGuesses.length === 1);
    
    if (!canGuessNow) return;

    playSound("select");
    temporaryGuess = {
        x: parseInt(cell.dataset.x),
        y: parseInt(cell.dataset.y)
    };
    renderBoard(gameData); // Re-render to show temp marker
    renderControls(gameData); // Re-render to show confirm button
}

async function confirmGuess() {
    if (!temporaryGuess) return;
    playSound("confirm");

    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    const myGuesses = gameData.guesses?.[currentUserId] || [];
    const updatedGuesses = {
        ...gameData.guesses,
        [currentUserId]: [...myGuesses, temporaryGuess]
    };
    
    temporaryGuess = null;
    await updateDoc(gameRef, { guesses: updatedGuesses });

    const guessers = gameData.playerOrder.filter(id => id !== gameData.playerOrder[gameData.currentPlayerIndex]);
    const requiredGuesses = gameData.gameState === 'guessing_1' ? 1 : 2;
    const allHaveGuessed = guessers.every(id => (updatedGuesses[id]?.length || 0) >= requiredGuesses);

    if (allHaveGuessed && gameData.gameState === 'guessing_1') {
        await updateDoc(gameRef, { gameState: 'giving_clue_2' });
    }
}


async function reveal() {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    await updateDoc(gameRef, { gameState: 'scoring' });
    setTimeout(calculateAndShowScores, 4000);
}

async function calculateAndShowScores() {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    const { x: targetX, y: targetY } = gameData.currentCard;
    const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
    let cueGiverPoints = 0;
    const roundPoints = {};
    const updatedPlayers = JSON.parse(JSON.stringify(gameData.players));

    Object.keys(updatedPlayers).forEach(pid => roundPoints[pid] = { name: updatedPlayers[pid].name, points: 0 });

    Object.entries(gameData.guesses).forEach(([playerId, guesses]) => {
        let playerRoundPoints = 0;
        guesses.forEach(guess => {
            const distX = Math.abs(guess.x - targetX);
            const distY = Math.abs(guess.y - targetY);
            
            let points = 0;
            if (distX === 0 && distY === 0) points = 3;
            else if (distX <= 1 && distY <= 1) points = 2;
            else if (distX <= 2 && distY <= 2) points = 1;
            
            playerRoundPoints += points;

            if (playerId !== cueGiverId && distX <= 1 && distY <= 1) {
                cueGiverPoints++;
            }
        });
        updatedPlayers[playerId].score += playerRoundPoints;
        roundPoints[playerId].points = playerRoundPoints;
    });
    
    updatedPlayers[cueGiverId].score += cueGiverPoints;
    roundPoints[cueGiverId].points = cueGiverPoints;
    
    await updateDoc(gameRef, { players: updatedPlayers });
    
    const winner = Object.values(updatedPlayers).find(p => p.score >= gameData.gameSettings.scoreLimit);
    const roundLimitReached = gameData.currentRound >= gameData.gameSettings.roundLimit;

    if (winner || roundLimitReached) {
        await updateDoc(gameRef, { gameState: 'gameOver' });
    } else {
        const summaryContent = document.getElementById('summary-content');
        summaryContent.innerHTML = Object.values(roundPoints).map(p => `
            <p><strong>${p.name}:</strong> +${p.points} puntos</p>
        `).join('');
        document.getElementById('round-summary-modal').classList.remove('hidden');
    }
}

document.getElementById('next-round-btn').addEventListener('click', async () => {
    document.getElementById('round-summary-modal').classList.add('hidden');
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    const nextPlayerIndex = (gameData.currentPlayerIndex + 1) % gameData.playerOrder.length;
    const nextRound = nextPlayerIndex === 0 ? gameData.currentRound + 1 : gameData.currentRound;

    await updateDoc(gameRef, {
        gameState: 'giving_clue_1',
        currentRound: nextRound,
        currentPlayerIndex: nextPlayerIndex,
        currentCard: pickRandomCard(),
        clues: [],
        guesses: {},
    });
});

function showGameOver(gameData) {
    const winner = gameData.playerOrder.reduce((a, b) => gameData.players[a].score > gameData.players[b].score ? a : b);
    document.getElementById('winner-name').textContent = gameData.players[winner].name;
    gameOverModal.classList.remove('hidden');
    
    playSound("win");
    const canvas = document.getElementById('confetti-canvas');
    const myConfetti = confetti.create(canvas, { resize: true });
    myConfetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 }
    });
}

async function restartGame() {
    if (!currentGameId) return;
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameSnap = await getDoc(gameRef);
    const gameData = gameSnap.data();

    if(currentUserId !== gameData.hostId) {
        alert("Solo el anfitrión puede reiniciar la partida.");
        return;
    }

    const resetPlayers = {};
    gameData.playerOrder.forEach(pid => {
        resetPlayers[pid] = { ...gameData.players[pid], score: 0 };
    });

    await updateDoc(gameRef, {
        players: resetPlayers,
        gameState: 'waiting',
    });
    
    gameOverModal.classList.add('hidden');
}


// --- UTILIDADES ---
function showScreen(screenName) {
    lobbyScreen.classList.add('hidden');
    waitingRoomScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    document.getElementById(`${screenName}-screen`).classList.remove('hidden');
}

// --- INICIALIZACIÓN ---
generateColorGrid();
colorGrid.addEventListener('click', handleGridClick);

// Host settings update
document.getElementById('round-limit').addEventListener('change', (e) => updateGameSettings({ roundLimit: parseInt(e.target.value) }));
document.getElementById('score-limit').addEventListener('change', (e) => updateGameSettings({ scoreLimit: parseInt(e.target.value) }));

async function updateGameSettings(newSettings) {
    if (!currentGameId) return;
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameData = (await getDoc(gameRef)).data();
    await updateDoc(gameRef, {
        gameSettings: {
            ...gameData.gameSettings,
            ...newSettings
        }
    });
}
