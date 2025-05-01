// === Starfield background animation ===
const starCanvas = document.getElementById("stars");
const starCtx = starCanvas.getContext("2d");
starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;

let stars = Array(200).fill().map(() => ({
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

// === Game variables ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let paddle, balls, bricks, score = 0, lives = 3;
let gameStarted = false;
let highScore = localStorage.getItem("dxball_highscore") || 0;

// === Level layouts ===
const levels = {
  easy:   [1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0],
  medium: [1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0, 0,1,0,1,0,1,0,1, 1,0,1,0,1,0,1,0],
  hard:   [1,1,1,1,1,1,1,1, 1,0,1,0,1,0,1,1, 1,1,0,1,0,1,1,1, 1,1,1,0,1,1,1,1, 1,1,1,1,1,1,1,1]
};

function loadLevel(levelName) {
  const layout = levels[levelName];
  bricks = [];
  for (let c = 0; c < 8; c++) {
    bricks[c] = [];
    for (let r = 0; r < 5; r++) {
      let idx = r * 8 + c;
      bricks[c][r] = { x: 0, y: 0, status: layout[idx] };
    }
  }
}

// === Start game with selected settings ===
document.getElementById("startGameBtn").addEventListener("click", () => {
  const theme = document.getElementById("themeSelect").value;
  const level = document.getElementById("levelSelect").value;
  document.body.className = theme;

  document.getElementById("startScreen").style.display = "none";
  document.getElementById("scoreboard").style.display = "block";
  document.getElementById("gameTitle").style.display = "block";
  document.getElementById("gameCanvas").style.display = "block";
  document.querySelector(".mobile-controls").style.display = "block";

  initGame(level);
  gameStarted = true;
  updateUI();
  draw();
});

// === Initialize the game ===
function initGame(level) {
  paddle = {
    height: 15,
    width: 100,
    x: (canvas.width - 100) / 2,
    dx: 7,
    movingLeft: false,
    movingRight: false
  };
  balls = [{
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4,
    radius: 10,
    active: true
  }];
  score = 0;
  lives = 3;
  loadLevel(level);
}

// === UI Update ===
function updateUI() {
  document.getElementById("score").textContent = score;
  document.getElementById("lives").textContent = lives;
  document.getElementById("highscore").textContent = highScore;
}

// === Controls ===
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") paddle.movingRight = true;
  if (e.key === "ArrowLeft") paddle.movingLeft = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") paddle.movingRight = false;
  if (e.key === "ArrowLeft") paddle.movingLeft = false;
});

document.getElementById("leftBtn").addEventListener("touchstart", () => paddle.movingLeft = true);
document.getElementById("leftBtn").addEventListener("touchend", () => paddle.movingLeft = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => paddle.movingRight = true);
document.getElementById("rightBtn").addEventListener("touchend", () => paddle.movingRight = false);

// === Tilt support ===
document.getElementById("enableTilt").addEventListener("click", () => {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then(state => {
      if (state === 'granted') {
        window.addEventListener("deviceorientation", handleTilt);
      }
    });
  } else {
    window.addEventListener("deviceorientation", handleTilt);
  }
});

function handleTilt(e) {
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
}
// === Game loop ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw paddle
  ctx.beginPath();
  ctx.rect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--paddle-color') || '#fff';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.closePath();

  // Draw bricks
  for (let c = 0; c < 8; c++) {
    for (let r = 0; r < 5; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const x = c * (75 + 10) + 35;
        const y = r * (20 + 10) + 40;
        b.x = x;
        b.y = y;

        ctx.beginPath();
        ctx.rect(x, y, 75, 20);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--brick-color') || '#0ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.closePath();
      }
    }
  }

  // Draw and update each ball
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ball-color') || '#0ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.dx *= -1;
    if (ball.y < ball.radius) ball.dy *= -1;

    // Paddle bounce
    if (
      ball.y + ball.radius >= canvas.height - paddle.height - 10 &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      const collide = ball.x - (paddle.x + paddle.width / 2);
      const normalize = collide / (paddle.width / 2);
      const angle = normalize * Math.PI / 3;
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
    }

    // Brick collision
    for (let c = 0; c < 8; c++) {
      for (let r = 0; r < 5; r++) {
        let b = bricks[c][r];
        if (
          b.status === 1 &&
          ball.x > b.x &&
          ball.x < b.x + 75 &&
          ball.y > b.y &&
          ball.y < b.y + 20
        ) {
          b.status = 0;
          ball.dy *= -1;
          score++;
          updateUI();

          if (score === 40) {
            alert("🎉 YOU WIN!");
            if (score > highScore) localStorage.setItem("dxball_highscore", score);
            location.reload();
          }
        }
      }
    }

    // Missed the paddle
    if (ball.y + ball.radius > canvas.height) ball.active = false;
  });

  // Remove inactive balls
  balls = balls.filter(b => b.active);
  if (balls.length === 0) {
    lives--;
    updateUI();
    if (lives <= 0) {
      alert("😢 GAME OVER");
      if (score > highScore) localStorage.setItem("dxball_highscore", score);
      location.reload();
    } else {
      balls.push({
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: 4,
        dy: -4,
        radius: 10,
        active: true
      });
      paddle.x = (canvas.width - paddle.width) / 2;
    }
  }

  // Paddle movement
  if (paddle.movingRight && paddle.x < canvas.width - paddle.width) paddle.x += paddle.dx;
  if (paddle.movingLeft && paddle.x > 0) paddle.x -= paddle.dx;

  requestAnimationFrame(draw);
}

