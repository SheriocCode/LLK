class StarsBackground {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'stars-container';
        document.body.insertBefore(this.container, document.body.firstChild);
        
        this.stars = [];
        this.createStars();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    createStars() {
        const starCount = 200;
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // 随机大小（1-3像素）
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            
            // 随机位置
            const x = Math.random() * containerWidth;
            const y = Math.random() * containerHeight;
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            
            // 随机动画持续时间（2-5秒）
            const duration = Math.random() * 3 + 2;
            star.style.setProperty('--duration', `${duration}s`);
            
            this.container.appendChild(star);
            this.stars.push(star);
        }
    }

    handleResize() {
        // 清除现有星星
        this.stars.forEach(star => star.remove());
        this.stars = [];
        
        // 重新创建星星
        this.createStars();
    }
}

// 初始化星空背景
const starsBackground = new StarsBackground(); 