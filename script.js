// ==== CONFIG ====
const THEMES = {
  galaxy: {
    bgFX: 'stars',
    paddle: '#0ff',
    paddleGlow: '#0ff',
    brick: ['#00f', '#0ff', '#90f'],
    ball: '#fff',
    ballTrail: '#0ff',
    booster: '#0ff',
    boosterFX: 'electric',
    particle: '#0ff',
  },
  neon: {
    bgFX: 'grid',
    paddle: '#f0f',
    paddleGlow: '#f0f',
    brick: ['#0ff', '#f0f', '#fff'],
    ball: '#fff',
    ballTrail: '#f0f',
    booster: '#f0f',
    boosterFX: 'beam',
    particle: '#f0f',
  },
  ice: {
    bgFX: 'frost',
    paddle: '#7af',
    paddleGlow: '#7af',
    brick: ['#bdf', '#eef', '#fff'],
    ball: '#fff',
    ballTrail: '#7af',
    booster: '#7af',
    boosterFX: 'frost',
    particle: '#7af',
  },
  inferno: {
    bgFX: 'embers',
    paddle: '#f90',
    paddleGlow: '#f90',
    brick: ['#f00', '#f90', '#fc0'],
    ball: '#fff',
    ballTrail: '#f90',
    booster: '#f90',
    boosterFX: 'fire',
    particle: '#f90',
  }
};

const BOOSTERS = [
  {type: 'wide', color: '#FFD700', icon: '⇔'},
  {type: 'life', color: '#0f0', icon: '♥'},
  {type: 'slow', color: '#7af', icon: '❄'},
  {type: 'multi', color: '#f0f', icon: '⧉'},
  {type: 'fireball', color: '#f90', icon: '🔥'}
];

// ==== CANVAS SETUP ====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = window.innerWidth, H = window.innerHeight, dpr = window.devicePixelRatio || 1;
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

// ==== GAME STATE ====
let state = 'countdown', theme = 'galaxy', level = 1, score = 0, lives = 3;
let paddle, ball, bricks, boosters, particles, ballTrail, multiBalls = [];
let leftPressed = false, rightPressed = false, tiltDir = 0, countdown = 3, countdownAlpha = 0, countdownTimer = 0;

// ==== OBJECTS ====
function resetPaddle() {
  paddle = {
    x: W/2-60, y: H-48, w: 120, h: 18, vx: 0, speed: 12, color: THEMES[theme].paddle,
    wide: false, wideTimer: 0
  };
}
function resetBall() {
  ball = {
    x: paddle.x + paddle.w/2, y: paddle.y-16, r: 12, speed: 8 + level*1.5,
    dx: (Math.random()<0.5?-1:1) * (Math.random()*0.7+0.7), dy: -1,
    color: THEMES[theme].ball, state: '', stateTimer: 0
  };
  ballTrail = [];
  multiBalls = [];
}
function resetBricks() {
  bricks = [];
  let rows = 5, cols = 8, brickW = Math.min(120, W/cols-12), brickH = 32;
  let colors = THEMES[theme].brick;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    bricks.push({
      x: c*(brickW+12)+Math.max((W-cols*(brickW+12))/2,10),
      y: r*(brickH+10)+90,
      w: brickW, h: brickH, color: colors[(r+c)%colors.length], hp: 1, alive: true
    });
  }
}
function resetBoosters() { boosters = []; }
function resetParticles() { particles = []; }
function startLevel() {
  resetPaddle(); resetBall(); resetBricks(); resetBoosters(); resetParticles();
  state = 'countdown'; countdown = 3; countdownAlpha = 1; countdownTimer = 0;
  updateHUD();
}
function updateHUD() {
  document.getElementById('score').textContent = score.toString().padStart(5,'0');
  document.getElementById('lives').textContent = '♥'.repeat(lives);
  document.getElementById('level').textContent = level;
}

// ==== INPUT ====
window.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft'||e.key==='a') leftPressed=true;
  if(e.key==='ArrowRight'||e.key==='d') rightPressed=true;
});
window.addEventListener('keyup', e=>{
  if(e.key==='ArrowLeft'||e.key==='a') leftPressed=false;
  if(e.key==='ArrowRight'||e.key==='d') rightPressed=false;
});
document.querySelector('.mobile-btn.left').addEventListener('touchstart',e=>{leftPressed=true;});
document.querySelector('.mobile-btn.left').addEventListener('touchend',e=>{leftPressed=false;});
document.querySelector('.mobile-btn.right').addEventListener('touchstart',e=>{rightPressed=true;});
document.querySelector('.mobile-btn.right').addEventListener('touchend',e=>{rightPressed=false;});
window.addEventListener('deviceorientation',e=>{
  if(Math.abs(e.gamma)>10) tiltDir = e.gamma>0?1:-1; else tiltDir = 0;
});

// ==== THEME SWITCHER ====
document.querySelectorAll('#theme-switcher button').forEach(btn=>{
  btn.onclick = ()=>{
    theme = btn.dataset.theme;
    document.body.className = theme;
    startLevel();
  }
});

// ==== COUNTDOWN ====
function showCountdown(n) {
  let el = document.getElementById('countdown');
  el.textContent = n>0 ? n : 'GO!';
  el.style.opacity = 1;
  setTimeout(()=>{el.style.opacity=0;}, 700);
}

// ==== GAME LOOP ====
function loop(ts) {
  ctx.clearRect(0,0,W,H);
  drawBG();
  if(state==='countdown') {
    if(countdownTimer===0) showCountdown(countdown);
    countdownTimer += 1/60;
    if(countdownTimer>1) {
      countdown--; countdownTimer=0;
      if(countdown>0) showCountdown(countdown);
      else { showCountdown('GO!'); state='play'; }
    }
    drawGame();
  }
  else if(state==='play') {
    update();
    drawGame();
  }
  requestAnimationFrame(loop);
}

// ==== BG FX ====
function drawBG() {
  if(THEMES[theme].bgFX==='stars') {
    for(let i=0;i<100;i++) {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc((i*83)%W, (i*97)%H, (i%3)+1, 0, Math.PI*2);
      ctx.fillStyle = i%7===0?'#fff':'#0ff2';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else if(THEMES[theme].bgFX==='grid') {
    ctx.save();
    ctx.strokeStyle = '#0ff2';
    ctx.lineWidth = 2;
    for(let x=0;x<W;x+=60) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
    }
    for(let y=0;y<H;y+=60) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }
    ctx.restore();
  } else if(THEMES[theme].bgFX==='frost') {
    for(let i=0;i<60;i++) {
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.arc((i*131)%W, (i*89)%H, (i%7)+20, 0, Math.PI*2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else if(THEMES[theme].bgFX==='embers') {
    for(let i=0;i<40;i++) {
      ctx.globalAlpha = 0.13;
      ctx.beginPath();
      ctx.arc((i*211)%W, (i*61)%H, (i%5)+8, 0, Math.PI*2);
      ctx.fillStyle = '#f90';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

// ==== GAME DRAW ====
function drawGame() {
  // Paddle
  ctx.save();
  ctx.shadowColor = THEMES[theme].paddleGlow;
  ctx.shadowBlur = 18;
  ctx.fillStyle = paddle.color;
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 10);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Ball trail
  if(ballTrail.length>1) {
    for(let i=0;i<ballTrail.length-1;i++) {
      ctx.beginPath();
      ctx.arc(ballTrail[i].x, ballTrail[i].y, ball.r*(0.7-i/ballTrail.length), 0, Math.PI*2);
      ctx.fillStyle = THEMES[theme].ballTrail + Math.floor(100-(i/ballTrail.length)*80).toString(16);
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Ball
  ctx.save();
  ctx.shadowColor = THEMES[theme].ball;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fillStyle = ball.color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Bricks
  bricks.forEach(brick=>{
    if(!brick.alive) return;
    ctx.save();
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.shadowBlur = 0;
    ctx.restore();
  });

  // Boosters
  boosters.forEach(b=>{
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 21, 0, Math.PI*2);
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.font = "bold 1.4rem 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(b.icon, b.x, b.y+2);
    ctx.restore();
  });

  // Particles
  particles.forEach(p=>{
    ctx.save();
    ctx.globalAlpha = p.a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = p.c;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}

// ==== UPDATE ====
function update() {
  // Paddle move
  let move = 0;
  if(leftPressed||tiltDir==-1) move = -1;
  if(rightPressed||tiltDir==1) move = 1;
  paddle.x += move * paddle.speed;
  paddle.x = Math.max(0, Math.min(W-paddle.w, paddle.x));

  // Ball move
  ball.x += ball.dx * ball.speed;
  ball.y += ball.dy * ball.speed;

  // Ball trail
  ballTrail.unshift({x:ball.x, y:ball.y});
  if(ballTrail.length>12) ballTrail.pop();

  // Wall bounce
  if(ball.x-ball.r<0) { ball.x=ball.r; ball.dx*=-1; }
  if(ball.x+ball.r>W) { ball.x=W-ball.r; ball.dx*=-1; }
  if(ball.y-ball.r<0) { ball.y=ball.r; ball.dy*=-1; }

  // Paddle bounce
  if(ball.y+ball.r>paddle.y && ball.x>paddle.x && ball.x<paddle.x+paddle.w && ball.y< paddle.y+paddle.h+ball.r) {
    let angle = ((ball.x-(paddle.x+paddle.w/2))/(paddle.w/2))*Math.PI/3;
    let speed = ball.speed;
    ball.dx = Math.sin(angle);
    ball.dy = -Math.abs(Math.cos(angle));
    ball.speed = speed + 0.1;
    ball.y = paddle.y-ball.r-1;
    particles.push({x:ball.x,y:ball.y,r:8,c:THEMES[theme].paddleGlow,a:0.7,vx:0,vy:-1,life:12});
  }

  // Missed ball
  if(ball.y-ball.r>H) {
    lives--;
    updateHUD();
    if(lives<=0) {
      state='countdown'; level=1; score=0; lives=3; startLevel();
      return;
    }
    resetBall();
    state='countdown'; countdown=3; countdownTimer=0;
    return;
  }

  // Brick collision
  bricks.forEach(brick=>{
    if(!brick.alive) return;
    if(ball.x>brick.x && ball.x<brick.x+brick.w && ball.y>brick.y && ball.y<brick.y+brick.h) {
      brick.alive = false;
      ball.dy*=-1;
      score+=50;
      updateHUD();
      // Booster drop
      if(Math.random()<0.25) {
        let b = BOOSTERS[Math.floor(Math.random()*BOOSTERS.length)];
        boosters.push({x:brick.x+brick.w/2,y:brick.y+brick.h/2,vy:3,type:b.type,color:b.color,icon:b.icon});
      }
      // Particles
      for(let i=0;i<16;i++) {
        particles.push({
          x:ball.x,y:ball.y,r:Math.random()*7+2,
          c:brick.color,a:0.8,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6,life:18
        });
      }
    }
  });

  // Booster fall & collect
  boosters.forEach((b,idx)=>{
    b.y += b.vy;
    if(b.y>paddle.y && b.x>paddle.x && b.x<paddle.x+paddle.w && b.y<paddle.y+paddle.h+22) {
      collectBooster(b.type);
      boosters.splice(idx,1);
      for(let i=0;i<12;i++) {
        particles.push({
          x:b.x,y:b.y,r:Math.random()*8+2,
          c:b.color,a:0.8,vx:(Math.random()-0.5)*7,vy:(Math.random()-0.5)*7,life:12
        });
      }
    }
    if(b.y>H+40) boosters.splice(idx,1);
  });

  // Particles update
  for(let i=particles.length-1;i>=0;i--) {
    let p = particles[i];
    p.x += p.vx; p.y += p.vy; p.a -= 0.04; p.life--;
    if(p.life<=0||p.a<=0) particles.splice(i,1);
  }

  // Next level
  if(bricks.every(b=>!b.alive)) {
    level++; state='countdown'; countdown=3; countdownTimer=0;
    startLevel();
  }
}

// ==== BOOSTER EFFECTS ====
function collectBooster(type) {
  if(type==='wide') {
    paddle.w = Math.min(W-40, paddle.w*1.5);
    paddle.wide = true; paddle.wideTimer = 600;
  }
  if(type==='life') {
    lives++; updateHUD();
  }
  if(type==='slow') {
    ball.speed = Math.max(4, ball.speed*0.6);
  }
  if(type==='multi') {
    // For demo: just give score
    score+=200; updateHUD();
  }
  if(type==='fireball') {
    ball.color = '#f90'; ball.state='fire'; ball.stateTimer=300;
  }
}

// ==== INIT ====
function main() {
  startLevel();
  loop();
}
main();
