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
        this.HINT_PENALTY = 5; // 使用提示的扣分数
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
            return true;
        } else {
            // 垂直方向
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][col1].visible) {
                    return false;
                }
            }
            return true;
        }
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
        // 检查垂直-水平-垂直的路径
        for (let col = 0; col < this.cols; col++) {
            // 跳过起点和终点的列，因为这些情况应该由单拐点处理
            if (col === col1 || col === col2) continue;
            
            // 检查两个拐点位置是否为空
            if (!this.board[row1][col].visible && !this.board[row2][col].visible) {
                // 验证三段路径是否都通畅
                if (this.checkStraightLine(row1, col1, row1, col) && 
                    this.checkStraightLine(row1, col, row2, col) && 
                    this.checkStraightLine(row2, col, row2, col2)) {
                    return {
                        corner1: { row: row1, col: col },
                        corner2: { row: row2, col: col }
                    };
                }
            }
        }

        // 检查水平-垂直-水平的路径
        for (let row = 0; row < this.rows; row++) {
            // 跳过起点和终点的行，因为这些情况应该由单拐点处理
            if (row === row1 || row === row2) continue;
            
            // 检查两个拐点位置是否为空
            if (!this.board[row][col1].visible && !this.board[row][col2].visible) {
                // 验证三段路径是否都通畅
                if (this.checkStraightLine(row1, col1, row, col1) && 
                    this.checkStraightLine(row, col1, row, col2) && 
                    this.checkStraightLine(row, col2, row2, col2)) {
                    return {
                        corner1: { row: row, col: col1 },
                        corner2: { row: row, col: col2 }
                    };
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
                this.currentScore += 5; // 消除一对得5分
                this.updateScoreDisplay();
                
                if (this.timeLeft <= 0) {
                    this.stopTimer();
                    this.addToHistory(this.currentScore);
                    alert('时间到！游戏结束！');
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
        document.querySelectorAll('.cell.highlight-path').forEach(cell => {
            cell.classList.remove('highlight-path');
        });

        // 高亮显示路径上的单元格
        path.forEach(point => {
            const cellElement = document.querySelector(`.cell[data-row="${point.row}"][data-col="${point.col}"]`);
            if (cellElement) {
                cellElement.classList.add('highlight-path');
            }
        });

        // 500ms后移除高亮效果
        setTimeout(() => {
            path.forEach(point => {
                const cellElement = document.querySelector(`.cell[data-row="${point.row}"][data-col="${point.col}"]`);
                if (cellElement) {
                    cellElement.classList.remove('highlight-path');
                }
            });
        }, 500);
    }

    getPath(row1, col1, row2, col2) {
        const path = [];
        path.push({ row: row1, col: col1 });

        // 首先检查是否可以直线连接
        if (this.checkStraightLine(row1, col1, row2, col2)) {
            this.addPathPoints(path, row1, col1, row2, col2);
        } else {
            // 检查单拐点连接
            const oneCorner = this.checkOneCorner(row1, col1, row2, col2);
            if (oneCorner) {
                const corner = oneCorner.corner1;
                this.addPathPoints(path, row1, col1, corner.row, corner.col);
                path.push(corner);
                this.addPathPoints(path, corner.row, corner.col, row2, col2);
            } else {
                // 检查双拐点连接
                const twoCorners = this.checkTwoCorners(row1, col1, row2, col2);
                if (twoCorners) {
                    const { corner1, corner2 } = twoCorners;
                    
                    // 添加第一段路径（垂直或水平）
                    this.addPathPoints(path, row1, col1, corner1.row, corner1.col);
                    path.push(corner1);
                    
                    // 添加第二段路径（水平或垂直）
                    this.addPathPoints(path, corner1.row, corner1.col, corner2.row, corner2.col);
                    path.push(corner2);
                    
                    // 添加第三段路径（垂直或水平）
                    this.addPathPoints(path, corner2.row, corner2.col, row2, col2);
                }
            }
        }

        path.push({ row: row2, col: col2 });
        return path;
    }

    addPathPoints(path, row1, col1, row2, col2) {
        if (row1 === row2) {
            // 水平方向
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            for (let col = minCol + 1; col < maxCol; col++) {
                path.push({ row: row1, col });
            }
        } else if (col1 === col2) {
            // 垂直方向
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                path.push({ row, col: col1 });
            }
        }
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

        // 在计时模式下使用提示会扣分
        if (this.isTimedMode) {
            this.currentScore = Math.max(0, this.currentScore - 3); // 使用提示扣3分
            this.updateScoreDisplay();
        }

        // 遍历所有可见的方块
        const visibleBlocks = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].visible) {
                    visibleBlocks.push({ row: i, col: j, value: this.board[i][j].value });
                }
            }
        }

        // 检查所有可能的配对
        for (let i = 0; i < visibleBlocks.length; i++) {
            for (let j = i + 1; j < visibleBlocks.length; j++) {
                const block1 = visibleBlocks[i];
                const block2 = visibleBlocks[j];

                // 检查是否是相同的水果且可以连接
                if (block1.value === block2.value && 
                    this.canConnect(block1.row, block1.col, block2.row, block2.col)) {
                    // 高亮显示这对可以连接的方块
                    const cell1 = document.querySelector(`.cell[data-row="${block1.row}"][data-col="${block1.col}"]`);
                    const cell2 = document.querySelector(`.cell[data-row="${block2.row}"][data-col="${block2.col}"]`);
                    
                    if (cell1 && cell2) {
                        cell1.classList.add('highlight');
                        cell2.classList.add('highlight');
                        
                        // 1秒后移除高亮
                        setTimeout(() => {
                            cell1.classList.remove('highlight');
                            cell2.classList.remove('highlight');
                        }, 1000);
                        return;
                    }
                }
            }
        }

        // 如果没有找到可以连接的对，可以给出提示
        alert('当前没有可以连接的方块，请尝试重排！');
    }

    toggleGameMode() {
        this.isTimedMode = !this.isTimedMode;
        const modeButton = document.getElementById('modeButton');
        const gameInfo = document.getElementById('gameInfo');
        
        modeButton.textContent = `当前模式：${this.isTimedMode ? '计时模式' : '普通模式'}`;
        
        if (this.isTimedMode) {
            gameInfo.style.display = 'block';
            this.resetTimer();
            this.updateScoreDisplay();
        } else {
            gameInfo.style.display = 'none';
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