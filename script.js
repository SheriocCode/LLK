class LianLianKan {
    constructor() {
        this.board = [];
        this.selectedCells = [];
        this.images = [];
        this.backgroundImages = []; // 存储多张背景图片
        this.currentBackgroundIndex = 0; // 当前背景图片索引
        this.backgroundImage = null;
        this.rows = 10;
        this.cols = 12;
        this.totalPairs = 60;
        this.isTimedMode = false;
        this.timeLeft = 60;
        this.currentScore = 0;
        this.targetScore = 60;
        this.timer = null;
        this.history = this.loadHistory();
        this.initializeGame();
    }

    initializeGame() {
        const uploadBtn = document.getElementById('imageUpload');
        const backgroundBtn = document.getElementById('backgroundUpload');
        const startBtn = document.getElementById('startGame');
        const shuffleBtn = document.getElementById('shuffleButton');
        const gameBoard = document.getElementById('gameBoard');
        const imagePreview = document.getElementById('imagePreview');
        const backgroundPreview = document.getElementById('backgroundPreview');
        const uploadStatus = document.getElementById('uploadStatus');
        const backgroundStatus = document.getElementById('backgroundStatus');
        const hintButton = document.getElementById('hintButton');
        const modeButton = document.getElementById('modeButton');
        const clearHistoryButton = document.getElementById('clearHistory');
        const prevBackgroundBtn = document.getElementById('prevBackground');
        const nextBackgroundBtn = document.getElementById('nextBackground');

        uploadBtn.addEventListener('change', (e) => this.handleImageUpload(e, imagePreview, uploadStatus, startBtn));
        backgroundBtn.addEventListener('change', (e) => this.handleBackgroundUpload(e, backgroundPreview, backgroundStatus));
        startBtn.addEventListener('click', () => this.startGame());
        shuffleBtn.addEventListener('click', () => this.shuffleRemaining());
        hintButton.addEventListener('click', () => this.showHint());
        modeButton.addEventListener('click', () => this.toggleGameMode());
        clearHistoryButton.addEventListener('click', () => this.clearHistory());
        prevBackgroundBtn.addEventListener('click', () => this.switchBackground(-1));
        nextBackgroundBtn.addEventListener('click', () => this.switchBackground(1));
        this.updateHistoryDisplay();
    }

    handleBackgroundUpload(event, previewContainer, statusElement) {
        const files = event.target.files;
        
        // 清空预览区域
        previewContainer.innerHTML = '';
        this.backgroundImages = [];
        
        if (!files || files.length === 0) {
            statusElement.textContent = '请选择背景图片！';
            statusElement.style.color = 'red';
            return;
        }

        // 验证文件类型
        const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            statusElement.textContent = '请只选择图片文件！';
            statusElement.style.color = 'red';
            return;
        }

        // 处理图片预览
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                img.title = `背景 ${index + 1}`;
                previewContainer.appendChild(img);
                
                // 保存背景图片URL
                this.backgroundImages.push(e.target.result);
                
                // 如果是第一张图片，设置为当前背景
                if (this.backgroundImages.length === 1) {
                    this.setBackgroundImage(e.target.result);
                }

                statusElement.textContent = `已上传${this.backgroundImages.length}张背景图片`;
                statusElement.style.color = '#4CAF50';
            };
            reader.readAsDataURL(file);
        });
    }

    switchBackground(direction) {
        if (this.backgroundImages.length === 0) return;
        
        this.currentBackgroundIndex = (this.currentBackgroundIndex + direction + this.backgroundImages.length) % this.backgroundImages.length;
        this.setBackgroundImage(this.backgroundImages[this.currentBackgroundIndex]);
    }

    setBackgroundImage(imageUrl) {
        this.backgroundImage = imageUrl;
        const gameBoard = document.querySelector('.game-board');
        gameBoard.style.setProperty('--background-image', `url(${imageUrl})`);
        gameBoard.style.backgroundImage = `url(${imageUrl})`;
    }

    handleImageUpload(event, imagePreview, uploadStatus, startBtn) {
        const files = event.target.files;
        const previewContainer = imagePreview;
        const statusElement = uploadStatus;
        
        // 清空预览区域
        previewContainer.innerHTML = '';
        this.images = [];

        if (files.length !== 20) {
            statusElement.textContent = `请选择20张图片！当前选择了${files.length}张。`;
            statusElement.style.color = 'red';
            startBtn.disabled = true;
            return;
        }

        // 验证文件类型
        const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            statusElement.textContent = '请只选择图片文件！';
            statusElement.style.color = 'red';
            startBtn.disabled = true;
            return;
        }

        // 处理图片预览
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                img.title = `图片 ${index + 1}`;
                previewContainer.appendChild(img);
                
                // 保存图片URL
                this.images.push(e.target.result);
                
                // 当所有图片都加载完成时
                if (this.images.length === 20) {
                    statusElement.textContent = '图片上传成功！点击"开始游戏"按钮开始游戏。';
                    statusElement.style.color = '#4CAF50';
                    startBtn.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    startGame() {
        if (this.images.length !== 20) {
            alert('请先上传20张图片！');
            return;
        }

        this.createBoard();
        this.renderBoard();
        
        const shuffleBtn = document.getElementById('shuffleButton');
        const hintButton = document.getElementById('hintButton');
        shuffleBtn.disabled = false;
        hintButton.disabled = false;

        if (this.isTimedMode) {
            this.startTimer();
        }
    }

    createBoard() {
        // 创建包含所有可能的水果对的数组
        let pairs = [];
        for (let i = 0; i < this.images.length; i++) {
            for (let j = 0; j < 6; j++) {
                pairs.push(i);
            }
        }

        // 随机打乱数组
        pairs = this.shuffleArray(pairs);

        // 创建游戏板
        this.board = [];
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    value: pairs[i * this.cols + j],
                    visible: true
                };
            }
        }
    }

    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;

                if (this.board[i][j].visible) {
                    const img = document.createElement('img');
                    img.src = this.images[this.board[i][j].value];
                    cell.appendChild(img);
                }

                cell.addEventListener('click', () => this.handleCellClick(i, j));
                gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (!this.board[row][col].visible) return;

        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        
        if (this.selectedCells.length === 0) {
            this.selectedCells.push({ row, col });
            cell.classList.add('selected');
        } else if (this.selectedCells.length === 1) {
            const firstCell = this.selectedCells[0];
            if (firstCell.row === row && firstCell.col === col) {
                cell.classList.remove('selected');
                this.selectedCells = [];
                return;
            }

            this.selectedCells.push({ row, col });
            cell.classList.add('selected');

            if (this.canConnect(firstCell.row, firstCell.col, row, col)) {
                this.removeCells(firstCell.row, firstCell.col, row, col);
            }

            setTimeout(() => {
                this.selectedCells.forEach(cell => {
                    const cellElement = document.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
                    cellElement.classList.remove('selected');
                });
                this.selectedCells = [];
            }, 500);
        }
    }

    canConnect(row1, col1, row2, col2) {
        // 检查是否是相同的水果
        if (this.board[row1][col1].value !== this.board[row2][col2].value) {
            return false;
        }

        // 按路径长度优先级检查
        // 1. 直线连接
        if (this.checkStraightLine(row1, col1, row2, col2)) {
            return true;
        }

        // 2. 一个拐点连接
        const oneCorner = this.checkOneCorner(row1, col1, row2, col2);
        if (oneCorner) {
            return true;
        }

        // 3. 两个拐点连接
        const twoCorners = this.checkTwoCorners(row1, col1, row2, col2);
        if (twoCorners) {
            return true;
        }

        return false;
    }

    checkStraightLine(row1, col1, row2, col2) {
        // 检查是否是直线
        if (row1 !== row2 && col1 !== col2) {
            return false;
        }

        // 检查路径上是否有其他方块阻挡
        if (row1 === row2) {
            // 水平方向
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (this.board[row1][col].visible) {
                    return false;
                }
            }
        } else {
            // 垂直方向
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][col1].visible) {
                    return false;
                }
            }
        }

        return true;
    }

    checkOneCorner(row1, col1, row2, col2) {
        // 检查水平拐点
        if (!this.board[row1][col2].visible &&
            this.checkStraightLine(row1, col1, row1, col2) && 
            this.checkStraightLine(row1, col2, row2, col2)) {
            return { corner1: { row: row1, col: col2 } };
        }

        // 检查垂直拐点
        if (!this.board[row2][col1].visible &&
            this.checkStraightLine(row1, col1, row2, col1) && 
            this.checkStraightLine(row2, col1, row2, col2)) {
            return { corner1: { row: row2, col: col1 } };
        }

        return null;
    }

    checkTwoCorners(row1, col1, row2, col2) {
        // 检查所有可能的两个拐点路径
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                // 确保拐点位置没有方块
                if (!this.board[i][j].visible) {
                    // 检查第一种情况：水平-垂直-水平
                    if (i !== row1 && j !== col2 && 
                        this.checkStraightLine(row1, col1, row1, j) && 
                        this.checkStraightLine(row1, j, i, j) && 
                        this.checkStraightLine(i, j, row2, col2) &&
                        !this.board[row1][j].visible) {
                        return { corner1: { row: row1, col: j }, corner2: { row: i, col: j } };
                    }
                    
                    // 检查第二种情况：垂直-水平-垂直
                    if (i !== row2 && j !== col1 &&
                        this.checkStraightLine(row1, col1, i, col1) && 
                        this.checkStraightLine(i, col1, i, j) && 
                        this.checkStraightLine(i, j, row2, col2) &&
                        !this.board[i][col1].visible) {
                        return { corner1: { row: i, col: col1 }, corner2: { row: i, col: j } };
                    }
                }
            }
        }
        return null;
    }

    removeCells(row1, col1, row2, col2) {
        this.highlightPath(row1, col1, row2, col2);

        setTimeout(() => {
            this.board[row1][col1].visible = false;
            this.board[row2][col2].visible = false;
            this.renderBoard();

            if (this.isTimedMode) {
                this.currentScore += 2;
                this.updateScoreDisplay();
                
                if (this.currentScore >= this.targetScore) {
                    this.stopTimer();
                    this.addToHistory(this.currentScore);
                    alert('恭喜你完成了计时模式！');
                    this.endGame();
                }
            } else {
                if (this.checkGameOver()) {
                    alert('恭喜你赢了！');
                }
            }
        }, 500);
    }

    highlightPath(row1, col1, row2, col2) {
        // 获取连接路径上的所有单元格
        const path = this.getPath(row1, col1, row2, col2);
        
        // 移除所有现有的高亮
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });

        // 高亮显示路径上的单元格
        path.forEach(point => {
            const cellElement = document.querySelector(`.cell[data-row="${point.row}"][data-col="${point.col}"]`);
            if (cellElement) {
                cellElement.classList.add('highlight');
            }
        });

        // 移除高亮效果
        setTimeout(() => {
            path.forEach(point => {
                const cellElement = document.querySelector(`.cell[data-row="${point.row}"][data-col="${point.col}"]`);
                if (cellElement) {
                    cellElement.classList.remove('highlight');
                }
            });
        }, 500);
    }

    getPath(row1, col1, row2, col2) {
        const path = [];
        path.push({ row: row1, col: col1 });

        if (row1 === row2) {
            // 水平直线
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            for (let col = minCol + 1; col < maxCol; col++) {
                path.push({ row: row1, col });
            }
        } else if (col1 === col2) {
            // 垂直直线
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                path.push({ row, col: col1 });
            }
        } else {
            // 尝试找到最短路径
            let corners = this.checkOneCorner(row1, col1, row2, col2);
            
            if (!corners) {
                corners = this.checkTwoCorners(row1, col1, row2, col2);
            }

            if (corners) {
                if (corners.corner2) {
                    // 双拐点路径
                    // 第一段：起点到第一个拐点
                    if (corners.corner1.row === row1) {
                        // 水平移动
                        const minCol = Math.min(col1, corners.corner1.col);
                        const maxCol = Math.max(col1, corners.corner1.col);
                        for (let col = minCol + 1; col < maxCol; col++) {
                            path.push({ row: row1, col });
                        }
                    } else {
                        // 垂直移动
                        const minRow = Math.min(row1, corners.corner1.row);
                        const maxRow = Math.max(row1, corners.corner1.row);
                        for (let row = minRow + 1; row < maxRow; row++) {
                            path.push({ row, col: col1 });
                        }
                    }
                    
                    // 添加第一个拐点
                    path.push(corners.corner1);
                    
                    // 第二段：第一个拐点到第二个拐点
                    if (corners.corner2.row === corners.corner1.row) {
                        // 水平移动
                        const minCol = Math.min(corners.corner1.col, corners.corner2.col);
                        const maxCol = Math.max(corners.corner1.col, corners.corner2.col);
                        for (let col = minCol + 1; col < maxCol; col++) {
                            path.push({ row: corners.corner1.row, col });
                        }
                    } else {
                        // 垂直移动
                        const minRow = Math.min(corners.corner1.row, corners.corner2.row);
                        const maxRow = Math.max(corners.corner1.row, corners.corner2.row);
                        for (let row = minRow + 1; row < maxRow; row++) {
                            path.push({ row, col: corners.corner1.col });
                        }
                    }
                    
                    // 添加第二个拐点
                    path.push(corners.corner2);
                    
                    // 第三段：第二个拐点到终点
                    if (corners.corner2.row === row2) {
                        // 水平移动
                        const minCol = Math.min(corners.corner2.col, col2);
                        const maxCol = Math.max(corners.corner2.col, col2);
                        for (let col = minCol + 1; col < maxCol; col++) {
                            path.push({ row: row2, col });
                        }
                    } else {
                        // 垂直移动
                        const minRow = Math.min(corners.corner2.row, row2);
                        const maxRow = Math.max(corners.corner2.row, row2);
                        for (let row = minRow + 1; row < maxRow; row++) {
                            path.push({ row, col: corners.corner2.col });
                        }
                    }
                } else {
                    // 单拐点路径
                    // 第一段：起点到拐点
                    if (corners.corner1.row === row1) {
                        // 水平移动
                        const minCol = Math.min(col1, corners.corner1.col);
                        const maxCol = Math.max(col1, corners.corner1.col);
                        for (let col = minCol + 1; col < maxCol; col++) {
                            path.push({ row: row1, col });
                        }
                    } else {
                        // 垂直移动
                        const minRow = Math.min(row1, corners.corner1.row);
                        const maxRow = Math.max(row1, corners.corner1.row);
                        for (let row = minRow + 1; row < maxRow; row++) {
                            path.push({ row, col: col1 });
                        }
                    }
                    
                    // 添加拐点
                    path.push(corners.corner1);
                    
                    // 第二段：拐点到终点
                    if (corners.corner1.row === row2) {
                        // 水平移动
                        const minCol = Math.min(corners.corner1.col, col2);
                        const maxCol = Math.max(corners.corner1.col, col2);
                        for (let col = minCol + 1; col < maxCol; col++) {
                            path.push({ row: row2, col });
                        }
                    } else {
                        // 垂直移动
                        const minRow = Math.min(corners.corner1.row, row2);
                        const maxRow = Math.max(corners.corner1.row, row2);
                        for (let row = minRow + 1; row < maxRow; row++) {
                            path.push({ row, col: corners.corner1.col });
                        }
                    }
                }
            }
        }

        path.push({ row: row2, col: col2 });
        return path;
    }

    checkGameOver() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].visible) {
                    return false;
                }
            }
        }
        return true;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    shuffleRemaining() {
        // 收集所有可见的单元格的值
        const visibleValues = [];
        const visiblePositions = [];
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].visible) {
                    visibleValues.push(this.board[i][j].value);
                    visiblePositions.push({ row: i, col: j });
                }
            }
        }

        // 打乱值
        const shuffledValues = this.shuffleArray([...visibleValues]);

        // 重新分配值
        visiblePositions.forEach((pos, index) => {
            this.board[pos.row][pos.col].value = shuffledValues[index];
        });

        // 重新渲染游戏板
        this.renderBoard();
    }

    showHint() {
        // 清除之前的高亮
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });

        // 查找可以连接的对
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.board[i][j].visible) continue;
                
                for (let x = i + 1; x < this.rows; x++) {
                    for (let y = 0; y < this.cols; y++) {
                        if (!this.board[x][y].visible) continue;
                        
                        if (this.board[i][j].value === this.board[x][y].value) {
                            if (this.canConnect(i, j, x, y)) {
                                // 高亮显示这对可以连接的方块
                                const cell1 = document.querySelector(`.cell[data-row="${i}"][data-col="${j}"]`);
                                const cell2 = document.querySelector(`.cell[data-row="${x}"][data-col="${y}"]`);
                                cell1.classList.add('highlight');
                                cell2.classList.add('highlight');
                                
                                // 3秒后移除高亮
                                setTimeout(() => {
                                    cell1.classList.remove('highlight');
                                    cell2.classList.remove('highlight');
                                }, 3000);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    toggleGameMode() {
        this.isTimedMode = !this.isTimedMode;
        const modeButton = document.getElementById('modeButton');
        modeButton.textContent = this.isTimedMode ? '普通模式' : '计时模式';
        
        if (this.isTimedMode) {
            this.resetTimer();
            this.updateScoreDisplay();
        } else {
            this.stopTimer();
            document.getElementById('timeLeft').textContent = '60';
            document.getElementById('currentScore').textContent = '0';
        }
    }

    startTimer() {
        this.timeLeft = 60;
        this.currentScore = 0;
        this.updateTimerDisplay();
        this.updateScoreDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.stopTimer();
                if (this.currentScore < this.targetScore) {
                    alert('时间到！游戏失败！');
                } else {
                    alert('恭喜你完成了计时模式！');
                }
                this.endGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.timeLeft = 60;
        this.currentScore = 0;
        this.updateTimerDisplay();
        this.updateScoreDisplay();
    }

    updateTimerDisplay() {
        document.getElementById('timeLeft').textContent = this.timeLeft;
    }

    updateScoreDisplay() {
        document.getElementById('currentScore').textContent = this.currentScore;
        document.getElementById('targetScore').textContent = this.targetScore;
    }

    endGame() {
        const shuffleBtn = document.getElementById('shuffleButton');
        const hintButton = document.getElementById('hintButton');
        shuffleBtn.disabled = true;
        hintButton.disabled = true;
        
        if (this.isTimedMode) {
            this.stopTimer();
            if (this.currentScore > 0) {
                this.addToHistory(this.currentScore);
            }
        }
    }

    loadHistory() {
        const historyJson = localStorage.getItem('lianliankan_history');
        return historyJson ? JSON.parse(historyJson) : [];
    }

    saveHistory() {
        localStorage.setItem('lianliankan_history', JSON.stringify(this.history));
    }

    addToHistory(score) {
        const now = new Date();
        const record = {
            date: now.toLocaleString(),
            score: score
        };
        this.history.unshift(record);
        // 只保留最近20条记录
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        this.saveHistory();
        this.updateHistoryDisplay();
    }

    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.history = [];
            this.saveHistory();
            this.updateHistoryDisplay();
        }
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        this.history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span class="date">${record.date}</span>
                <span class="score">${record.score}分</span>
            `;
            historyList.appendChild(item);
        });
    }
}

// 初始化游戏
const game = new LianLianKan(); 