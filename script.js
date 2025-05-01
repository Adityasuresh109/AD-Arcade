// === Starfield Background ===
const starCanvas = document.getElementById("stars");
const starCtx = starCanvas.getContext("2d");
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;

let stars = Array(150).fill().map(() => ({
  x: Math.random() * starCanvas.width,
  y: Math.random() * starCanvas.height,
  radius: Math.random() * 1.2,
  speed: 0.5 + Math.random()
}));

function drawStars() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  starCtx.fillStyle = '#fff';
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > starCanvas.height) {
      star.y = 0;
      star.x = Math.random() * starCanvas.width;
    }
    starCtx.beginPath();
    starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    starCtx.fill();
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// === Global Variables ===
let playerName = '';
let currentTheme = 'galaxy';
let currentLevel = 'easy';
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('dxball_highscore') || 0;
let leaderboard = JSON.parse(localStorage.getItem('adArcadeLeaderboard')) || [];
let paddle, balls, bricks, powerUps;
let levelIndex = 0;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === DOM Elements ===
const loginScreen = document.getElementById('loginScreen');
const startGameBtn = document.getElementById('startGameBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const leaderboardPanel = document.getElementById('leaderboardPanel');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const leaderboardList = document.getElementById('leaderboardList');

// === Event Listeners ===
startGameBtn.addEventListener('click', () => {
  const nameInput = document.getElementById('playerName').value.trim();
  if (!nameInput) return alert("Please enter your name.");
  playerName = nameInput;
  currentTheme = document.getElementById('themeSelect').value;
  currentLevel = document.getElementById('levelSelect').value;
  document.body.className = currentTheme;

  loginScreen.classList.add('hidden');
  document.getElementById('gameTitle').classList.remove('hidden');
  document.getElementById('scoreboard').classList.remove('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden');
  document.querySelector('.mobile-controls').classList.remove('hidden');
  document.getElementById('currentPlayer').textContent = playerName;

  initGame(currentLevel);
  updateUI();
  draw();
});

viewLeaderboardBtn.addEventListener('click', () => {
  leaderboardPanel.classList.remove('hidden');
  renderLeaderboard();
});

closeLeaderboardBtn.addEventListener('click', () => {
  leaderboardPanel.classList.add('hidden');
});
// === Leaderboard ===
function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  sorted.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `#${i + 1} <strong>${entry.name}</strong> — ${entry.score} pts [${entry.theme}]`;
    leaderboardList.appendChild(li);
  });
}

function saveLeaderboard() {
  localStorage.setItem('adArcadeLeaderboard', JSON.stringify(leaderboard));
}

// === 🚀 Launch Ball (Updated with draw call) ===
function launchBall() {
  ballLaunched = true;
  balls.forEach(ball => {
    ball.dx = ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -ballSpeed;
    ball.stuck = false;
  });
  draw(); // Ensure the game loop starts
}

// === 🎧 Music Logic (Improved Playback Handling) ===
const musicToggle = document.getElementById("musicToggle").checked;
const bgMusic = document.getElementById("bgMusic");

if (musicToggle) {
  bgMusic.volume = 0.3;
  bgMusic.play().then(() => {
    console.log("Music started successfully.");
  }).catch(e => {
    alert("Music playback blocked by your browser. Click or tap anywhere to start.");
    document.body.addEventListener("click", () => bgMusic.play());
  });
} else {
  bgMusic.pause();
}
