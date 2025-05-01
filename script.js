// script.js
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.paddle = {
            x: this.canvas.width/2 - 50,
            y: this.canvas.height - 20,
            width: 100,
            height: 10,
            speed: 10
        };
        this.ball = {
            x: this.canvas.width/2,
            y: this.canvas.height - 30,
            dx: 4,
            dy: -4,
            radius: 8
        };
        this.bricks = [];
        this.initBricks();
        this.gameLoop();
        this.setupControls();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initBricks() {
        const rows = 5, cols = 8;
        const brickWidth = this.canvas.width/cols - 10;
        
        for(let i = 0; i < rows; i++) {
            for(let j = 0; j < cols; j++) {
                this.bricks.push({
                    x: j * (brickWidth + 10) + 5,
                    y: i * 30 + 50,
                    width: brickWidth,
                    height: 20,
                    active: true
                });
            }
        }
    }

    drawPaddle() {
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 5);
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
        this.ctx.fill();
    }

    drawBall() {
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI*2);
        this.ctx.fillStyle = 'white';
        this.ctx.shadowColor = 'white';
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
    }

    drawBricks() {
        this.bricks.forEach(brick => {
            if(!brick.active) return;
            this.ctx.fillStyle = '#0066ff';
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        });
    }

    movePaddle(direction) {
        if(direction === 'left' && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
        if(direction === 'right' && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        }
    }

    updateBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Wall collisions
        if(this.ball.x < 0 || this.ball.x > this.canvas.width) this.ball.dx *= -1;
        if(this.ball.y < 0) this.ball.dy *= -1;

        // Paddle collision
        if(this.ball.y + this.ball.radius > this.paddle.y && 
           this.ball.x > this.paddle.x && 
           this.ball.x < this.paddle.x + this.paddle.width) {
            this.ball.dy *= -1;
        }

        // Brick collisions
        this.bricks.forEach(brick => {
            if(brick.active && this.ball.x > brick.x && 
               this.ball.x < brick.x + brick.width &&
               this.ball.y > brick.y && 
               this.ball.y < brick.y + brick.height) {
                brick.active = false;
                this.ball.dy *= -1;
            }
        });
    }

    setupControls() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowLeft') this.movePaddle('left');
            if(e.key === 'ArrowRight') this.movePaddle('right');
        });

        // Mobile buttons
        document.querySelectorAll('.mobile-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.movePaddle(btn.classList.contains('left') ? 'left' : 'right');
            });
        });

        // Tilt controls
        window.addEventListener('deviceorientation', (e) => {
            if(Math.abs(e.gamma) > 10) {
                this.movePaddle(e.gamma > 0 ? 'right' : 'left');
            }
        });
    }

    gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateBall();
        this.drawBricks();
        this.drawPaddle();
        this.drawBall();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game
window.addEventListener('load', () => {
    const game = new Game();
    window.addEventListener('resize', () => game.resize());
});
