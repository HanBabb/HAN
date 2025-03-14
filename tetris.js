class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextPiece');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        // 方块形状定义
        this.shapes = {
            'I': [[1, 1, 1, 1]],
            'L': [[1, 0], [1, 0], [1, 1]],
            'J': [[0, 1], [0, 1], [1, 1]],
            'O': [[1, 1], [1, 1]],
            'Z': [[1, 1, 0], [0, 1, 1]],
            'S': [[0, 1, 1], [1, 1, 0]],
            'T': [[0, 1, 0], [1, 1, 1]]
        };

        // 方块颜色定义
        this.colors = {
            'I': '#00f0f0',
            'L': '#f0a500',
            'J': '#0000f0',
            'O': '#f0f000',
            'Z': '#f00000',
            'S': '#00f000',
            'T': '#a000f0'
        };

        // 添加触屏控制
        this.touchStartX = null;
        this.touchStartY = null;
        
        // 绑定按钮事件
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

        // 绑定键盘事件
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // 绑定移动端按钮事件
        document.getElementById('rotateBtn')?.addEventListener('click', () => this.rotate());
        document.getElementById('leftBtn')?.addEventListener('click', () => this.moveLeft());
        document.getElementById('rightBtn')?.addEventListener('click', () => this.moveRight());
        document.getElementById('dropBtn')?.addEventListener('click', () => this.moveDown());

        // 设置画布尺寸
        this.setupCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const isMobile = window.innerWidth <= 768;
        const gameArea = this.canvas.parentElement;
        const containerWidth = gameArea.clientWidth;
        const containerHeight = gameArea.clientHeight;

        // 计算最佳缩放比例
        const scaleWidth = containerWidth / 300;
        const scaleHeight = containerHeight / 600;
        const scale = Math.min(scaleWidth, scaleHeight, 1); // 限制最大缩放为1

        // 应用缩放
        const scaledWidth = Math.floor(300 * scale);
        const scaledHeight = Math.floor(600 * scale);

        this.canvas.style.width = `${scaledWidth}px`;
        this.canvas.style.height = `${scaledHeight}px`;
        
        // 保持画布的原始像素尺寸
        this.canvas.width = 300;
        this.canvas.height = 600;

        // 更新方块大小
        this.blockSize = this.canvas.width / this.cols;
    }

    start() {
        this.reset();
        this.generateNewPiece();
        this.update();
        document.getElementById('startBtn').disabled = true;
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.updateScore();
        this.updateLevel();
    }

    generateNewPiece() {
        const shapes = Object.keys(this.shapes);
        if (!this.currentPiece) {
            const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
            this.currentPiece = {
                shape: this.shapes[randomShape],
                color: this.colors[randomShape],
                x: Math.floor(this.cols / 2) - Math.floor(this.shapes[randomShape][0].length / 2),
                y: 0
            };
        } else {
            this.currentPiece = this.nextPiece;
        }

        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        this.nextPiece = {
            shape: this.shapes[randomShape],
            color: this.colors[randomShape],
            x: Math.floor(this.cols / 2) - Math.floor(this.shapes[randomShape][0].length / 2),
            y: 0
        };

        if (this.checkCollision()) {
            this.gameOver = true;
        }

        this.drawNextPiece();
    }

    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        const centerX = (this.nextCanvas.width - this.nextPiece.shape[0].length * this.blockSize) / 2;
        const centerY = (this.nextCanvas.height - this.nextPiece.shape.length * this.blockSize) / 2;

        this.nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        centerX + x * this.blockSize,
                        centerY + y * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            });
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格背景
        this.drawGrid();
        
        // 绘制已固定的方块
        this.board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawBlock(x, y, value);
                }
            });
        });

        // 绘制当前方块
        if (this.currentPiece) {
            this.currentPiece.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value) {
                        this.drawBlock(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                });
            });
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            this.blockSize - 1
        );
        
        // 添加高光效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(
            x * this.blockSize,
            y * this.blockSize,
            this.blockSize - 1,
            (this.blockSize - 1) / 2
        );
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(44, 62, 80, 0.1)';
        this.ctx.lineWidth = 0.5;

        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.canvas.width, y * this.blockSize);
            this.ctx.stroke();
        }
    }

    checkCollision() {
        return this.currentPiece.shape.some((row, y) => {
            return row.some((value, x) => {
                if (!value) return false;
                const boardX = this.currentPiece.x + x;
                const boardY = this.currentPiece.y + y;
                return boardX < 0 || 
                       boardX >= this.cols || 
                       boardY >= this.rows ||
                       (boardY >= 0 && this.board[boardY][boardX]);
            });
        });
    }

    rotate() {
        const originalShape = this.currentPiece.shape;
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision()) {
            this.currentPiece.shape = originalShape;
        }
    }

    moveLeft() {
        this.currentPiece.x--;
        if (this.checkCollision()) {
            this.currentPiece.x++;
        }
    }

    moveRight() {
        this.currentPiece.x++;
        if (this.checkCollision()) {
            this.currentPiece.x--;
        }
    }

    moveDown() {
        this.currentPiece.y++;
        if (this.checkCollision()) {
            this.currentPiece.y--;
            this.freeze();
            this.clearLines();
            this.generateNewPiece();
        }
    }

    dropDown() {
        while (!this.checkCollision()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.freeze();
        this.clearLines();
        this.generateNewPiece();
    }

    freeze() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            });
        });
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.updateScore();
            
            if (this.score >= this.level * 1000) {
                this.level++;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
                this.updateLevel();
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }

    handleKeyPress(event) {
        if (this.gameOver || this.isPaused) return;

        switch(event.keyCode) {
            case 37: // 左箭头
                this.moveLeft();
                break;
            case 39: // 右箭头
                this.moveRight();
                break;
            case 40: // 下箭头
                this.moveDown();
                break;
            case 38: // 上箭头
                this.rotate();
                break;
            case 32: // 空格
                this.dropDown();
                break;
        }
        this.draw();
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? '继续' : '暂停';
    }

    update(time = 0) {
        if (this.gameOver) {
            alert('游戏结束！最终得分：' + this.score);
            document.getElementById('startBtn').disabled = false;
            return;
        }

        if (this.isPaused) {
            requestAnimationFrame(this.update.bind(this));
            return;
        }

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.moveDown();
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame(this.update.bind(this));
    }
}

// 初始化游戏
const game = new Tetris(); 