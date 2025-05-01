// === Starfield Background ===
const starCanvas = document.getElementById("stars");
const starCtx    = starCanvas.getContext("2d");
starCanvas.width  = window.innerWidth;
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
let playerName          = '',
    currentTheme        = 'galaxy',
    currentLevel        = 'easy',
    score               = 0,
    lives               = 3,
    highScore           = localStorage.getItem('dxball_highscore') || 0,
    leaderboard         = JSON.parse(localStorage.getItem('adArcadeLeaderboard')) || [],
    levelIndex          = 0,
    paddle, balls, bricks, powerUps,
    ballSpeedMultiplier = 1.0,
    gameOver            = false;

const canvas       = document.getElementById("gameCanvas"),
      ctx          = canvas.getContext("2d"),
      musicElement = document.getElementById("bgMusic");

// === DOM Elements ===
const loginScreen         = document.getElementById('loginScreen'),
      startGameBtn        = document.getElementById('startGameBtn'),
      viewLeaderboardBtn  = document.getElementById('viewLeaderboardBtn'),
      leaderboardPanel    = document.getElementById('leaderboardPanel'),
      closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn'),
      leaderboardList     = document.getElementById('leaderboardList');
// === Instructions Panel Listeners ===
const viewInstructionsBtn  = document.getElementById('viewInstructionsBtn');
const closeInstructionsBtn = document.getElementById('closeInstructionsBtn');

viewInstructionsBtn.addEventListener('click', () => {
  document.getElementById('instructionsPanel').classList.remove('hidden');
});
closeInstructionsBtn.addEventListener('click', () => {
  document.getElementById('instructionsPanel').classList.add('hidden');
});

// === Leaderboard Helpers ===
function saveLeaderboard() {
  localStorage.setItem('adArcadeLeaderboard', JSON.stringify(leaderboard));
}
function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  leaderboard
    .sort((a,b)=>b.score-a.score)
    .slice(0,10)
    .forEach((e,i)=>{
      const li = document.createElement('li');
      li.innerHTML = `#${i+1} <strong>${e.name}</strong> — ${e.score} pts [${e.theme}]`;
      leaderboardList.appendChild(li);
    });
}

// === Custom Game Over (no more alert) ===
function endGame() {
  gameOver = true;
  musicElement.pause();
  document.getElementById('gameOverModal').classList.add('visible');
}

// === UI Events ===
startGameBtn.addEventListener('click', () => {
  const nameVal = document.getElementById('playerName').value.trim();
  if (!nameVal) return alert("Please enter your name.");
  playerName   = nameVal;
  currentTheme = document.getElementById('themeSelect').value;
  currentLevel = document.getElementById('levelSelect').value;
  document.body.className = currentTheme;

  if (document.getElementById('musicToggle').checked) {
    musicElement.volume = 0.3;
    musicElement.play().catch(e=>console.warn("Music blocked",e));
  } else {
    musicElement.pause();
  }

  loginScreen.classList.add('hidden');
  document.getElementById('gameTitle').classList.remove('hidden');
  document.getElementById('scoreboard').classList.remove('hidden');
  canvas.classList.remove('hidden');
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
// === Level Layouts & Config ===
const levels = {
  easy:   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
           0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
           0,0,0,0,0,0,0,0],
  medium: [1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,
           1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1,
           1,0,1,0,1,0,1,0],
  hard:   [1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,
           1,1,0,1,0,1,1,1,1,1,1,0,1,1,1,1,
           1,1,1,1,1,1,1,1]
};
const brickConfig = {
  colCount:   8,
  rowCount:   5,
  width:      75,
  height:     20,
  padding:    10,
  offsetTop:  40,
  offsetLeft: 35
};
const powerUpTypes = ["wide","life","slow","multi","fireball"];

// === Game Initialization ===
function initGame(levelName) {
  score   = 0;
  lives   = 3;
  powerUps = [];
  gameOver = false;
  ballSpeedMultiplier = {easy:1.0,medium:1.3,hard:1.6}[levelName];

  // Paddle
  paddle = {
    height:       15,
    width:        100,
    x:            (canvas.width-100)/2,
    dx:           7,
    movingLeft:   false,
    movingRight:  false
  };

  // Ball starts stuck to paddle
  balls = [{
    x:      paddle.x + paddle.width/2,
    y:      canvas.height - paddle.height - 20,
    dx:     4 * ballSpeedMultiplier,
    dy:    -4 * ballSpeedMultiplier,
    radius: 10,
    active: true,
    stuck:  true
  }];

  // Bricks
  bricks = [];
  levels[levelName].forEach((status, idx) => {
    const c = idx % brickConfig.colCount,
          r = Math.floor(idx / brickConfig.colCount);
    if (!bricks[c]) bricks[c] = [];
    bricks[c][r] = { x:0, y:0, status, hp:1 };
  });

  // Countdown then start loop
  showCountdown(() => {
    balls.forEach(b => b.stuck = false);
    draw();
  });
}

// === UI Update ===
function updateUI() {
  document.getElementById('score').textContent     = score;
  document.getElementById('lives').textContent     = lives;
  document.getElementById('highscore').textContent = highScore;
}

// === Cinematic Countdown ===
function showCountdown(cb) {
  const el = document.getElementById('countdownOverlay');
  let count = 3;
  el.textContent = count;
  el.classList.remove('hidden');
  const iv = setInterval(() => {
    count--;
    if (count > 0)       el.textContent = count;
    else if (count === 0) el.textContent = 'GO!';
    else {
      clearInterval(iv);
      el.classList.add('hidden');
      cb();
    }
  }, 700);
}
// === Draw a themed booster icon ===
function drawPowerUpIcon(p) {
  const { x, y, type } = p;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = p.color;
  ctx.shadowBlur  = 10;
  switch (type) {
    case 'wide':
      ctx.fillStyle = p.color;
      ctx.fillRect(-20, -5, 40, 10);
      ctx.fillStyle = 'white';
      ctx.font       = '12px Press Start 2P';
      ctx.textAlign  = 'center';
      ctx.fillText('⇔', 0, 4);
      break;
    case 'life':
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(6, -12, 12, -4, 0, 8);
      ctx.bezierCurveTo(-12, -4, -6, -12, 0, -6);
      ctx.fill();
      break;
    case 'slow':
      ctx.strokeStyle = p.color;
      ctx.lineWidth   = 2;
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, 8);
        ctx.stroke();
      }
      break;
    case 'multi':
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(-6, 0, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.arc( 6, 0, 5, 0, 2 * Math.PI); ctx.fill();
      break;
    case 'fireball':
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-3, 5);
      ctx.lineTo(0, 10);
      ctx.lineTo(3, 5);
      ctx.fill();
      break;
  }
  ctx.restore();
}

function draw() {
  if (gameOver) return;  // stop on game over

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Paddle
  ctx.fillStyle   = getComputedStyle(document.body).getPropertyValue('--paddle-color');
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur  = 15;
  ctx.fillRect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);

  // Bricks
  bricks.forEach((col, c) =>
    col.forEach((b, r) => {
      if (b.status) {
        const x = c * (brickConfig.width + brickConfig.padding) + brickConfig.offsetLeft;
        const y = r * (brickConfig.height + brickConfig.padding) + brickConfig.offsetTop;
        b.x = x; b.y = y;
        ctx.fillStyle   = getComputedStyle(document.body).getPropertyValue('--brick-color');
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur  = 10;
        ctx.fillRect(x, y, brickConfig.width, brickConfig.height);
      }
    })
  );

  // Boosters
  powerUps.forEach((p, i) => {
    drawPowerUpIcon(p);
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
    if (ball.stuck) {
      ball.x = paddle.x + paddle.width / 2;
      ball.y = canvas.height - paddle.height - 20;
    } else {
      ball.x += ball.dx;
      ball.y += ball.dy;
    }

    ctx.fillStyle   = getComputedStyle(document.body).getPropertyValue('--ball-color');
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur  = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fill();

    // Wall collisions
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx *= -1;
    if (ball.y < ball.radius) ball.dy *= -1;

    // Paddle collision
    if (
      !ball.stuck &&
      ball.y + ball.radius >= canvas.height - paddle.height - 10 &&
      ball.x > paddle.x && ball.x < paddle.x + paddle.width
    ) {
      const collide = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle   = collide * Math.PI / 3;
      const speed   = Math.hypot(ball.dx, ball.dy);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
    }

    // Brick collisions
    bricks.forEach((col, c) =>
      col.forEach((b, r) => {
        if (
          b.status &&
          ball.x > b.x && ball.x < b.x + brickConfig.width &&
          ball.y > b.y && ball.y < b.y + brickConfig.height
        ) {
          b.status = 0;
          score++;
          updateUI();

          // 35% booster drop
          if (Math.random() < 0.35) {
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const colorMap = {
              wide: 'gold', life: 'lime', slow: 'cyan', multi: 'magenta', fireball: 'red'
            };
            powerUps.push({
              x: b.x + brickConfig.width / 2,
              y: b.y,
              type,
              color: colorMap[type]
            });
          }
          ball.dy *= -1;
        }
      })
    );

    if (ball.y > canvas.height) ball.active = false;
  });

  // Clean up inactive balls
  balls = balls.filter(b => b.active);
  if (!balls.length) {
    lives--;
    updateUI();
    if (lives < 1) return endGame();
    balls = [{
      x: paddle.x + paddle.width / 2,
      y: canvas.height - paddle.height - 20,
      dx: 4 * ballSpeedMultiplier,
      dy: -4 * ballSpeedMultiplier,
      radius: 10,
      active: true,
      stuck: true
    }];
    return showCountdown(() => {
      balls.forEach(b => b.stuck = false);
      draw();
    });
  }

  // Paddle movement
  if (paddle.movingRight && paddle.x < canvas.width - paddle.width) paddle.x += paddle.dx;
  if (paddle.movingLeft && paddle.x > 0) paddle.x -= paddle.dx;

  // Level completion
  if (bricks.flat().every(b => b.status === 0)) {
    levelIndex = (levelIndex + 1) % Object.keys(levels).length;
    currentLevel = Object.keys(levels)[levelIndex];
    return initGame(currentLevel);
  }

  requestAnimationFrame(draw);
}

// === Power-Up Effects ===
function activatePowerUp(type) {
  if (type === 'wide') {
    paddle.width = 150;
    setTimeout(() => paddle.width = 100, 10000);
  }
  if (type === 'life') {
    lives++;
    updateUI();
  }
  if (type === 'slow') {
    balls.forEach(b => { b.dx *= 0.5; b.dy *= 0.5; });
    setTimeout(() => balls.forEach(b => { b.dx *= 2; b.dy *= 2; }), 10000);
  }
  if (type === 'multi' && balls.length < 3) {
    const base = balls[0];
    balls.push({
      x: base.x, y: base.y,
      dx: -base.dx, dy: -base.dy,
      radius: 10, active: true
    });
  }
  if (type === 'fireball') {
    balls.forEach(b => b.fire = true);
    setTimeout(() => balls.forEach(b => delete b.fire), 5000);
  }
}

// === Controls ===
document.addEventListener("keydown", e => {
  if (e.key === 'ArrowRight' || e.key === 'd') paddle.movingRight = true;
  if (e.key === 'ArrowLeft'  || e.key === 'a') paddle.movingLeft  = true;
});
document.addEventListener("keyup", e => {
  if (e.key === 'ArrowRight' || e.key === 'd') paddle.movingRight = false;
  if (e.key === 'ArrowLeft'  || e.key === 'a') paddle.movingLeft  = false;
});
document.getElementById("leftBtn").addEventListener("touchstart", ()=> paddle.movingLeft  = true);
document.getElementById("leftBtn").addEventListener("touchend",   ()=> paddle.movingLeft  = false);
document.getElementById("rightBtn").addEventListener("touchstart", ()=> paddle.movingRight = true);
document.getElementById("rightBtn").addEventListener("touchend",   ()=> paddle.movingRight = false);

document.getElementById("enableTilt").addEventListener("click", ()=>{
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(state=>{
      if (state==='granted') window.addEventListener("deviceorientation", handleTilt);
    }).catch(console.error);
  } else {
    window.addEventListener("deviceorientation", handleTilt);
  }
});
function handleTilt(e) {
  const tilt = e.gamma;
  if (tilt > 10)      { paddle.movingRight = true; paddle.movingLeft  = false; }
  else if (tilt < -10){ paddle.movingLeft  = true; paddle.movingRight = false; }
  else                { paddle.movingLeft  = false; paddle.movingRight = false; }
}
