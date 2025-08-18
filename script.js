// Importa las funciones necesarias de Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, setLogLevel, doc, getDoc, setDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- CONFIGURACIÓN DE FIREBASE ---
//
// ¡Configuración añadida desde tu proyecto!
//
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
const APP_ID = 'hues-and-cues-online'; // Un identificador para tu juego en la base de datos

// --- VARIABLES GLOBALES ---
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
const playerColors = ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE', '#5A67D8', '#805AD5', '#D53F8C', '#718096', '#4A5568'];
const GRID_COLS = 30;
const GRID_ROWS = 20;
const COORD_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').concat(["AA", "AB", "AC", "AD"]);

// --- ELEMENTOS DEL DOM ---
const lobbyScreen = document.getElementById('lobby-screen');
const waitingRoomScreen = document.getElementById('waiting-room-screen');
const gameScreen = document.getElementById('game-screen');
const colorGrid = document.getElementById('color-grid');

// --- LÓGICA DE AUTENTICACIÓN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuario autenticado:", currentUserId);
        // Intenta volver a unirte a una partida si estabas en una
        const lastGame = JSON.parse(localStorage.getItem('hues-cues-game'));
        if (lastGame && lastGame.gameId) {
            rejoinGame(lastGame.gameId, lastGame.userId);
        }
    } else {
        console.log("Iniciando sesión anónima...");
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Error en la autenticación anónima:", error);
            alert("No se pudo conectar al servidor. Revisa la configuración de Firebase.");
        }
    }
});

// --- LÓGICA DEL LOBBY ---
document.getElementById('create-game-btn').addEventListener('click', createGame);
document.getElementById('join-game-btn').addEventListener('click', joinGame);
document.getElementById('start-game-btn').addEventListener('click', startGame);
document.getElementById('game-id-display').addEventListener('click', copyGameId);

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
    if (!playerName || !currentUserId) {
        if(!currentUserId) alert("Aún no se ha conectado al servidor, espera un segundo.");
        return;
    };

    const gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    currentGameId = gameId;
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);

    const newPlayer = {
        name: playerName,
        color: playerColors[0],
        score: 0,
        isHost: true,
    };

    const gameData = {
        hostId: currentUserId,
        players: { [currentUserId]: newPlayer },
        playerOrder: [currentUserId],
        gameState: 'waiting',
        createdAt: new Date(),
    };

    try {
        await setDoc(gameRef, gameData);
        localStorage.setItem('hues-cues-game', JSON.stringify({ gameId: gameId, userId: currentUserId }));
        subscribeToGame(gameId);
        showScreen('waiting-room');
    } catch (error) {
        console.error("Error al crear la partida:", error);
        document.getElementById('lobby-error').textContent = 'No se pudo crear la partida. Revisa la consola (F12) para ver los errores.';
    }
}

async function joinGame() {
    const playerName = getPlayerName();
    if (!playerName || !currentUserId) return;

    const gameId = document.getElementById('join-game-id').value.trim().toUpperCase();
    if (!gameId) {
        document.getElementById('lobby-error').textContent = 'Por favor, introduce un código de partida.';
        return;
    }

    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
        document.getElementById('lobby-error').textContent = 'Partida no encontrada.';
        return;
    }

    const gameData = gameSnap.data();
    
    // FIX 1: Permitir volver a unirse si la partida ha comenzado
    if (gameData.gameState !== 'waiting') {
        // Comprueba si algún jugador en la partida tiene el mismo nombre
        const playerEntry = Object.entries(gameData.players).find(([id, p]) => p.name === playerName);
        if (playerEntry) {
            const existingPlayerId = playerEntry[0];
            console.log(`El jugador ${playerName} ya existe con ID ${existingPlayerId}, permitiendo que vuelva a unirse.`);
            localStorage.setItem('hues-cues-game', JSON.stringify({ gameId: gameId, userId: existingPlayerId }));
            currentUserId = existingPlayerId; // Asigna el ID correcto para la sesión
            rejoinGame(gameId, existingPlayerId);
            return;
        } else {
            document.getElementById('lobby-error').textContent = 'La partida ya ha comenzado y no eres un jugador existente.';
            return;
        }
    }
    
    if (Object.keys(gameData.players).length >= 10) {
        document.getElementById('lobby-error').textContent = 'La partida está llena.';
        return;
    }

    const newPlayerColor = playerColors[Object.keys(gameData.players).length];
    const newPlayer = {
        name: playerName,
        color: newPlayerColor,
        score: 0,
        isHost: false,
    };
    
    const updatedPlayers = { ...gameData.players, [currentUserId]: newPlayer };
    const updatedPlayerOrder = [...gameData.playerOrder, currentUserId];

    try {
        await updateDoc(gameRef, { players: updatedPlayers, playerOrder: updatedPlayerOrder });
        localStorage.setItem('hues-cues-game', JSON.stringify({ gameId: gameId, userId: currentUserId }));
        currentGameId = gameId;
        subscribeToGame(gameId);
        showScreen('waiting-room');
    } catch (error) {
        console.error("Error al unirse a la partida:", error);
        document.getElementById('lobby-error').textContent = 'No se pudo unir a la partida.';
    }
}

async function rejoinGame(gameId, userId) {
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
        console.log(`Reconectando a la partida ${gameId}`);
        currentGameId = gameId;
        currentUserId = userId; // Asegúrate de que el ID de usuario es el correcto
        subscribeToGame(gameId);
    } else {
        console.log("La partida a la que intentabas reconectarte ya no existe.");
        localStorage.removeItem('hues-cues-game');
    }
}


function subscribeToGame(gameId) {
    if (unsubscribeGame) unsubscribeGame();
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, gameId);
    unsubscribeGame = onSnapshot(gameRef, (doc) => {
        if (doc.exists()) {
            const gameData = doc.data();
            console.log("Datos de la partida actualizados:", gameData);
            updateUI(gameData);
        } else {
            console.log("La partida ha sido eliminada.");
            localStorage.removeItem('hues-cues-game');
            alert("La partida ya no existe.");
            showScreen('lobby');
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
            const hue = (x / GRID_COLS) * 360;
            const lightness = 90 - (y / GRID_ROWS) * 70;
            const saturation = 100;
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
        alert("Solo el creador de la partida puede empezar.");
        return;
    }
    if (Object.keys(gameData.players).length < 2) { // Cambiado a 2 para pruebas, puedes volver a poner 3
         alert("Se necesitan al menos 2 jugadores para empezar.");
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
    const hue = (x / GRID_COLS) * 360;
    const lightness = 90 - (y / GRID_ROWS) * 70;
    return { x, y, color: `hsl(${hue}, 100%, ${lightness}%)` };
}

function updateUI(gameData) {
    if (gameData.gameState === 'waiting') {
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
        document.getElementById('start-game-btn').style.display = gameData.hostId === currentUserId ? 'block' : 'none';
    } else {
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
    document.querySelectorAll('.player-marker').forEach(el => el.remove());
    document.querySelectorAll('.scoring-overlay').forEach(el => el.style.display = 'none');

    if (gameData.guesses) {
        Object.entries(gameData.guesses).forEach(([playerId, guesses]) => {
            guesses.forEach(guess => {
                const cell = colorGrid.querySelector(`[data-x='${guess.x}'][data-y='${guess.y}']`);
                if (cell) {
                    const player = gameData.players[playerId];
                    const marker = document.createElement('div');
                    marker.className = 'player-marker';
                    marker.style.backgroundColor = player.color;
                    marker.textContent = player.name.substring(0, 1);
                    cell.appendChild(marker);
                }
            });
        });
    }

    if (gameData.gameState === 'scoring') {
        const { x, y } = gameData.currentCard;
        const cellWidth = colorGrid.querySelector('.color-cell').offsetWidth;
        const cellHeight = colorGrid.querySelector('.color-cell').offsetHeight;
        const gap = 2;

        function drawScoringBox(size, id) {
            const box = document.getElementById(id);
            if (!box || !cellWidth) return;
            box.style.left = `${(x - Math.floor(size / 2)) * (cellWidth + gap)}px`;
            box.style.top = `${(y - Math.floor(size / 2)) * (cellHeight + gap)}px`;
            box.style.width = `${size * (cellWidth + gap) - gap}px`;
            box.style.height = `${size * (cellHeight + gap) - gap}px`;
            box.style.display = 'block';
        }
        
        drawScoringBox(1, 'scoring-box-3');
        drawScoringBox(3, 'scoring-box-2');
        drawScoringBox(5, 'scoring-box-1');
    }
}

function renderGameInfo(gameData) {
    const infoContainer = document.getElementById('game-info');
    const clueDisplay = document.getElementById('clue-display');
    const cueGiverView = document.getElementById('cue-giver-view');
    
    const cueGiverId = gameData.playerOrder[gameData.currentPlayerIndex];
    const cueGiver = gameData.players[cueGiverId];
    const isCueGiver = currentUserId === cueGiverId;

    let statusHTML = `<p><strong>Ronda:</strong> ${gameData.currentRound}</p>`;
    statusHTML += `<p><strong>Dador de pista:</strong> ${cueGiver.name}</p>`;
    
    // FIX 2: Mostrar de quién es el turno de adivinar
    if (gameData.gameState.includes('guessing')) {
        const requiredGuesses = gameData.gameState === 'guessing_1' ? 1 : 2;
        const playersToGuess = gameData.playerOrder
            .filter(pid => pid !== cueGiverId) // Todos excepto el que da la pista
            .filter(pid => (gameData.guesses[pid]?.length || 0) < requiredGuesses) // Que no hayan adivinado aún
            .map(pid => gameData.players[pid].name); // Obtener sus nombres

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
    
    clueDisplay.innerHTML = (gameData.clues || []).map((clue) => `<span>${clue}</span>`).join('');

    if (isCueGiver && gameData.gameState !== 'scoring') {
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
    const myGuesses = gameData.guesses?.[currentUserId] || [];

    if (isCueGiver) {
        if (gameData.gameState === 'giving_clue_1' && (gameData.clues || []).length === 0) {
            controlsContainer.innerHTML = createClueInputHTML(1);
            document.getElementById('submit-clue-btn').onclick = () => submitClue(1);
        } else if (gameData.gameState === 'giving_clue_2' && (gameData.clues || []).length === 1) {
            controlsContainer.innerHTML = createClueInputHTML(2);
            document.getElementById('submit-clue-btn').onclick = () => submitClue(2);
        } else if (gameData.gameState === 'guessing_2') {
             const guessers = gameData.playerOrder.filter(id => id !== cueGiverId);
             const allHaveGuessed = guessers.every(id => (gameData.guesses[id]?.length || 0) >= 2);
             if(allHaveGuessed){
                controlsContainer.innerHTML = `<button id="reveal-btn" class="btn-primary" style="background-color: #ef4444;">Revelar Color</button>`;
                document.getElementById('reveal-btn').onclick = reveal;
             }
        }
    } else {
        if (gameData.gameState === 'guessing_1' && myGuesses.length === 0) {
            controlsContainer.innerHTML = `<p class="text-gray-400">Haz click en el color que crees que es.</p>`;
        } else if (gameData.gameState === 'guessing_2' && myGuesses.length === 1) {
            controlsContainer.innerHTML = `<p class="text-gray-400">Coloca tu segundo marcador.</p>`;
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
    const clue = clueInput.value.trim().split(' ')[0];
    if (!clue) return;
    
    const gameRef = doc(db, `artifacts/${APP_ID}/public/data/games`, currentGameId);
    const gameData = (await getDoc(gameRef)).data();
    await updateDoc(gameRef, {
        clues: [...(gameData.clues || []), clue],
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

    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const newGuess = { x, y };
    
    const currentGuesses = gameData.guesses || {};
    const playerGuesses = currentGuesses[currentUserId] || [];
    const updatedGuesses = {
        ...currentGuesses,
        [currentUserId]: [...playerGuesses, newGuess]
    };

    await updateDoc(gameRef, { guesses: updatedGuesses });
    
    const guessers = gameData.playerOrder.filter(id => id !== cueGiverId);
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
    
    const summaryContent = document.getElementById('summary-content');
    summaryContent.innerHTML = Object.values(roundPoints).map(p => `
        <p><strong>${p.name}:</strong> +${p.points} puntos</p>
    `).join('');
    document.getElementById('round-summary-modal').classList.remove('hidden');
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
