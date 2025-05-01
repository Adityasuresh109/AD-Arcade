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

// === Game State ===
let playerName = '';
let currentTheme = 'galaxy';
let currentLevel = 'easy';
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('dxball_highscore') || 0;
let leaderboard = JSON.parse(localStorage.getItem('adArcadeLeaderboard')) || [];
let levelIndex = 0;
let paddle, balls, bricks, powerUps;
let ballSpeedMultiplier = 1.0;
let ballLaunchTimer = null;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === DOM Elements ===
const loginScreen = document.getElementById('loginScreen');
const startGameBtn = document.getElementById('startGameBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const leaderboardPanel = document.getElementById('leaderboardPanel');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const leaderboardList = document.getElementById('leaderboardList');
const musicElement = document.getElementById("bgMusic");

// === Leaderboard Logic ===
function saveLeaderboard() {
  localStorage.setItem('adArcadeLeaderboard', JSON.stringify(leaderboard));
}

function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  sorted.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `#${i + 1} <strong>${entry.name}</strong> — ${entry.score} pts [${entry.theme}]`;
    leaderboardList.appendChild(li);
  });
}

// === UI Events ===
startGameBtn.addEventListener('click', () => {
  const nameInput = document.getElementById('playerName').value.trim();
  if (!nameInput) return alert("Please enter your name.");
  playerName = nameInput;
  currentTheme = document.getElementById('themeSelect').value;
  currentLevel = document.getElementById('levelSelect').value;
  document.body.className = currentTheme;

  if (document.getElementById('musicToggle').checked) {
    musicElement.volume = 0.3;
    musicElement.play().catch(e => console.warn("Music blocked:", e));
  } else {
    musicElement.pause();
  }

  loginScreen.classList.add('hidden');
  document.getElementById('gameTitle').classList.remove('hidden');
  document.getElementById('scoreboard').classList.remove('hidden');
  document.getElementById('gameCanvas').classList.remove('hidden');
  document.querySelector('.mobile-controls').classList.remove('hidden');
  document.getElementById('currentPlayer').textContent = playerName;

  initGame(currentLevel);
  updateUI();
});
viewLeaderboardBtn.addEventListener('click', () => {
  leaderboardPanel.classList.remove('hidden');
  renderLeaderboard();
});
closeLeaderboardBtn.addEventListener('click', () => {
  leaderboardPanel.classList.add('hidden');
});
