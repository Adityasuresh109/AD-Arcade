// === Starfield Background ===
const starCanvas = document.getElementById("stars");
const starCtx = starCanvas.getContext("2d");
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;

let stars = Array(100).fill().map(() => ({
  x: Math.random() * starCanvas.width,
  y: Math.random() * starCanvas.height,
  radius: Math.random() * 1.5,
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
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('dxball_highscore') || 0;
let leaderboard = JSON.parse(localStorage.getItem('adArcadeLeaderboard')) || [];
let currentLevel = 'easy';
let levelIndex = 0;
let paddle, balls, bricks, powerUps;
let ballSpeedMultiplier = 1.0;

// Canvas setup
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
const restartBtn = document.getElementById("restartBtn");

// === Leaderboard Functions ===
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
  document.body.className = currentTheme;

  if (document.getElementById('musicToggle').checked) {
    musicElement.volume = 0.3;
    musicElement.play().catch(e => console.warn("Music blocked:", e));
  } else {
    musicElement.pause();
  }

  // ✅ FIX: Set initial level before starting game
  currentLevel = 'easy';
  levelIndex = 0;

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
// === Level Layouts ===
const levels = {
  easy:   [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
  medium: [1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0],
  hard:   [1,1,1,1,1,1,1,1, 1,0,1,0,1,0,1,1, 1,1,0,1,0,1,1,1, 1,1,1,0,1,1,1,1, 1,1,1,1,1,1,1,1]
};

const brickConfig = {
  colCount: 8,
  rowCount: 5,
  width: 75,
  height: 20,
  padding: 10,
  offsetTop: 40,
  offsetLeft: 35
};

const powerUpTypes = ["wide", "life", "slow", "multi", "fireball"];

// === Init Game ===
function initGame(levelName) {
  score = 0;
  lives = 3;
  powerUps = [];
  ballSpeedMultiplier = {
    easy: 1.0,
    medium: 1.3,
    hard: 1.6
  }[levelName];

  paddle = {
    height: 15,
    width: 100,
    x: (canvas.width - 100) / 2,
    dx: 7,
    movingLeft: false,
    movingRight: false
  };

  balls = [{
    x: paddle.x + paddle.width / 2,
    y: canvas.height - paddle.height - 20,
    dx: 4 * ballSpeedMultiplier,
    dy: -4 * ballSpeedMultiplier,
    radius: 10,
    active: true,
    stuck: true
  }];

  const layout = levels[levelName];
  bricks = [];
  for (let c = 0; c < brickConfig.colCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickConfig.rowCount; r++) {
      let idx = r * brickConfig.colCount + c;
      bricks[c][r] = {
        x: 0,
        y: 0,
        status: layout[idx],
        hp: 1
      };
    }
  }
  showCountdown(() => {
  balls.forEach(b => b.stuck = false);
  requestAnimationFrame(draw);  // ← MAKE SURE THIS IS HERE
});
}
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("lives").textContent = lives;
  document.getElementById("highscore").textContent = highScore;
}

// === Countdown Before Launch ===
function showCountdown(callback) {
  const countdownEl = document.getElementById("countdownOverlay");
  let count = 3;

  countdownEl.classList.remove("hidden");
  countdownEl.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownEl.textContent = count;
    } else if (count === 0) {
      countdownEl.textContent = "GO!";
    } else {
      clearInterval(interval);
      countdownEl.classList.add("hidden");
      if (callback) callback();
    }
  }, 700);
}
// === Game Loop ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw Paddle
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--paddle-color');
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.closePath();

  // Draw Bricks
  for (let c = 0; c < brickConfig.colCount; c++) {
    for (let r = 0; r < brickConfig.rowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const x = c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
        const y = r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
        b.x = x; b.y = y;

        ctx.beginPath();
        ctx.rect(x, y, brickConfig.width, brickConfig.height);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--brick-color');
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
      }
    }
  }

  // Draw Boosters
  powerUps.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = p.color || "white";
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fill();

    // Draw icon inside the power-up
    ctx.fillStyle = "#000";
    ctx.font = "10px 'Press Start 2P'";
    ctx.textAlign = "center";
    ctx.fillText(p.icon, p.x, p.y + 3);
    ctx.closePath();

    p.y += 3;

    if (
      p.y > canvas.height - paddle.height - 10 &&
      p.x > paddle.x && p.x < paddle.x + paddle.width
    ) {
      activatePowerUp(p.type);
      powerUps.splice(i, 1);
    } else if (p.y > canvas.height) {
      powerUps.splice(i, 1);
    }
  });

  // Ball Logic
  balls.forEach(ball => {
    if (ball.stuck) {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = canvas.height - paddle.height - 20;
    } else {
      ball.x += ball.dx;
      ball.y += ball.dy;
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ball-color');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();

    // Wall collision
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx *= -1;
    if (ball.y < ball.radius) ball.dy *= -1;

    // Paddle collision
    if (
      ball.y + ball.radius >= canvas.height - paddle.height - 10 &&
      ball.x > paddle.x && ball.x < paddle.x + paddle.width
    ) {
      const collide = ball.x - (paddle.x + paddle.width / 2);
      const angle = (collide / (paddle.width / 2)) * (Math.PI / 3);
      const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
    }

    // Brick collision
    for (let c = 0; c < brickConfig.colCount; c++) {
      for (let r = 0; r < brickConfig.rowCount; r++) {
        const b = bricks[c][r];
        if (
          b.status === 1 &&
          ball.x > b.x && ball.x < b.x + brickConfig.width &&
          ball.y > b.y && ball.y < b.y + brickConfig.height
        ) {
          b.status = 0;
          score++;
          updateUI();

          if (Math.random() < 0.35) {
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const icons = {
              wide: "⇔",
              life: "+",
              slow: "∞",
              multi: "⧉",
              fireball: "🔥"
            };
            const colorMap = {
              wide: "gold",
              life: "lime",
              slow: "cyan",
              multi: "magenta",
              fireball: "red"
            };
            powerUps.push({ x: b.x + 30, y: b.y, type, icon: icons[type], color: colorMap[type] });
          }

          ball.dy *= -1;
        }
      }
    }

    // Ball lost
    if (ball.y > canvas.height) ball.active = false;
  });

  balls = balls.filter(b => b.active);
  if (balls.length === 0) {
    lives--;
    updateUI();
    if (lives <= 0) {
      endGame();
    } else {
      balls.push({
        x: paddle.x + paddle.width / 2,
        y: canvas.height - paddle.height - 20,
        dx: 4 * ballSpeedMultiplier,
        dy: -4 * ballSpeedMultiplier,
        radius: 10,
        active: true,
        stuck: true
      });
      showCountdown(() => {
        balls.forEach(b => b.stuck = false);
        draw();
      });
      return;
    }
  }

  // Paddle Movement
  if (paddle.movingRight && paddle.x < canvas.width - paddle.width) paddle.x += paddle.dx;
  if (paddle.movingLeft && paddle.x > 0) paddle.x -= paddle.dx;

  // Check level complete
  const allBricksBroken = bricks.flat().every(b => b.status === 0);
  if (allBricksBroken) {
    levelIndex = (levelIndex + 1) % Object.keys(levels).length;
    currentLevel = Object.keys(levels)[levelIndex];
    initGame(currentLevel);
    return;
  }

  requestAnimationFrame(draw);
}
// === Booster Effects ===
function activatePowerUp(type) {
  if (type === "wide") {
    paddle.width = 150;
    setTimeout(() => paddle.width = 100, 10000);
  }
  if (type === "life") {
    lives++;
    updateUI();
  }
  if (type === "slow") {
    balls.forEach(b => { b.dx *= 0.5; b.dy *= 0.5; });
    setTimeout(() => balls.forEach(b => { b.dx *= 2; b.dy *= 2; }), 10000);
  }
  if (type === "multi") {
    if (balls.length < 3) {
      const base = balls[0];
      balls.push({
        x: base.x,
        y: base.y,
        dx: -base.dx,
        dy: -base.dy,
        radius: 10,
        active: true
      });
    }
  }
  if (type === "fireball") {
    balls.forEach(b => b.fire = true);
    setTimeout(() => balls.forEach(b => delete b.fire), 5000);
  }
}

// === End Game and Restart ===
function endGame() {
  document.getElementById("finalScore").textContent = `Your score: ${score}`;
  document.getElementById("gameOverModal").classList.remove("hidden");

  if (score > highScore) localStorage.setItem('dxball_highscore', score);

  leaderboard.push({
    name: playerName,
    score,
    theme: currentTheme,
    date: new Date().toLocaleDateString()
  });

  leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  saveLeaderboard();
}

restartBtn.addEventListener("click", () => {
  document.getElementById("gameOverModal").classList.add("hidden");
  location.reload();
});

// === Controls (Keyboard, Touch, Tilt) ===
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight" || e.key === "d") paddle.movingRight = true;
  if (e.key === "ArrowLeft" || e.key === "a") paddle.movingLeft = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight" || e.key === "d") paddle.movingRight = false;
  if (e.key === "ArrowLeft" || e.key === "a") paddle.movingLeft = false;
});

document.getElementById("leftBtn").addEventListener("touchstart", e => {
  e.preventDefault();
  paddle.movingLeft = true;
});
document.getElementById("leftBtn").addEventListener("touchend", () => paddle.movingLeft = false);

document.getElementById("rightBtn").addEventListener("touchstart", e => {
  e.preventDefault();
  paddle.movingRight = true;
});
document.getElementById("rightBtn").addEventListener("touchend", () => paddle.movingRight = false);

// === Tilt Controls (Always On) ===
window.addEventListener("deviceorientation", (e) => {
  const tilt = e.gamma;
  if (tilt > 10) {
    paddle.movingRight = true;
    paddle.movingLeft = false;
  } else if (tilt < -10) {
    paddle.movingLeft = true;
    paddle.movingRight = false;
  } else {
    paddle.movingLeft = false;
    paddle.movingRight = false;
  }
});
