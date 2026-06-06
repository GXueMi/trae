/**
 * 视觉效果系统
 * 处理像素化、模糊、故障、降维打击等视觉效果
 */

class EffectsManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.effects = [];
        this.particles = [];
    }

    /**
     * 更新所有效果
     */
    update(deltaTime) {
        // 更新效果
        this.effects = this.effects.filter(effect => {
            effect.update(deltaTime);
            return effect.active;
        });

        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
    }

    /**
     * 渲染所有效果
     */
    render() {
        // 渲染效果
        this.effects.forEach(effect => effect.render(this.ctx));

        // 渲染粒子
        this.particles.forEach(particle => particle.render(this.ctx));
    }

    /**
     * 添加爆炸粒子效果
     */
    addExplosion(x, y, color = '#ff0000', count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.random(-0.3, 0.3);
            const speed = Utils.random(100, 300);
            const size = Utils.random(3, 8);

            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                size,
                color,
                Utils.random(0.5, 1.5)
            ));
        }
    }

    /**
     * 添加得分弹出效果
     */
    addScorePopup(x, y, score, color = '#ffff00') {
        this.effects.push(new ScorePopup(x, y, score, color));
    }

    /**
     * 添加故障效果
     */
    addGlitchEffect(duration = 0.5) {
        this.effects.push(new GlitchEffect(this.canvas, duration));
    }

    /**
     * 添加屏幕震动效果
     */
    addShakeEffect(intensity = 10, duration = 0.3) {
        this.effects.push(new ShakeEffect(intensity, duration));
    }

    /**
     * 添加波纹效果
     */
    addRippleEffect(x, y, color = 'rgba(255, 255, 255, 0.5)') {
        this.effects.push(new RippleEffect(x, y, color));
    }

    /**
     * 添加闪光效果
     */
    addFlashEffect(color = 'rgba(255, 255, 255, 0.8)', duration = 0.2) {
        this.effects.push(new FlashEffect(color, duration));
    }

    /**
     * 应用像素化滤镜
     */
    applyPixelation(ctx, canvas, pixelSize = 8) {
        const w = canvas.width;
        const h = canvas.height;

        ctx.imageSmoothingEnabled = false;

        // 缩小
        ctx.drawImage(canvas, 0, 0, w / pixelSize, h / pixelSize);
        // 放大
        ctx.drawImage(canvas, 0, 0, w / pixelSize, h / pixelSize, 0, 0, w, h);

        ctx.imageSmoothingEnabled = true;
    }

    /**
     * 应用模糊效果（使用CSS filter）
     */
    applyBlur(element, radius = 5) {
        element.style.filter = `blur(${radius}px)`;
    }

    /**
     * 移除模糊效果
     */
    removeBlur(element) {
        element.style.filter = 'none';
    }

    /**
     * 创建像素块效果（用于病毒侵蚀）
     */
    createPixelBlock(x, y, width, height, color = '#ff0000') {
        return {
            x, y, width, height, color,
            alpha: 1,
            rotation: 0,
            scale: 1
        };
    }

    /**
     * 清除所有效果
     */
    clear() {
        this.effects = [];
        this.particles = [];
    }
}

/**
 * 粒子类
 */
class Particle {
    constructor(x, y, vx, vy, size, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.gravity = 200;
        this.friction = 0.98;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= deltaTime;
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;
        const size = this.size * alpha;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - size / 2,
            this.y - size / 2,
            size,
            size
        );
        ctx.restore();
    }
}

/**
 * 得分弹出效果
 */
class ScorePopup {
    constructor(x, y, score, color) {
        this.x = x;
        this.y = y;
        this.score = score;
        this.color = color;
        this.life = 1.5;
        this.maxLife = 1.5;
        this.vy = -80;
        this.scale = 1;
        this.active = true;
    }

    update(deltaTime) {
        this.y += this.vy * deltaTime;
        this.vy *= 0.95;
        this.life -= deltaTime;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;
        const scale = 1 + (1 - alpha) * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${24 * scale}px 'Courier New', monospace`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 描边
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(`+${this.score}`, this.x, this.y);

        // 填充
        ctx.fillText(`+${this.score}`, this.x, this.y);
        ctx.restore();
    }
}

/**
 * 故障效果
 */
class GlitchEffect {
    constructor(canvas, duration) {
        this.canvas = canvas;
        this.duration = duration;
        this.life = duration;
        this.active = true;
        this.offsets = [];
        this.lastUpdate = 0;
    }

    update(deltaTime) {
        this.life -= deltaTime;

        if (this.life <= 0) {
            this.active = false;
            return;
        }

        // 每50ms更新一次故障偏移
        if (Date.now() - this.lastUpdate > 50) {
            this.offsets = [];
            const count = Utils.randomInt(3, 8);
            for (let i = 0; i < count; i++) {
                this.offsets.push({
                    y: Utils.random(0, this.canvas.height),
                    height: Utils.random(5, 30),
                    offset: Utils.random(-20, 20)
                });
            }
            this.lastUpdate = Date.now();
        }
    }

    render(ctx) {
        if (!this.active || this.offsets.length === 0) return;

        ctx.save();

        this.offsets.forEach(offset => {
            ctx.drawImage(
                this.canvas,
                0, offset.y, this.canvas.width, offset.height,
                offset.offset, offset.y, this.canvas.width, offset.height
            );
        });

        // RGB分离效果
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.5;

        ctx.drawImage(this.canvas, -3, 0);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.drawImage(this.canvas, 3, 0);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.restore();
    }
}

/**
 * 屏幕震动效果
 */
class ShakeEffect {
    constructor(intensity, duration) {
        this.intensity = intensity;
        this.duration = duration;
        this.life = duration;
        this.active = true;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    update(deltaTime) {
        this.life -= deltaTime;

        if (this.life <= 0) {
            this.active = false;
            this.offsetX = 0;
            this.offsetY = 0;
            return;
        }

        const progress = this.life / this.duration;
        const currentIntensity = this.intensity * progress;

        this.offsetX = Utils.random(-currentIntensity, currentIntensity);
        this.offsetY = Utils.random(-currentIntensity, currentIntensity);
    }

    render(ctx) {
        if (this.active) {
            ctx.translate(this.offsetX, this.offsetY);
        }
    }
}

/**
 * 波纹效果
 */
class RippleEffect {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 0;
        this.maxRadius = 150;
        this.life = 0.5;
        this.maxLife = 0.5;
        this.active = true;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        this.radius = (1 - this.life / this.maxLife) * this.maxRadius;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

/**
 * 闪光效果
 */
class FlashEffect {
    constructor(color, duration) {
        this.color = color;
        this.duration = duration;
        this.life = duration;
        this.active = true;
    }

    update(deltaTime) {
        this.life -= deltaTime;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx) {
        const alpha = this.life / this.duration;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
}

/**
 * 像素化背景效果（用于病毒侵蚀区域）
 */
class PixelationEffect {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.pixelBlocks = [];
    }

    /**
     * 添加像素块
     */
    addPixelBlock(x, y, size, color) {
        this.pixelBlocks.push({
            x, y, size, color,
            alpha: 1,
            rotation: Utils.random(0, Math.PI * 2),
            scale: 0,
            targetScale: 1,
            life: Infinity
        });
    }

    /**
     * 更新像素块
     */
    update(deltaTime) {
        this.pixelBlocks.forEach(block => {
            // 缩放动画
            block.scale = Utils.lerp(block.scale, block.targetScale, deltaTime * 10);
        });
    }

    /**
     * 渲染像素块
     */
    render() {
        this.ctx.save();

        this.pixelBlocks.forEach(block => {
            this.ctx.globalAlpha = block.alpha;
            this.ctx.fillStyle = block.color;

            this.ctx.translate(block.x + block.size / 2, block.y + block.size / 2);
            this.ctx.rotate(block.rotation);
            this.ctx.scale(block.scale, block.scale);

            this.ctx.fillRect(-block.size / 2, -block.size / 2, block.size, block.size);

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        });

        this.ctx.restore();
    }

    /**
     * 清除像素块
     */
    clear() {
        this.pixelBlocks = [];
    }
}

/**
 * 降维打击效果（污染度达到60%时触发）
 */
class DimensionDropEffect {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.active = false;
        this.pixelSize = 1;
        this.targetPixelSize = 1;
        this.blurAmount = 0;
        this.targetBlurAmount = 0;
    }

    /**
     * 激活降维效果
     */
    activate(corruptionLevel) {
        this.active = true;

        if (corruptionLevel >= 0.8) {
            this.targetPixelSize = 12;
            this.targetBlurAmount = 8;
        } else if (corruptionLevel >= 0.7) {
            this.targetPixelSize = 8;
            this.targetBlurAmount = 5;
        } else if (corruptionLevel >= 0.6) {
            this.targetPixelSize = 6;
            this.targetBlurAmount = 3;
        } else {
            this.deactivate();
        }
    }

    /**
     * 停用降维效果
     */
    deactivate() {
        this.active = false;
        this.targetPixelSize = 1;
        this.targetBlurAmount = 0;
    }

    /**
     * 更新效果
     */
    update(deltaTime) {
        // 平滑过渡
        this.pixelSize = Utils.lerp(this.pixelSize, this.targetPixelSize, deltaTime * 3);
        this.blurAmount = Utils.lerp(this.blurAmount, this.targetBlurAmount, deltaTime * 3);
    }

    /**
     * 应用效果
     */
    apply() {
        if (!this.active) return;

        // 应用模糊
        if (this.blurAmount > 0.5) {
            this.canvas.style.filter = `blur(${this.blurAmount}px)`;
        } else {
            this.canvas.style.filter = 'none';
        }
    }

    /**
     * 获取当前像素大小
     */
    getPixelSize() {
        return Math.max(1, Math.round(this.pixelSize));
    }
}

/**
 * 扫描线效果（CRT显示器风格）
 */
class ScanlineEffect {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.scanlineY = 0;
        this.speed = 100;
    }

    update(deltaTime) {
        this.scanlineY += this.speed * deltaTime;
        if (this.scanlineY > this.height) {
            this.scanlineY = 0;
        }
    }

    render(ctx) {
        ctx.save();

        // 扫描线
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, this.scanlineY, this.width, 2);

        // 水平线条
        ctx.globalAlpha = 0.03;
        for (let y = 0; y < this.height; y += 4) {
            ctx.fillRect(0, y, this.width, 1);
        }

        ctx.restore();
    }
}
