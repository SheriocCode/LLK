class LianLianKan {
    constructor() {
        this.board = [];
        this.selectedCells = [];
        this.images = [];
        this.backgroundImage = null;
        this.rows = 10;
        this.cols = 12;
        this.totalPairs = 60;
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

        uploadBtn.addEventListener('change', (e) => this.handleImageUpload(e, imagePreview, uploadStatus, startBtn));
        backgroundBtn.addEventListener('change', (e) => this.handleBackgroundUpload(e, backgroundPreview, backgroundStatus));
        startBtn.addEventListener('click', () => this.startGame());
        shuffleBtn.addEventListener('click', () => this.shuffleRemaining());
    }

    handleBackgroundUpload(event, previewContainer, statusElement) {
        const file = event.target.files[0];
        
        // 清空预览区域
        previewContainer.innerHTML = '';
        
        if (!file) {
            statusElement.textContent = '请选择一张背景图片！';
            statusElement.style.color = 'red';
            return;
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            statusElement.textContent = '请选择图片文件！';
            statusElement.style.color = 'red';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            previewContainer.appendChild(img);
            
            // 保存背景图片
            this.backgroundImage = e.target.result;
            
            // 更新游戏板背景
            if (this.backgroundImage) {
                const gameBoard = document.querySelector('.game-board');
                gameBoard.style.setProperty('--background-image', `url(${this.backgroundImage})`);
            }

            statusElement.textContent = '背景图片上传成功！';
            statusElement.style.color = '#4CAF50';
        };
        reader.readAsDataURL(file);
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
        
        // 启用打乱按钮
        const shuffleBtn = document.getElementById('shuffleButton');
        shuffleBtn.disabled = false;
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

        // 检查一条直线连接
        if (this.checkStraightLine(row1, col1, row2, col2)) {
            return true;
        }

        // 检查一个拐点连接
        if (this.checkOneCorner(row1, col1, row2, col2)) {
            return true;
        }

        // 检查两个拐点连接
        if (this.checkTwoCorners(row1, col1, row2, col2)) {
            return true;
        }

        return false;
    }

    checkStraightLine(row1, col1, row2, col2) {
        if (row1 === row2) {
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            for (let col = minCol + 1; col < maxCol; col++) {
                if (this.board[row1][col].visible) return false;
            }
            return true;
        }

        if (col1 === col2) {
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                if (this.board[row][col1].visible) return false;
            }
            return true;
        }

        return false;
    }

    checkOneCorner(row1, col1, row2, col2) {
        // 检查水平拐点
        if (this.checkStraightLine(row1, col1, row1, col2) && 
            this.checkStraightLine(row1, col2, row2, col2) && 
            !this.board[row1][col2].visible) {
            return true;
        }

        // 检查垂直拐点
        if (this.checkStraightLine(row1, col1, row2, col1) && 
            this.checkStraightLine(row2, col1, row2, col2) && 
            !this.board[row2][col1].visible) {
            return true;
        }

        return false;
    }

    checkTwoCorners(row1, col1, row2, col2) {
        // 检查所有可能的两个拐点路径
        for (let i = 0; i < this.rows; i++) {
            // 检查第一个拐点 (row1, col1) -> (i, col1) -> (i, col2) -> (row2, col2)
            if (!this.board[i][col1].visible && !this.board[i][col2].visible) {
                if (this.checkStraightLine(row1, col1, i, col1) && 
                    this.checkStraightLine(i, col1, i, col2) && 
                    this.checkStraightLine(i, col2, row2, col2)) {
                    return true;
                }
            }
        }

        for (let j = 0; j < this.cols; j++) {
            // 检查第一个拐点 (row1, col1) -> (row1, j) -> (row2, j) -> (row2, col2)
            if (!this.board[row1][j].visible && !this.board[row2][j].visible) {
                if (this.checkStraightLine(row1, col1, row1, j) && 
                    this.checkStraightLine(row1, j, row2, j) && 
                    this.checkStraightLine(row2, j, row2, col2)) {
                    return true;
                }
            }
        }

        return false;
    }

    removeCells(row1, col1, row2, col2) {
        // 高亮显示连接路径
        this.highlightPath(row1, col1, row2, col2);

        // 移除选中的单元格
        setTimeout(() => {
            this.board[row1][col1].visible = false;
            this.board[row2][col2].visible = false;
            this.renderBoard();

            // 检查游戏是否结束
            if (this.checkGameOver()) {
                alert('恭喜你赢了！');
            }
        }, 500);
    }

    highlightPath(row1, col1, row2, col2) {
        // 获取连接路径上的所有单元格
        const path = this.getPath(row1, col1, row2, col2);
        
        // 高亮显示路径上的单元格
        path.forEach(cell => {
            const cellElement = document.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
            cellElement.classList.add('highlight');
        });

        // 移除高亮效果
        setTimeout(() => {
            path.forEach(cell => {
                const cellElement = document.querySelector(`.cell[data-row="${cell.row}"][data-col="${cell.col}"]`);
                cellElement.classList.remove('highlight');
            });
        }, 500);
    }

    getPath(row1, col1, row2, col2) {
        const path = [];
        
        // 添加起点
        path.push({ row: row1, col: col1 });

        // 如果是直线连接
        if (row1 === row2) {
            const minCol = Math.min(col1, col2);
            const maxCol = Math.max(col1, col2);
            for (let col = minCol + 1; col < maxCol; col++) {
                path.push({ row: row1, col });
            }
        } else if (col1 === col2) {
            const minRow = Math.min(row1, row2);
            const maxRow = Math.max(row1, row2);
            for (let row = minRow + 1; row < maxRow; row++) {
                path.push({ row, col: col1 });
            }
        } else {
            // 如果是拐点连接，需要找到拐点
            let corner;
            if (this.checkOneCorner(row1, col1, row1, col2)) {
                corner = { row: row1, col: col2 };
            } else if (this.checkOneCorner(row1, col1, row2, col1)) {
                corner = { row: row2, col: col1 };
            } else {
                // 两个拐点的情况，需要找到中间点
                for (let i = 0; i < this.rows; i++) {
                    if (this.checkOneCorner(row1, col1, i, col2) && 
                        this.checkStraightLine(i, col2, row2, col2)) {
                        corner = { row: i, col: col2 };
                        break;
                    }
                }
                if (!corner) {
                    for (let j = 0; j < this.cols; j++) {
                        if (this.checkOneCorner(row1, col1, row2, j) && 
                            this.checkStraightLine(row2, j, row2, col2)) {
                            corner = { row: row2, col: j };
                            break;
                        }
                    }
                }
            }

            // 添加拐点路径
            if (corner) {
                const path1 = this.getPath(row1, col1, corner.row, corner.col);
                const path2 = this.getPath(corner.row, corner.col, row2, col2);
                path.push(...path1.slice(1), ...path2.slice(1));
            }
        }

        // 添加终点
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
}

// 初始化游戏
const game = new LianLianKan(); 