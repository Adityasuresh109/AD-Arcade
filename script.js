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

// === Global Game State ===
let playerName = '';
let currentTheme = 'galaxy';
let currentLevel = 'easy';
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('dxball_highscore') || 0;
let leaderboard = JSON.parse(localStorage.getItem('adArcadeLeaderboard')) || [];

function saveLeaderboard() {
  localStorage.setItem('adArcadeLeaderboard', JSON.stringify(leaderboard));
}

// === DOM Elements ===
const loginScreen = document.getElementById('loginScreen');
const startGameBtn = document.getElementById('startGameBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const leaderboardPanel = document.getElementById('leaderboardPanel');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const leaderboardList = document.getElementById('leaderboardList');

// === Start Game ===
startGameBtn.addEventListener('click', () => {
  const nameInput = document.getElementById('playerName').value.trim();
  if (!nameInput) {
    alert("Please enter your name.");
    return;
  }
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
  draw(); // Starts the main game loop (in Part 2)
});

// === View Leaderboard ===
viewLeaderboardBtn.addEventListener('click', () => {
  leaderboardPanel.classList.remove('hidden');
  renderLeaderboard();
});

closeLeaderboardBtn.addEventListener('click', () => {
  leaderboardPanel.classList.add('hidden');
});

function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  sorted.forEach((entry, i) => {
    const li = document.createElement('li');
    li.innerHTML = `#${i + 1} <strong>${entry.name}</strong> — ${entry.score} pts [${entry.theme}]`;
    leaderboardList.appendChild(li);
  });
}
// === Game Objects ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let paddle, balls, bricks, powerUps, levelIndex = 0;
const levelNames = ['easy', 'medium', 'hard']; // Cycle through levels

const brickConfig = {
  colCount: 8,
  rowCount: 5,
  width: 75,
  height: 20,
  padding: 10,
  offsetTop: 40,
  offsetLeft: 35
};

const levels = {
  easy:   [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
  medium: [1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0],
  hard:   [1,1,1,1,1,1,1,1, 1,0,1,0,1,0,1,1, 1,1,0,1,0,1,1,1, 1,1,1,0,1,1,1,1, 1,1,1,1,1,1,1,1]
};

const powerUpTypes = ["wide", "life", "slow", "multi", "fireball"];

function initGame(levelName) {
  score = 0;
  lives = 3;
  powerUps = [];

  // Paddle
  paddle = {
    height: 15,
    width: 100,
    x: (canvas.width - 100) / 2,
    dx: 7,
    movingLeft: false,
    movingRight: false
  };

  // Ball
  balls = [{
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4,
    radius: 10,
    active: true
  }];

  // Bricks
  const layout = levels[levelName];
  bricks = [];
  for (let c = 0; c < brickConfig.colCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickConfig.rowCount; r++) {
      let idx = r * brickConfig.colCount + c;
      bricks[c][r] = {
        x: 0, y: 0,
        status: layout[idx],
        hp: 1 // For multi-hit logic later
      };
    }
  }

  document.getElementById("introText").style.display = "block";
  setTimeout(() => {
    document.getElementById("introText").style.display = "none";
  }, 2500);
}
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("lives").textContent = lives;
  document.getElementById("highscore").textContent = highScore;
}

// === Game Loop ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Paddle
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--paddle-color');
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.closePath();

  // Bricks
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

  // Power-ups
  powerUps.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = p.color || "white";
    ctx.shadowColor = p.color || "white";
    ctx.shadowBlur = 10;
    ctx.fill();
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

  // Balls
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ball-color');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx *= -1;
    if (ball.y < ball.radius) ball.dy *= -1;

    // Paddle bounce
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

          // Booster drop chance
          if (Math.random() < 0.1) {
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const colorMap = {
              wide: "gold", life: "lime", slow: "cyan", multi: "magenta", fireball: "red"
            };
            powerUps.push({ x: b.x + 30, y: b.y, type, color: colorMap[type] });
          }

          ball.dy *= -1;
        }
      }
    }

    if (ball.y > canvas.height) ball.active = false;
  });

  balls = balls.filter(b => b.active);
  if (balls.length === 0) {
    lives--;
    updateUI();
    if (lives <= 0) {
      endGame();
    } else {
      balls.push({ x: canvas.width / 2, y: canvas.height - 30, dx: 4, dy: -4, radius: 10, active: true });
    }
  }

  // Paddle movement
  if (paddle.movingRight && paddle.x < canvas.width - paddle.width) paddle.x += paddle.dx;
  if (paddle.movingLeft && paddle.x > 0) paddle.x -= paddle.dx;

  // Check level complete
  const allBricksBroken = bricks.flat().every(b => b.status === 0);
  if (allBricksBroken) {
    levelIndex = (levelIndex + 1) % levelNames.length;
    currentLevel = levelNames[levelIndex];
    initGame(currentLevel);
  }

  requestAnimationFrame(draw);
}

// === Power-Up Effects ===
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
        x: base.x, y: base.y,
        dx: -base.dx, dy: -base.dy,
        radius: 10, active: true
      });
    }
  }
  if (type === "fireball") {
    balls.forEach(b => b.fire = true);
    setTimeout(() => balls.forEach(b => delete b.fire), 5000);
  }
}

// === End Game ===
function endGame() {
  alert("😢 Game Over");
  if (score > highScore) {
    localStorage.setItem('dxball_highscore', score);
  }

  leaderboard.push({
    name: playerName,
    score,
    theme: currentTheme,
    date: new Date().toLocaleDateString()
  });

  leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  saveLeaderboard();
  location.reload();
}
