// ===============================
// Firebase SDK (v11 ESM)
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// ---------- CONFIG FIREBASE (IMPROVED) ----------
// Using environment variables for security and flexibility.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hue-hunt-online';

// ---------- INIT ----------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const gamesCollection = collection(db, `artifacts/${appId}/public/data/games`);

// ===============================
// Global State
// ===============================
let currentUserId = null;
let currentGameId = null;
let unsubscribeGame = null;
let latestGameData = null; // Cache for resize handler
let temporaryGuess = null;
let currentHostId = null;

const GRID_COLS = 30;
const GRID_ROWS = 16;
const COORD_LETTERS = "ABCDEFGHIJKLMNOP".split("");
const MAX_PLAYERS = 10;
const DEFAULT_SCORE_LIMIT = 25;

const playerColors = ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE', '#5A67D8', '#805AD5', '#D53F8C', '#718096', '#4A5568'];
const FORBIDDEN_WORDS = ['rojo', 'verde', 'azul', 'amarillo', 'naranja', 'morado', 'violeta', 'rosa', 'marrón', 'negro', 'blanco', 'gris', 'cian', 'magenta', 'turquesa', 'lila', 'fucsia', 'celeste', 'índigo', 'añil', 'purpura', 'escarlata', 'carmín', 'granate', 'oliva', 'esmeralda', 'zafiro', 'cobalto', 'ocre', 'siena', 'beis', 'beige', 'crema', 'dorado', 'plateado', 'bronce', 'cobre', 'color', 'tono', 'matiz', 'claro', 'oscuro', 'brillante', 'pálido', 'aguamarina', 'coral', 'lavanda', 'malva', 'salmón', 'terracota', 'caqui'];

// ===============================
// DOM Refs
// ===============================
const lobbyScreen = document.getElementById("lobby-screen");
const waitingRoomScreen = document.getElementById("waiting-room-screen");
const gameScreen = document.getElementById("game-screen");
const colorGrid = document.getElementById("color-grid");
const soundToggle = document.getElementById("sound-toggle");
const roundSummaryModal = document.getElementById("round-summary-modal");
const gameOverModal = document.getElementById("game-over-modal");
const confirmLeaveModal = document.getElementById("confirm-leave-modal");
const gridSizeSelect = document.getElementById("grid-size-select");

// ===============================
// Audio (Tone.js)
// ===============================
let isMuted = true;
const actionSynth = new Tone.Synth({
  oscillator: { type: "sine" },
  envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
}).toDestination();
actionSynth.volume.value = -10;

const soundIcons = {
  muted: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l-2.25 2.25M19.5 12l2.25-2.25M12.75 15l3-3m0 0-3-3m3 3H6.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`,
  unmuted: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"/></svg>`
};
soundToggle.innerHTML = soundIcons.muted;

function playSound(name) {
  if (isMuted) return;
  const now = Tone.now();
  switch (name) {
    case "click": actionSynth.triggerAttackRelease("C4", "16n", now); break;
    case "select": actionSynth.triggerAttackRelease("C5", "16n", now); break;
    case "confirm": actionSynth.triggerAttackRelease("G5", "16n", now); break;
    case "success": actionSynth.triggerAttackRelease("C5", "16n", now); actionSynth.triggerAttackRelease("E5", "16n", now + .1); actionSynth.triggerAttackRelease("G5", "16n", now + .2); break;
    case "win": actionSynth.triggerAttackRelease("G5", "8n", now); actionSynth.triggerAttackRelease("C6", "8n", now + .1); break;
  }
}
soundToggle.addEventListener("click", async () => {
  if (isMuted) {
    await Tone.start();
    isMuted = false;
    soundToggle.innerHTML = soundIcons.unmuted;
  } else {
    isMuted = true;
    soundToggle.innerHTML = soundIcons.muted;
  }
});

// ===============================
// Exact HEX Palette 30x16
// ===============================
const HEX_GRID_30x16 = [["#652F0D", "#722C0F", "#7D2913", "#8A2717", "#9E291B", "#AA291D", "#BA2C21", "#D23124", "#F03225", "#FC3022", "#FD3221", "#FD3223", "#FD312B", "#FF3139", "#FD3044", "#F82F51", "#F42E64", "#F22975", "#E72881", "#E32D8D", "#D43D91", "#C74091", "#BC4597", "#B14594", "#A74697", "#984696", "#904A97", "#874997", "#80499A", "#764A9B"], ["#8D4D1C", "#9B4B1D", "#A4461E", "#B74822", "#C44323", "#D33C26", "#E23925", "#F43423", "#FC3521", "#FD3B28", "#FF3D30", "#FD3B3A", "#FD3541", "#FE364A", "#FC345D", "#FD316F", "#FD2B7B", "#F92A8E", "#E74092", "#D74C95", "#C85097", "#BB4D96", "#B04C95", "#A54C95", "#9D4B97", "#934A96", "#854A97", "#80499A", "#764897", "#6A4596"], ["#AA6424", "#B45E22", "#C36023", "#CB5724", "#D85324", "#E24D24", "#ED4823", "#F94220", "#FD482B", "#FE4E3D", "#FE514B", "#FD4E4F", "#FD4E5B", "#FD4765", "#FD4777", "#FD4385", "#F84895", "#E6579A", "#D45B99", "#C35B9E", "#BC589A", "#AD5599", "#A45299", "#99509A", "#904E9B", "#884A9A", "#7C4896", "#754795", "#6B4397", "#5D3993"], ["#D28426", "#DF8424", "#E57C22", "#F37E20", "#F17221", "#F86820", "#FD6B25", "#FE6330", "#FF5E3A", "#FD654F", "#FD6C62", "#FB6C69", "#FD686F", "#FD677E", "#FA628C", "#FA639C", "#E8669D", "#D867A1", "#C56BA4", "#BD65A2", "#AA60A1", "#A35A9F", "#9A589E", "#90559D", "#864F9C", "#7E4C99", "#71479A", "#684097", "#5B3D93", "#49368C"], ["#EE9A1E", "#F89918", "#FF9517", "#FF9018", "#FF8A21", "#FF8029", "#FE8139", "#FE7840", "#FE7B50", "#FC8263", "#FC8272", "#FC847F", "#FD8487", "#FA7F94", "#FB7AA5", "#F07FA8", "#D97EAC", "#CD7DAD", "#C07CAE", "#B272A9", "#A369A7", "#9963A6", "#8F5EA2", "#875AA2", "#7D529E", "#704E9A", "#66479C", "#5A3B92", "#4A3694", "#323286"], ["#FFB20D", "#FFAF1C", "#FFAA25", "#FFAC34", "#FFA83B", "#FFA747", "#FF9B52", "#FF9559", "#FE9060", "#FE926F", "#FC9781", "#FC9990", "#FC9896", "#FC979F", "#FA93B3", "#E698BE", "#D596BE", "#CA95BC", "#BC8ABA", "#AE82B5", "#9F7AB2", "#936FAE", "#8866A9", "#7E61A7", "#7459A3", "#66519E", "#5A499A", "#4C3B93", "#37368F", "#292D7A"], ["#FFBB13", "#FFBD22", "#FFB525", "#FFB434", "#FFBA59", "#FFAC50", "#FFAE61", "#FFA769", "#FFA775", "#FEA782", "#FDA693", "#FEA597", "#FDA7A4", "#FBA4A8", "#FBA6C0", "#E5ACC9", "#D3ACCC", "#D0B1D1", "#B89EC6", "#A790C1", "#9B88BF", "#8B7CB6", "#8073B1", "#736AAE", "#6661AB", "#5A5AA7", "#4F50A4", "#43469C", "#2F3B98", "#2A3488"], ["#FFCA10", "#FFC822", "#FFC428", "#FFC43A", "#FFC443", "#FFBE50", "#FFBB5C", "#FFBA68", "#FFB675", "#FFB57D", "#FFB389", "#FEB89A", "#F9BBA9", "#F7BCB3", "#F0BCC8", "#DBBBD4", "#CFBCDA", "#CEBFDE", "#B3ABD1", "#A6A3CC", "#9598C9", "#828BC2", "#7680C0", "#6778BB", "#5A6CB3", "#5064AF", "#465CAB", "#3B51A3", "#2D47A1", "#213D96"], ["#FFD70F", "#FFD520", "#FFD42C", "#FFD33B", "#FFD745", "#FFD452", "#FFD65B", "#FED465", "#F9D778", "#F3DD8E", "#EFDA9A", "#E7DDAD", "#E0DEBE", "#DADFC7", "#D1DDCF", "#C4DAE5", "#BED7F1", "#BED7F1", "#A3C6E9", "#95B8E2", "#87A9DA", "#76A1D7", "#6D93CF", "#6184C3", "#5279BB", "#496EB7", "#3F63AF", "#385BAC", "#2F50A4", "#24479F"], ["#FBE11C", "#FCE020", "#FEE32E", "#FBE6D", "#FAE745", "#FCEA55", "#F8E964", "#F0E87C", "#E7E487", "#DEE298", "#D7E3A9", "#CFE3BA", "#CFE4C8", "#C9E4D0", "#C3E2D4", "#B7E0E4", "#AEDEF0", "#AFDFF6", "#98D7F6", "#7FCEF7", "#76C1ED", "#6AB0E7", "#5EA4DF", "#5894D3", "#4C88CC", "#467BBE", "#3B6DB8", "#3466B3", "#315CAB", "#2B51A4"], ["#F9E435", "#FAE53A", "#F6E541", "#F6E547", "#F3E456", "#EDE562", "#E7E175", "#DEE080", "#D7DD80", "#C7D788", "#BCD591", "#B1D39E", "#B0D4AC", "#ADD4B4", "#A9D4BF", "#A9D7D5", "#A4D7DE", "#A4D7E0", "#92D2E5", "#81D0EE", "#6CCAF6", "#5AC2F8", "#56B6EB", "#51A5DF", "#4E98D7", "#4387CC", "#397BC4", "#356EB8", "#3164AF", "#2D5DAB"], ["#F3DF1B", "#F3DF24", "#EEDF2C", "#E9DE31", "#E6DC3C", "#DEDB4C", "#D1D659", "#BFD061", "#B1CC6A", "#A6C973", "#9BC67D", "#93C585", "#8EC594", "#86C39C", "#89C5A2", "#86C6B0", "#88C9C0", "#86C9C5", "#7DC6C8", "#73C7D1", "#61C1DB", "#4CBFE2", "#30BAEF", "#2DB0EF", "#32A2E4", "#3393D8", "#3A85CD", "#3277C0", "#356EB8", "#2E64B3"], ["#E0D619", "#DBD520", "#D8D529", "#D2D331", "#C9D03C", "#B9CA3E", "#ADC648", "#9CC04C", "#8DBD54", "#82BA5B", "#73B664", "#6BB66E", "#6AB67A", "#65B67F", "#67B686", "#6AB992", "#69BA9C", "#6CBCA2", "#6EBEA7", "#63BCB5", "#57B9B9", "#4BBAC7", "#3CB7CF", "#23B3DB", "#0CADE8", "#14A0E4", "#1D94D9", "#2F88D1", "#2A7AC3", "#2570BC"], ["#C1CC25", "#BBCA29", "#B3C62D", "#A9C233", "#9EC036", "#91BB39", "#7CB43C", "#75B13D", "#66AD3F", "#58A544", "#4DA548", "#47A350", "#3FA859", "#41A966", "#48AB70", "#4EAF78", "#51AF7E", "#54B182", "#59B488", "#58B58F", "#52B49B", "#48B4A9", "#3CB3B1", "#2BB2C0", "#1BB0D0", "#07ABDA", "#01A1E0", "#0A9ADF", "#188DD4", "#1F7FC8"], ["#9CB834", "#97B837", "#92B639", "#85B13C", "#7BAE3E", "#69A440", "#5EA241", "#509A42", "#489844", "#399045", "#2D8D45", "#279247", "#219848", "#219D48", "#26A153", "#2EA459", "#39A863", "#3DA96E", "#41AB70", "#49AD74", "#4BAF83", "#41AF91", "#3BB19C", "#2EB0A9", "#22AFB5", "#1BAFC6", "#0DADD4", "#00A4D7", "#009BDC", "#0994DD"], ["#789A3B", "#759E3E", "#6B9A3F", "#61963F", "#549741", "#479142", "#3B8B42", "#328842", "#218243", "#177A41", "#0F793E", "#0A7F42", "#0C8847", "#0E8E47", "#109748", "#159C4A", "#23A048", "#29A254", "#31A55D", "#36A764", "#37A86E", "#30A97B", "#27AA87", "#1FA995", "#15AAA0", "#0CA9AE", "#0CACBE", "#06ACCA", "#03A8D8", "#00A3E4"]];
function hexAt(rowIdx, colIdx) { return HEX_GRID_30x16[rowIdx][colIdx]; }
function coordLabel(x, y) { return `${COORD_LETTERS[y]}${x + 1}`; }

// ===============================
// Authentication
// ===============================
async function authenticateUser() {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Authentication failed:", error);
        document.getElementById("lobby-error").textContent = "Error de autenticación.";
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        const last = JSON.parse(localStorage.getItem("hue-hunt-game"));
        if (last?.gameId && last?.userId) {
            rejoinGame(last.gameId, last.userId);
        }
    }
});

// ===============================
// Lobby / Create / Join
// ===============================
document.getElementById("create-game-btn").addEventListener("click", () => { playSound("click"); createGame(); });
document.getElementById("join-game-btn").addEventListener("click", () => { playSound("click"); joinGame(); });
document.getElementById("start-game-btn").addEventListener("click", () => { playSound("click"); startGame(); });
document.getElementById("game-id-display").addEventListener("click", copyGameId);
document.getElementById("exit-lobby-btn").addEventListener("click", executeLeave);
document.getElementById("leave-game-btn").addEventListener("click", confirmLeave);
document.getElementById("confirm-leave-btn").addEventListener("click", executeLeave);
document.getElementById("cancel-leave-btn").addEventListener("click", () => confirmLeaveModal.classList.add("hidden"));
document.getElementById("new-game-btn").addEventListener("click", () => { playSound("click"); restartGame(); });

function getPlayerName() {
    const name = document.getElementById("player-name").value.trim();
    if (!name) {
        document.getElementById("lobby-error").textContent = "Por favor, introduce tu nombre.";
        return null;
    }
    return name;
}

async function createGame() {
    const playerName = getPlayerName();
    if (!playerName || !currentUserId) return;

    const gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    currentGameId = gameId;
    const gameRef = doc(gamesCollection, gameId);

    const newPlayer = { name: playerName, color: playerColors[0], score: 0, isHost: true };
    const gameData = {
        hostId: currentUserId,
        players: { [currentUserId]: newPlayer },
        playerOrder: [currentUserId],
        gameState: "waiting",
        gameSettings: {
            roundLimit: 10, // Default value
            scoreLimit: 25, // Default value
            gridMode: "30x16" // Default value
        },
        createdAt: new Date()
    };

    try {
        await setDoc(gameRef, gameData);
        localStorage.setItem("hue-hunt-game", JSON.stringify({ gameId, userId: currentUserId }));
        subscribeToGame(gameId);
        showScreen("waiting-room");
    } catch (err) { console.error("createGame", err); }
}

async function joinGame() {
    const playerName = getPlayerName();
    if (!playerName || !currentUserId) return;

    const gameId = document.getElementById("join-game-id").value.trim().toUpperCase();
    if (!gameId) { document.getElementById("lobby-error").textContent = "Introduce un código."; return; }

    const gameRef = doc(gamesCollection, gameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) { document.getElementById("lobby-error").textContent = "Partida no encontrada."; return; }

    const data = snap.data();

    if (Object.keys(data.players).length >= MAX_PLAYERS) {
        document.getElementById("lobby-error").textContent = "La partida está llena (máx 10).";
        return;
    }

    if (data.gameState !== "waiting") {
        const entry = Object.entries(data.players).find(([id, p]) => p.name === playerName);
        if (entry) {
            const existingId = entry[0];
            localStorage.setItem("hue-hunt-game", JSON.stringify({ gameId, userId: existingId }));
            rejoinGame(gameId, existingId);
            return;
        } else {
            document.getElementById("lobby-error").textContent = "La partida ya ha comenzado.";
            return;
        }
    }

    const color = playerColors[Object.keys(data.players).length % playerColors.length];
    const newPlayer = { name: playerName, color, score: 0, isHost: false };
    const updatedPlayers = { ...data.players, [currentUserId]: newPlayer };
    const updatedOrder = [...data.playerOrder, currentUserId];

    try {
        await updateDoc(gameRef, { players: updatedPlayers, playerOrder: updatedOrder });
        localStorage.setItem("hue-hunt-game", JSON.stringify({ gameId, userId: currentUserId }));
        currentGameId = gameId;
        subscribeToGame(gameId);
        showScreen("waiting-room");
    } catch (err) { console.error("joinGame", err); }
}

async function rejoinGame(gameId, userId) {
    const gameRef = doc(gamesCollection, gameId);
    const snap = await getDoc(gameRef);
    if (snap.exists()) {
        currentGameId = gameId;
        currentUserId = userId;
        subscribeToGame(gameId);
    } else {
        localStorage.removeItem("hue-hunt-game");
    }
}

function subscribeToGame(gameId) {
    if (unsubscribeGame) unsubscribeGame();
    const gameRef = doc(gamesCollection, gameId);
    unsubscribeGame = onSnapshot(gameRef, (docSnap) => {
        if (!docSnap.exists()) {
            localStorage.removeItem("hue-hunt-game");
            executeLeave(); return;
        }
        const data = docSnap.data();
        latestGameData = data; // Cache data for resize
        currentHostId = data.hostId;
        updateUI(data);
    });
}

function copyGameId() {
    playSound("click");
    const id = document.getElementById("game-id-display").textContent;
    navigator.clipboard.writeText(id).then(() => {
        // Optional: show a "copied!" message
    });
}

// ===============================
// Game Flow
// ===============================
async function startGame() {
    if (!currentGameId || !latestGameData) return;
    const errorP = document.getElementById("waiting-room-error");
    if (errorP) errorP.textContent = "";

    const data = latestGameData; // Use cached data instead of fetching again

    if (data.hostId !== currentUserId) {
        if (errorP) errorP.textContent = "Solo el creador puede empezar la partida.";
        return;
    }
    if (Object.keys(data.players).length < 2) {
        if (errorP) errorP.textContent = "Se necesitan al menos 2 jugadores para empezar.";
        return;
    }

    const gameRef = doc(gamesCollection, currentGameId);
    const { gridMode } = data.gameSettings;
    const view = gridMode === "12x8" ? randomWindow12x8() : { startX: 0, startY: 0, cols: 30, rows: 16 };

    const newCard = { x: null, y: null, color: null }; // Dador must choose
    try {
        await updateDoc(gameRef, {
            gameState: "giving_clue_1",
            currentRound: 1,
            currentPlayerIndex: 0,
            currentCard: newCard,
            clues: [],
            guesses: {},
            viewWindow: view
        });
    } catch (err) {
        console.error("Error starting game:", err);
        if (errorP) errorP.textContent = "Error al iniciar la partida. Inténtalo de nuevo.";
    }
}

function randomWindow12x8() {
    const cols = 12, rows = 8;
    const startX = Math.floor(Math.random() * (GRID_COLS - cols + 1));
    const startY = Math.floor(Math.random() * (GRID_ROWS - rows + 1));
    return { startX, startY, cols, rows };
}

// ===============================
// UI Rendering
// ===============================
function showScreen(name) {
    lobbyScreen.classList.add("hidden");
    waitingRoomScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    document.getElementById(`${name}-screen`).classList.remove("hidden");
}

function updateUI(data) {
    if (data.gameState === "waiting") {
        gameOverModal.classList.add("hidden");
        showScreen("waiting-room");
        document.getElementById("game-id-display").textContent = currentGameId;

        const list = document.getElementById("player-list");
        list.innerHTML = "";
        data.playerOrder.forEach(pid => {
            const p = data.players[pid];
            const li = document.createElement("li");
            li.className = "flex items-center";
            li.innerHTML = `<div class="w-4 h-4 rounded-full mr-2 border border-gray-400" style="background:${p.color}"></div> ${p.name} ${p.isHost ? '(Host)' : ''}`;
            list.appendChild(li);
        });

        const isHost = data.hostId === currentUserId;
        document.getElementById("start-game-btn").style.display = isHost ? "block" : "none";
        document.getElementById("start-game-helper").style.display = isHost ? "block" : "none";

        // Settings Panel Logic
        const settingsPanel = document.getElementById("game-settings-panel");
        const roundLimitInput = document.getElementById("round-limit");
        const scoreLimitInput = document.getElementById("score-limit");
        const gridSizeSelectInput = document.getElementById("grid-size-select");

        settingsPanel.classList.remove("hidden");

        roundLimitInput.value = data.gameSettings.roundLimit;
        scoreLimitInput.value = data.gameSettings.scoreLimit;
        gridSizeSelectInput.value = data.gameSettings.gridMode;

        roundLimitInput.disabled = !isHost;
        scoreLimitInput.disabled = !isHost;
        gridSizeSelectInput.disabled = !isHost;
        
        if (!isHost) {
            document.getElementById("start-game-helper").textContent = "Esperando que el anfitrión inicie la partida...";
        }

        const limits = document.getElementById("game-limits-display");
        limits.textContent = `Tamaño: ${data.gameSettings.gridMode} | Rondas: ${data.gameSettings.roundLimit} | Límite: ${data.gameSettings.scoreLimit} puntos`;
        return;
    }

    if (data.gameState === "gameOver") { showGameOver(data); return; }
    if (data.gameState === "roundSummary") { showRoundSummary(data); return; }

    roundSummaryModal.classList.add("hidden");
    showScreen("game");

    const t = document.getElementById("game-title");
    const names = data.playerOrder.map(pid => data.players[pid].name);
    t.textContent = (names.length === 2) ? `${names[0]} vs ${names[1]}` : "Partida grupal";

    renderScores(data);
    renderBoard(data);
    renderGameInfo(data);
    renderControls(data);
}

function renderScores(data) {
    const c = document.getElementById("player-scores");
    c.innerHTML = "";
    data.playerOrder.forEach(pid => {
        const p = data.players[pid];
        const row = document.createElement("div");
        row.className = "flex justify-between items-center p-2 rounded-md";
        row.innerHTML = `
    <div class="flex items-center">
      <div class="w-5 h-5 rounded-full mr-3 border border-gray-400" style="background:${p.color}"></div>
      <span class="font-medium">${p.name}</span>
    </div>
    <span class="font-bold text-lg">${p.score}</span>`;
        c.appendChild(row);
    });
}

function visibleWindow(data) {
    const mode = data.gameSettings.gridMode;
    const v = data.viewWindow || { startX: 0, startY: 0, cols: 30, rows: 16 };
    return (mode === "12x8") ? v : { startX: 0, startY: 0, cols: 30, rows: 16 };
}

function renderBoard(data) {
    document.querySelectorAll('.player-marker, .pawn-marker, .secret-color-highlight').forEach(el => {
        el.parentNode.removeChild(el);
    });
    document.querySelectorAll('.scoring-overlay').forEach(el => el.classList.add("hidden"));

    const grid = colorGrid;
    const mode = data.gameSettings.gridMode;
    const v = visibleWindow(data);
    grid.dataset.mode = mode;
    grid.style.setProperty("--grid-cols", v.cols);
    grid.style.setProperty("--grid-aspect-ratio", `${v.cols} / ${v.rows}`);
    grid.innerHTML = "";

    for (let y = 0; y < v.rows; y++) {
        for (let x = 0; x < v.cols; x++) {
            const realX = v.startX + x;
            const realY = v.startY + y;
            const cell = document.createElement("div");
            cell.className = "color-cell";
            cell.style.backgroundColor = hexAt(realY, realX);
            cell.dataset.x = realX;
            cell.dataset.y = realY;
            cell.title = coordLabel(realX, realY);
            grid.appendChild(cell);
        }
    }

    const cueId = data.playerOrder[data.currentPlayerIndex];
    const isCue = currentUserId === cueId;
    if (isCue && data.gameState !== "scoring" && data.gameState !== "roundSummary" && data.currentCard?.x != null) {
        const { x, y } = data.currentCard;
        const secret = grid.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (secret) {
            const highlight = document.createElement('div');
            highlight.className = 'secret-color-highlight';
            highlight.style.position = 'absolute';
            highlight.style.inset = '0';
            secret.appendChild(highlight);
        }
    }

    const drawMarker = (guess, player, isTemporary = false) => {
        const cell = grid.querySelector(`[data-x="${guess.x}"][data-y="${guess.y}"]`);
        if (!cell) return;
        
        const chip = document.createElement("div");
        chip.className = "player-marker";
        if(isTemporary) chip.style.borderStyle = 'dashed';
        chip.style.background = player.color;
        chip.textContent = player.name.substring(0, 1).toUpperCase();
        cell.appendChild(chip);
        
        const pawn = document.createElement("div");
        pawn.className = "pawn-marker";
        if(isTemporary) pawn.style.opacity = '0.8';
        pawn.innerHTML = `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g${player.color.replace('#','')}" cx="50%" cy="35%" r="65%"><stop offset="0%" stop-color="#fff" stop-opacity=".85"/><stop offset="100%" stop-color="#ffffff" stop-opacity=".0"/></radialGradient></defs><g fill="${player.color}"><circle cx="32" cy="22" r="10"/><path d="M32 32c-9 0-16 7-16 16h32c0-9-7-16-16-16z"/><rect x="16" y="48" width="32" height="6" rx="2"/><rect x="12" y="54" width="40" height="6" rx="3"/></g><circle cx="28" cy="18" r="6" fill="url(#g${player.color.replace('#','')})"/></svg>`;
        cell.appendChild(pawn);
    };

    const revealPhase = ["scoring", "gameOver", "roundSummary"].includes(data.gameState) || isCue;
    if (data.guesses) {
        Object.entries(data.guesses).forEach(([pid, arr]) => {
            const p = data.players[pid];
            if (!p) return;
            if (revealPhase || pid === currentUserId) {
                arr.forEach(g => drawMarker(g, p));
            }
        });
    }
    
    if (temporaryGuess) {
        const me = data.players[currentUserId];
        drawMarker(temporaryGuess, me, true);
    }

    if (["scoring", "gameOver", "roundSummary"].includes(data.gameState)) {
        const { x, y } = data.currentCard || {};
        if (x == null || y == null) return;
        
        const firstCell = grid.firstChild;
        if (!firstCell) return;

        const cellWidth = firstCell.offsetWidth;
        const cellHeight = firstCell.offsetHeight;
        const gap = parseFloat(getComputedStyle(grid).gap);

        function drawBox(size, id) {
            const box = document.getElementById(id);
            if (!box) return;
            const boxLeft = (x - Math.floor(size / 2) - v.startX) * (cellWidth + gap);
            const boxTop = (y - Math.floor(size / 2) - v.startY) * (cellHeight + gap);
            const boxSizeW = size * (cellWidth + gap) - gap;
            const boxSizeH = size * (cellHeight + gap) - gap;
            
            box.style.left = `${boxLeft}px`;
            box.style.top = `${boxTop}px`;
            box.style.width = `${boxSizeW}px`;
            box.style.height = `${boxSizeH}px`;
            box.classList.remove("hidden");
        }

        if (data.gameSettings.gridMode === "12x8") {
            drawBox(3, "scoring-box-2");
        } else {
            drawBox(1, "scoring-box-3");
            drawBox(3, "scoring-box-2");
            drawBox(5, "scoring-box-1");
        }
    }
}

function renderGameInfo(data) {
    const info = document.getElementById("game-info");
    const cueId = data.playerOrder[data.currentPlayerIndex];
    const cue = data.players[cueId];

    let html = `<p><strong>Ronda:</strong> ${data.currentRound} / ${data.gameSettings.roundLimit}</p>`;
    html += `<p><strong>Dador de pista:</strong> ${cue.name}</p>`;
    info.innerHTML = html;

    document.getElementById("clue-display").innerHTML = (data.clues || []).map(t => `<span>${t}</span>`).join("");

    const view = document.getElementById("cue-giver-view");
    if (currentUserId === cueId && !["scoring", "roundSummary", "gameOver"].includes(data.gameState)) {
        view.classList.remove("hidden");
        const scd = document.getElementById("secret-color-display");
        const coords = document.getElementById("secret-color-coords");
        const c = data.currentCard || {};
        if (c.x != null) {
            scd.style.background = hexAt(c.y, c.x);
            coords.textContent = coordLabel(c.x, c.y);
        } else {
            scd.style.background = "transparent";
            coords.textContent = "Elige un color";
        }

        const wrap = document.getElementById("candidate-swatches");
        if (!(data.candidates?.length)) {
            if (currentUserId === data.playerOrder[data.currentPlayerIndex]) {
                generateCandidates(data);
            }
        } else {
            wrap.innerHTML = "";
            data.candidates.forEach(cand => {
                const sw = document.createElement("button");
                sw.className = "swatch";
                sw.style.background = hexAt(cand.y, cand.x);
                sw.title = coordLabel(cand.x, cand.y);
                sw.onclick = () => chooseSecret(cand);
                wrap.appendChild(sw);
            });
        }

        const btn = document.getElementById("submit-clue-btn");
        const input = document.getElementById("clue-input");
        const clueCount = (data.clues || []).length;
        btn.textContent = clueCount === 0 ? "Dar Pista 1" : "Dar Pista 2";
        btn.onclick = () => submitClue(clueCount + 1);
        input.onkeydown = (e) => { if (e.key === "Enter") btn.onclick(); };
    } else {
        view.classList.add("hidden");
    }
}

function renderControls(data) {
    const c = document.getElementById("controls");
    c.innerHTML = "";
    const cueId = data.playerOrder[data.currentPlayerIndex];
    const isCue = currentUserId === cueId;

    if (isCue) {
        if (data.gameState === "guessing_1" || data.gameState === "guessing_2") {
            const guessers = data.playerOrder.filter(id => id !== cueId);
            const req = data.gameState === "guessing_1" ? 1 : 2;
            const allGuessed = guessers.every(id => (data.guesses[id]?.length || 0) >= req);
            if (allGuessed) {
                const b = document.createElement("button");
                b.className = "btn-primary";
                b.style.backgroundColor = "#ef4444";
                b.textContent = "Revelar color";
                b.onclick = reveal;
                c.appendChild(b);
            } else {
                c.innerHTML = `<p class="text-gray-400">Esperando que los demás adivinen...</p>`;
            }
        } else if (data.gameState.startsWith("giving_clue")) {
            c.innerHTML = `<p class="text-gray-400">Elige el color secreto y da la pista.</p>`;
        }
    } else {
        const myGuesses = data.guesses?.[currentUserId] || [];
        const canGuessNow = (data.gameState === "guessing_1" && myGuesses.length === 0) || (data.gameState === "guessing_2" && myGuesses.length === 1);

        if (temporaryGuess) {
            const tempCell = colorGrid.querySelector(`[data-x="${temporaryGuess.x}"][data-y="${temporaryGuess.y}"]`);
            const color = tempCell ? tempCell.style.backgroundColor : "#000";
            c.innerHTML = `
        <div class="flex items-center justify-center gap-4">
          <div class="w-10 h-10 rounded-md border-2 border-gray-500" style="background:${color}"></div>
          <button id="confirm-guess-btn" class="btn-primary">Confirmar elección</button>
        </div>`;
            document.getElementById("confirm-guess-btn").onclick = confirmGuess;
        } else if (canGuessNow) {
            c.innerHTML = `<p class="text-gray-400">Selecciona un color en el tablero.</p>`;
        } else {
            c.innerHTML = `<p class="text-gray-400">Espera tu turno o la siguiente pista.</p>`;
        }
    }
}

// ===============================
// Board Interactions
// ===============================
colorGrid.addEventListener("click", handleGridClick);

async function handleGridClick(e) {
    const cell = e.target.closest(".color-cell");
    if (!cell || !currentGameId) return;

    const data = latestGameData;
    if (!data) return;

    const cueId = data.playerOrder[data.currentPlayerIndex];
    if (currentUserId === cueId) return;

    const myGuesses = data.guesses?.[currentUserId] || [];
    const canGuessNow = (data.gameState === "guessing_1" && myGuesses.length === 0) || (data.gameState === "guessing_2" && myGuesses.length === 1);
    if (!canGuessNow) return;

    playSound("select");
    temporaryGuess = {
        x: parseInt(cell.dataset.x, 10),
        y: parseInt(cell.dataset.y, 10)
    };
    renderBoard(data);
    renderControls(data);
}

async function confirmGuess() {
    if (!temporaryGuess) return;
    playSound("confirm");
    const gameRef = doc(gamesCollection, currentGameId);
    const data = latestGameData;

    const myGuesses = data.guesses?.[currentUserId] || [];
    const updatedGuesses = { ...data.guesses, [currentUserId]: [...myGuesses, temporaryGuess] };
    temporaryGuess = null;
    await updateDoc(gameRef, { guesses: updatedGuesses });

    const cueId = data.playerOrder[data.currentPlayerIndex];
    const guessers = data.playerOrder.filter(id => id !== cueId);
    const req = data.gameState === "guessing_1" ? 1 : 2;
    const allGuessed = guessers.every(id => (updatedGuesses[id]?.length || 0) >= req);

    if (allGuessed && data.gameState === "guessing_1") {
        await updateDoc(gameRef, { gameState: "giving_clue_2" });
    }
}

// ===============================
// Clues & Secret Color
// ===============================
async function generateCandidates(data) {
    const gameRef = doc(gamesCollection, currentGameId);
    const v = visibleWindow(data);
    const picks = new Set();
    while (picks.size < 4) {
        const x = v.startX + Math.floor(Math.random() * v.cols);
        const y = v.startY + Math.floor(Math.random() * v.rows);
        picks.add(`${x},${y}`);
    }
    const candidates = Array.from(picks).map(s => {
        const [x, y] = s.split(",").map(n => parseInt(n, 10));
        return { x, y };
    });
    await updateDoc(gameRef, { candidates });
}

async function chooseSecret(cand) {
    playSound("confirm");
    const gameRef = doc(gamesCollection, currentGameId);
    await updateDoc(gameRef, {
        currentCard: { x: cand.x, y: cand.y, color: hexAt(cand.y, cand.x) }
    });
}

async function submitClue(n) {
    const input = document.getElementById("clue-input");
    const errorP = document.getElementById("clue-error");
    if(errorP) errorP.textContent = "";

    const text = (input.value || "").trim();
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    if (!firstWord) return;

    if (FORBIDDEN_WORDS.includes(firstWord)) {
        if(errorP) errorP.textContent = `La palabra "${firstWord}" no está permitida.`;
        input.value = ""; return;
    }

    const gameRef = doc(gamesCollection, currentGameId);
    const data = latestGameData;

    if (data.currentCard?.x == null) {
        if(errorP) errorP.textContent = "Primero elige un color secreto.";
        return;
    }

    await updateDoc(gameRef, {
        clues: [...(data.clues || []), firstWord],
        gameState: (n === 1 ? "guessing_1" : "guessing_2")
    });
    input.value = "";
}

// ===============================
// Scoring & Round End
// ===============================
async function reveal() {
    const gameRef = doc(gamesCollection, currentGameId);
    await updateDoc(gameRef, { gameState: "scoring" });
    setTimeout(calculateAndShowScores, 2000);
}

async function calculateAndShowScores() {
    const gameRef = doc(gamesCollection, currentGameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const data = snap.data();

    const { x: tx, y: ty } = data.currentCard;
    const cueId = data.playerOrder[data.currentPlayerIndex];
    let cuePoints = 0;
    const roundPoints = {};
    const updatedPlayers = JSON.parse(JSON.stringify(data.players));
    Object.keys(updatedPlayers).forEach(pid => roundPoints[pid] = { name: updatedPlayers[pid].name, points: 0 });

    Object.entries(data.guesses || {}).forEach(([pid, guesses]) => {
        let playerRoundPoints = 0;
        guesses.forEach(g => {
            const dx = Math.abs(g.x - tx), dy = Math.abs(g.y - ty);
            let pts = 0;
            if (dx === 0 && dy === 0) pts = 3;
            else if (dx <= 1 && dy <= 1) pts = 2;
            else if (data.gameSettings.gridMode !== "12x8" && dx <= 2 && dy <= 2) pts = 1;

            playerRoundPoints += pts;
            if (pid !== cueId && dx <= 1 && dy <= 1) cuePoints++;
        });
        updatedPlayers[pid].score += playerRoundPoints;
        roundPoints[pid].points = playerRoundPoints;
    });

    updatedPlayers[cueId].score += cuePoints;
    roundPoints[cueId].points = cuePoints;

    await updateDoc(gameRef, { players: updatedPlayers, lastRoundSummary: roundPoints });

    const winner = Object.values(updatedPlayers).find(p => p.score >= data.gameSettings.scoreLimit);
    const roundLimitReached = data.currentRound >= data.gameSettings.roundLimit;
    if (winner || roundLimitReached) {
        await updateDoc(gameRef, { gameState: "gameOver" });
    } else {
        await updateDoc(gameRef, { gameState: "roundSummary" });
    }
}

function showRoundSummary(data) {
    const wrap = document.getElementById("summary-content");
    document.getElementById("summary-title").textContent = `Fin de la ronda ${data.currentRound} / ${data.gameSettings.roundLimit}`;
    const total = Object.values(data.lastRoundSummary || {}).reduce((s, p) => s + p.points, 0);
    if (total > 0) playSound("success"); else playSound("click");

    wrap.innerHTML = Object.values(data.lastRoundSummary || {}).map(p => `<p><strong>${p.name}:</strong> +${p.points} puntos</p>`).join("");
    roundSummaryModal.classList.remove("hidden");
}

document.getElementById("next-round-btn").addEventListener("click", async () => {
    playSound("click");
    const gameRef = doc(gamesCollection, currentGameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const data = snap.data();

    const nextIdx = (data.currentPlayerIndex + 1) % data.playerOrder.length;
    const nextRound = nextIdx === 0 ? data.currentRound + 1 : data.currentRound;
    const view = data.gameSettings.gridMode === "12x8" ? randomWindow12x8() : { startX: 0, startY: 0, cols: 30, rows: 16 };

    await updateDoc(gameRef, {
        gameState: "giving_clue_1",
        currentRound: nextRound,
        currentPlayerIndex: nextIdx,
        currentCard: { x: null, y: null, color: null },
        clues: [],
        guesses: {},
        candidates: [],
        viewWindow: view
    });
    roundSummaryModal.classList.add("hidden");
});

function showGameOver(data) {
    const winnerId = data.playerOrder.reduce((a, b) => data.players[a].score > data.players[b].score ? a : b);
    document.getElementById("winner-name").textContent = data.players[winnerId].name;
    gameOverModal.classList.remove("hidden");

    playSound("win");
    const canvas = document.getElementById("confetti-canvas");
    const fire = confetti.create(canvas, { resize: true });
    fire({ particleCount: 220, spread: 160, origin: { y: .6 } });
}

async function restartGame() {
    if (!currentGameId) return;
    const errorP = document.getElementById("game-over-error");
    if(errorP) errorP.textContent = "";

    const gameRef = doc(gamesCollection, currentGameId);
    const snap = await getDoc(gameRef);
    if (!snap.exists()) return;
    const data = snap.data();
    if (currentUserId !== data.hostId) { 
        if(errorP) errorP.textContent = "Solo el anfitrión puede reiniciar la partida.";
        return; 
    }

    const resetPlayers = {};
    data.playerOrder.forEach(pid => resetPlayers[pid] = { ...data.players[pid], score: 0 });

    await updateDoc(gameRef, {
        players: resetPlayers,
        gameState: "waiting",
        candidates: []
    });
    gameOverModal.classList.add("hidden");
}

// ===============================
// Leave Game
// ===============================
function confirmLeave() { confirmLeaveModal.classList.remove("hidden"); }
async function executeLeave() {
    if (unsubscribeGame) unsubscribeGame();
    if (currentUserId === currentHostId && currentGameId) {
        const ref = doc(gamesCollection, currentGameId);
        await deleteDoc(ref);
    }
    localStorage.removeItem("hue-hunt-game");
    currentGameId = null;
    currentHostId = null;
    latestGameData = null;
    confirmLeaveModal.classList.add("hidden");
    showScreen("lobby");
    location.reload(); // To clear all state
}

// ===============================
// Host Settings Live Update
// ===============================
document.getElementById("round-limit").addEventListener("change", e => updateGameSettings({ roundLimit: parseInt(e.target.value || "10", 10) }));
document.getElementById("score-limit").addEventListener("change", e => updateGameSettings({ scoreLimit: Math.min(parseInt(e.target.value || `${DEFAULT_SCORE_LIMIT}`, 10), DEFAULT_SCORE_LIMIT) }));
gridSizeSelect.addEventListener("change", e => updateGameSettings({ gridMode: e.target.value }));

async function updateGameSettings(newSettings) {
    if (!currentGameId || !latestGameData) return;
    const gameRef = doc(gamesCollection, currentGameId);
    if (currentUserId !== latestGameData.hostId) return;
    await updateDoc(gameRef, { gameSettings: { ...latestGameData.gameSettings, ...newSettings } });
}

// ===============================
// Initialization & Resize Handling
// ===============================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedRender = debounce(() => {
    if (latestGameData && !gameScreen.classList.contains('hidden')) {
        renderBoard(latestGameData);
    }
}, 150);

window.addEventListener('resize', debouncedRender);

// Initial call to authenticate and start the app
authenticateUser();
