/**
 * 工具函数库
 * 提供游戏开发中常用的辅助函数
 */

const Utils = {
    /**
     * 随机数生成（范围）
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * 随机整数
     */
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    /**
     * 限制数值范围
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * 线性插值
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * 距离计算
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * 角度转弧度
     */
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    /**
     * 弧度转角度
     */
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },

    /**
     * 颜色转换（HEX to RGB）
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * RGB转HEX
     */
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * 颜色混合
     */
    blendColors(color1, color2, ratio) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);

        if (!rgb1 || !rgb2) return color1;

        const r = Math.round(this.lerp(rgb1.r, rgb2.r, ratio));
        const g = Math.round(this.lerp(rgb1.g, rgb2.g, ratio));
        const b = Math.round(this.lerp(rgb1.b, rgb2.b, ratio));

        return this.rgbToHex(r, g, b);
    },

    /**
     * 缓动函数 - easeOut
     */
    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    },

    /**
     * 缓动函数 - easeIn
     */
    easeIn(t) {
        return t * t * t;
    },

    /**
     * 缓动函数 - easeInOut
     */
    easeInOut(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    /**
     * 弹性缓动
     */
    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    /**
     * 震动效果
     */
    shake(intensity, decay) {
        const angle = Math.random() * Math.PI * 2;
        const shakeX = Math.cos(angle) * intensity;
        const shakeY = Math.sin(angle) * intensity;
        return { x: shakeX, y: shakeY };
    },

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * 深拷贝对象
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;

        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * 格式化时间（秒 -> MM:SS）
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * 格式化数字（添加千分位）
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * 检测移动设备
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * 检测触摸设备
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    /**
     * 获取设备像素比
     */
    getPixelRatio() {
        return window.devicePixelRatio || 1;
    },

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * 本地存储封装
     */
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage error:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                return false;
            }
        }
    },

    /**
     * 性能监控
     */
    performance: {
        fps: 0,
        frameCount: 0,
        lastTime: performance.now(),

        update() {
            this.frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastTime;

            if (elapsed >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / elapsed);
                this.frameCount = 0;
                this.lastTime = currentTime;
            }

            return this.fps;
        }
    },

    /**
     * 碰撞检测 - 点与矩形
     */
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    /**
     * 碰撞检测 - 点与圆
     */
    pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    },

    /**
     * 碰撞检测 - 矩形与矩形
     */
    rectIntersect(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
        return r1x < r2x + r2w &&
            r1x + r1w > r2x &&
            r1y < r2y + r2h &&
            r1y + r1h > r2y;
    },

    /**
     * 生成像素化文本（用于Canvas）
     */
    pixelateText(ctx, text, x, y, pixelSize = 4) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // 创建临时canvas
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // 测量文本
        tempCtx.font = ctx.font;
        const metrics = tempCtx.measureText(text);
        const width = Math.ceil(metrics.width);
        const height = Math.ceil(parseInt(ctx.font) * 1.2);

        tempCanvas.width = width;
        tempCanvas.height = height;

        // 绘制文本到临时canvas
        tempCtx.font = ctx.font;
        tempCtx.fillStyle = ctx.fillStyle;
        tempCtx.textBaseline = 'top';
        tempCtx.fillText(text, 0, 0);

        // 像素化处理
        const imageData = tempCtx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let py = 0; py < height; py += pixelSize) {
            for (let px = 0; px < width; px += pixelSize) {
                const i = (py * width + px) * 4;
                if (data[i + 3] > 0) {
                    ctx.fillStyle = `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3] / 255})`;
                    ctx.fillRect(x + px, y + py, pixelSize, pixelSize);
                }
            }
        }

        ctx.restore();
    }
};

// 导出（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
