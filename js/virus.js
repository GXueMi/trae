/**
 * 病毒系统
 * 管理病毒像素的生成、行为和消除
 */

/**
 * 病毒类型枚举
 */
const VirusType = {
    NORMAL: 'normal',           // 普通红色病毒
    DECOY: 'decoy',             // 迷惑病毒（绿色/蓝色）
    FAST: 'fast',               // 快速病毒
    TANK: 'tank',               // 坦克病毒（需要多次点击）
    BOSS: 'boss'                // Boss病毒
};

/**
 * 病毒状态枚举
 */
const VirusState = {
    SPAWNING: 'spawning',       // 生成中
    IDLE: 'idle',               // 空闲
    CORRUPTING: 'corrupting',   // 侵蚀中
    DYING: 'dying',             // 死亡中
    DEAD: 'dead'                // 已死亡
};

/**
 * 病毒类
 */
class Virus {
    constructor(x, y, type = VirusType.NORMAL, level = 1) {
        this.id = Utils.generateId();
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = level;
        this.state = VirusState.SPAWNING;

        // 根据类型设置属性
        this.setupByType();

        // 动画属性
        this.scale = 0;
        this.targetScale = 1;
        this.rotation = 0;
        this.alpha = 1;
        this.pulsePhase = Math.random() * Math.PI * 2;

        // 侵蚀属性
        this.corruptionProgress = 0;
        this.corruptionSpeed = 0.3; // 每秒侵蚀进度
        this.corruptionArea = null;

        // 时间属性
        this.lifetime = 0;
        this.maxLifetime = this.getMaxLifetime();
        this.spawnTime = Date.now();

        // 点击计数（用于坦克病毒）
        this.clickCount = 0;
        this.requiredClicks = type === VirusType.TANK ? 3 : 1;

        // 奖励标记
        this.hasPowerup = Math.random() < 0.1; // 10%概率携带道具
        this.powerupGlow = 0;

        // 移动属性（用于围城模式）
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
    }

    /**
     * 根据类型设置属性
     */
    setupByType() {
        switch (this.type) {
            case VirusType.NORMAL:
                this.size = Utils.random(60, 90);  // 大幅增大病毒大小
                this.color = '#ff0000';
                this.score = 10;
                this.speed = 2.5;                     // 大幅提高速度
                this.maxLifetime = Utils.random(8, 10); // 延长生命周期
                break;

            case VirusType.DECOY:
                this.size = Utils.random(60, 90);  // 大幅增大病毒大小
                // 迷惑病毒保持绿色或蓝色
                this.color = Math.random() < 0.5 ? '#00ff00' : '#0088ff';
                this.score = -50; // 负分
                this.speed = 2.0;                   // 大幅提高速度
                this.maxLifetime = Utils.random(10, 12); // 延长生命周期
                this.penalty = 5; // 点错扣除5秒
                break;

            case VirusType.FAST:
                this.size = Utils.random(50, 70);   // 大幅增大病毒大小
                this.color = '#ff0000';              // 快速病毒也是红色
                this.score = 20;
                this.speed = 4.0;                     // 大幅提高速度
                this.maxLifetime = Utils.random(4, 6);
                break;

            case VirusType.TANK:
                this.size = Utils.random(100, 130); // 大幅增大病毒大小
                this.color = '#ff0000';              // 坦克病毒也是红色
                this.score = 50;
                this.speed = 1.5;                   // 大幅提高速度
                this.maxLifetime = Utils.random(12, 15); // 延长生命周期
                break;

            case VirusType.BOSS:
                this.size = Utils.random(150, 200); // 大幅增大病毒大小
                this.color = '#ff0000';              // Boss病毒也是红色
                this.score = 100;
                this.speed = 1.0;                   // 大幅提高速度
                this.maxLifetime = Utils.random(15, 20); // 延长生命周期
                this.requiredClicks = 5;
                break;
        }

        // 根据关卡调整
        if (this.level > 1) {
            this.speed *= (1 + this.level * 0.25);   // 大幅速度加成
            this.maxLifetime *= (1 + this.level * 0.15); // 大幅增加生命周期
            this.size *= (1 + this.level * 0.1);      // 病毒大小随关卡增加
        }
    }

    /**
     * 获取最大生命周期
     */
    getMaxLifetime() {
        return this.maxLifetime;
    }

    /**
     * 更新病毒状态
     */
    update(deltaTime) {
        this.lifetime += deltaTime;

        // 更新动画
        this.updateAnimation(deltaTime);

        // 根据状态更新
        switch (this.state) {
            case VirusState.SPAWNING:
                this.updateSpawning(deltaTime);
                break;

            case VirusState.IDLE:
                this.updateIdle(deltaTime);
                break;

            case VirusState.CORRUPTING:
                this.updateCorrupting(deltaTime);
                break;

            case VirusState.DYING:
                this.updateDying(deltaTime);
                break;
        }

        // 更新道具光环
        if (this.hasPowerup) {
            this.powerupGlow += deltaTime * 5;
        }

        // 移动（围城模式）
        if (this.isMoving) {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
        }
    }

    /**
     * 更新生成动画
     */
    updateSpawning(deltaTime) {
        this.scale = Utils.lerp(this.scale, this.targetScale, deltaTime * 8);

        if (this.scale >= 0.95) {
            this.scale = 1;
            this.state = VirusState.IDLE;
        }
    }

    /**
     * 更新空闲状态
     */
    updateIdle(deltaTime) {
        // 脉动效果
        this.pulsePhase += deltaTime * 3;

        // 像素病毒随时间快速变大（每2秒增大50%）
        const growthRate = 0.25; // 每秒增长25%
        const maxGrowthMultiplier = 4; // 最大增大到原来的4倍
        const currentGrowth = 1 + (this.lifetime * growthRate);
        this.currentGrowth = Math.min(currentGrowth, maxGrowthMultiplier);

        // 检查是否超时
        if (this.lifetime >= this.maxLifetime) {
            this.timeout();
        }
    }

    /**
     * 更新侵蚀状态
     */
    updateCorrupting(deltaTime) {
        this.corruptionProgress += this.corruptionSpeed * deltaTime;

        if (this.corruptionProgress >= 1) {
            // 侵蚀完成
            this.state = VirusState.IDLE;
        }
    }

    /**
     * 更新死亡动画
     */
    updateDying(deltaTime) {
        this.scale = Utils.lerp(this.scale, 0, deltaTime * 10);
        this.alpha = Utils.lerp(this.alpha, 0, deltaTime * 10);
        this.rotation += deltaTime * 10;

        if (this.scale <= 0.05) {
            this.state = VirusState.DEAD;
        }
    }

    /**
     * 更新动画
     */
    updateAnimation(deltaTime) {
        // 旋转
        if (this.type === VirusType.FAST) {
            this.rotation += deltaTime * 2;
        }
    }

    /**
     * 处理点击
     */
    handleClick() {
        if (this.state !== VirusState.IDLE && this.state !== VirusState.CORRUPTING) {
            return { hit: false };
        }

        this.clickCount++;

        if (this.clickCount >= this.requiredClicks) {
            // 击杀
            this.kill();

            return {
                hit: true,
                killed: true,
                score: this.score,
                hasPowerup: this.hasPowerup,
                type: this.type
            };
        } else {
            // 未击杀（坦克病毒）
            this.scale = 1.2;
            audioManager.play('click');

            return {
                hit: true,
                killed: false,
                clicksRemaining: this.requiredClicks - this.clickCount
            };
        }
    }

    /**
     * 击杀病毒
     */
    kill() {
        this.state = VirusState.DYING;
        audioManager.play('click');
    }

    /**
     * 超时处理
     */
    timeout() {
        // 变成坏死像素
        this.state = VirusState.DEAD;

        // 返回惩罚信息
        return {
            timeout: true,
            penalty: this.type === VirusType.DECOY ? 0 : -5, // 迷惑病毒超时不惩罚
            corruptionArea: this.getCorruptionArea()
        };
    }

    /**
     * 获取侵蚀区域
     */
    getCorruptionArea() {
        // 使用增长后的大小，而不是初始大小
        const growthScale = this.currentGrowth || 1;
        const actualSize = this.size * growthScale;

        return {
            x: this.x - actualSize / 2,
            y: this.y - actualSize / 2,
            width: actualSize,
            height: actualSize
        };
    }

    /**
     * 检测点是否在病毒内
     */
    containsPoint(px, py) {
        const growthScale = this.currentGrowth || 1;
        const distance = Utils.distance(px, py, this.x, this.y);
        return distance <= (this.size / 2) * growthScale;
    }

    /**
     * 渲染病毒
     */
    render(ctx) {
        if (this.state === VirusState.DEAD) return;

        ctx.save();

        // 应用变换
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // 应用增长效果
        const growthScale = this.currentGrowth || 1;
        ctx.scale(this.scale * growthScale, this.scale * growthScale);
        ctx.globalAlpha = this.alpha;

        // 绘制道具光环
        if (this.hasPowerup) {
            this.renderPowerupGlow(ctx);
        }

        // 绘制病毒主体
        this.renderBody(ctx);

        // 绘制侵蚀效果
        if (this.state === VirusState.CORRUPTING) {
            this.renderCorruption(ctx);
        }

        // 绘制点击计数（坦克病毒）
        if (this.type === VirusType.TANK && this.clickCount > 0) {
            this.renderClickCount(ctx);
        }

        ctx.restore();
    }

    /**
     * 渲染道具光环
     */
    renderPowerupGlow(ctx) {
        const glowSize = Math.max(0, this.size * 1.5 + Math.sin(this.powerupGlow) * 10);

        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(this.powerupGlow) * 0.2;

        // 确保光环大小不为负
        if (glowSize > 0) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 渲染病毒主体
     */
    renderBody(ctx) {
        const halfSize = this.size / 2;

        // 脉动效果
        const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;
        const currentSize = this.size * pulse;

        // 根据类型绘制不同形状
        switch (this.type) {
            case VirusType.NORMAL:
                this.renderNormalVirus(ctx, currentSize);
                break;

            case VirusType.DECOY:
                this.renderDecoyVirus(ctx, currentSize);
                break;

            case VirusType.FAST:
                this.renderFastVirus(ctx, currentSize);
                break;

            case VirusType.TANK:
                this.renderTankVirus(ctx, currentSize);
                break;

            case VirusType.BOSS:
                this.renderBossVirus(ctx, currentSize);
                break;
        }
    }

    /**
     * 渲染普通病毒
     */
    renderNormalVirus(ctx, size) {
        const halfSize = size / 2;

        // 外发光
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        // 主体（像素块）
        ctx.fillStyle = this.color;
        ctx.fillRect(-halfSize, -halfSize, size, size);

        // 内部纹理
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-halfSize + 4, -halfSize + 4, size / 3, size / 3);

        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.fillRect(-halfSize + size * 0.25, -halfSize + size * 0.3, size * 0.15, size * 0.15);
        ctx.fillRect(-halfSize + size * 0.6, -halfSize + size * 0.3, size * 0.15, size * 0.15);

        ctx.shadowBlur = 0;
    }

    /**
     * 渲染迷惑病毒
     */
    renderDecoyVirus(ctx, size) {
        const halfSize = size / 2;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // 圆角矩形
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-halfSize, -halfSize, size, size, 8);
        ctx.fill();

        // 文件图标样式
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-halfSize + 6, -halfSize + 6, size - 12, size * 0.6);

        // 横线（模拟文件内容）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-halfSize + 10, -halfSize + size * 0.7 + i * 6, size - 20, 3);
        }

        ctx.shadowBlur = 0;
    }

    /**
     * 渲染快速病毒
     */
    renderFastVirus(ctx, size) {
        const halfSize = size / 2;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 25;

        // 三角形
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize, halfSize);
        ctx.lineTo(-halfSize, halfSize);
        ctx.closePath();
        ctx.fill();

        // 速度线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-halfSize - 10, 0);
        ctx.lineTo(-halfSize - 20, 0);
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    /**
     * 渲染坦克病毒
     */
    renderTankVirus(ctx, size) {
        const halfSize = size / 2;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 30;

        // 六边形
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = Math.cos(angle) * halfSize;
            const y = Math.sin(angle) * halfSize;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        // 装甲纹理
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    /**
     * 渲染Boss病毒
     */
    renderBossVirus(ctx, size) {
        const halfSize = size / 2;

        ctx.shadowColor = this.color;
        ctx.shadowBlur = 40;

        // 多层结构
        for (let i = 3; i >= 0; i--) {
            const layerSize = size * (0.3 + i * 0.2);
            const layerHalf = layerSize / 2;

            ctx.fillStyle = i % 2 === 0 ? this.color : '#000';
            ctx.fillRect(-layerHalf, -layerHalf, layerSize, layerSize);
        }

        // Boss标记
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${size * 0.3}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('BOSS', 0, 0);

        ctx.shadowBlur = 0;
    }

    /**
     * 渲染侵蚀效果
     */
    renderCorruption(ctx) {
        const progress = this.corruptionProgress;
        const size = this.size * (1 + progress);

        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - progress);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.restore();
    }

    /**
     * 渲染点击计数
     */
    renderClickCount(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${this.size * 0.4}px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.requiredClicks - this.clickCount}`, 0, 0);
    }

    /**
     * 是否存活
     */
    isAlive() {
        return this.state !== VirusState.DEAD;
    }
}

/**
 * 病毒管理器
 */
class VirusManager {
    constructor() {
        this.viruses = [];
        this.corruptionAreas = []; // 坏死区域
        this.totalCorruption = 0;  // 总污染度
        this.spawnTimer = 0;
        this.spawnInterval = 2;    // 生成间隔（秒）
        this.maxViruses = 10;      // 最大病毒数量
        this.level = 1;
        this.isWaveMode = false;   // 围城模式
        this.waveTimer = 0;
    }

    /**
     * 更新所有病毒
     */
    update(deltaTime, canvasWidth, canvasHeight) {
        // 更新生成计时器
        this.spawnTimer += deltaTime;

        // 动态调整生成间隔
        const dynamicInterval = Math.max(0.5, this.spawnInterval - this.level * 0.1);

        if (this.spawnTimer >= dynamicInterval && this.viruses.length < this.maxViruses) {
            this.spawnVirus(canvasWidth, canvasHeight);
            this.spawnTimer = 0;
        }

        // 更新围城模式
        if (this.isWaveMode) {
            this.updateWaveMode(deltaTime, canvasWidth, canvasHeight);
        }

        // 更新所有病毒
        const deadViruses = [];
        this.viruses = this.viruses.filter(virus => {
            virus.update(deltaTime);

            if (!virus.isAlive()) {
                deadViruses.push(virus);
                return false;
            }

            return true;
        });

        // 处理死亡病毒
        deadViruses.forEach(virus => {
            if (virus.lifetime >= virus.maxLifetime) {
                const result = virus.timeout();
                if (result.corruptionArea) {
                    this.addCorruptionArea(result.corruptionArea);
                }
            }
        });

        // 计算总污染度
        this.calculateCorruption(canvasWidth, canvasHeight);
    }

    /**
     * 生成病毒
     */
    spawnVirus(canvasWidth, canvasHeight, fromEdge = false) {
        let x, y;
        let attempts = 0;
        const maxAttempts = 10; // 最大尝试次数

        do {
            if (fromEdge && this.isWaveMode) {
                // 从边缘生成
                const edge = Utils.randomInt(0, 3);
                switch (edge) {
                    case 0: // 上
                        x = Utils.random(50, canvasWidth - 50);
                        y = -50;
                        break;
                    case 1: // 下
                        x = Utils.random(50, canvasWidth - 50);
                        y = canvasHeight + 50;
                        break;
                    case 2: // 左
                        x = -50;
                        y = Utils.random(50, canvasHeight - 50);
                        break;
                    case 3: // 右
                        x = canvasWidth + 50;
                        y = Utils.random(50, canvasHeight - 50);
                        break;
                }
            } else {
                // 随机位置
                x = Utils.random(50, canvasWidth - 50);
                y = Utils.random(100, canvasHeight - 100);
            }

            attempts++;
        } while (this.isOverlappingCorruption(x, y) && attempts < maxAttempts);

        // 如果所有尝试都失败，使用最后一次的位置（边缘生成时可能无法避免）
        // 根据关卡选择病毒类型
        const type = this.selectVirusType();

        const virus = new Virus(x, y, type, this.level);

        // 如果是从边缘生成，设置移动
        if (fromEdge) {
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const angle = Math.atan2(centerY - y, centerX - x);
            virus.vx = Math.cos(angle) * 50;
            virus.vy = Math.sin(angle) * 50;
            virus.isMoving = true;
        }

        this.viruses.push(virus);
        audioManager.play('virusSpawn');

        return virus;
    }

    /**
     * 检查位置是否与坏死区域重叠
     */
    isOverlappingCorruption(x, y) {
        // 病毒的大致大小（使用最大可能的大小）
        const virusSize = 200; // Boss病毒的最大大小

        for (const area of this.corruptionAreas) {
            // 检查病毒区域是否与坏死区域重叠
            const virusLeft = x - virusSize / 2;
            const virusRight = x + virusSize / 2;
            const virusTop = y - virusSize / 2;
            const virusBottom = y + virusSize / 2;

            const areaLeft = area.x;
            const areaRight = area.x + area.width;
            const areaTop = area.y;
            const areaBottom = area.y + area.height;

            // 矩形碰撞检测
            if (virusRight > areaLeft &&
                virusLeft < areaRight &&
                virusBottom > areaTop &&
                virusTop < areaBottom) {
                return true;
            }
        }

        return false;
    }

    /**
     * 选择病毒类型
     */
    selectVirusType() {
        const rand = Math.random();

        switch (this.level) {
            case 1:
                return VirusType.NORMAL;

            case 2:
                if (rand < 0.6) return VirusType.NORMAL;
                if (rand < 0.8) return VirusType.DECOY;
                return VirusType.FAST;

            case 3:
                if (rand < 0.4) return VirusType.NORMAL;
                if (rand < 0.6) return VirusType.DECOY;
                if (rand < 0.8) return VirusType.FAST;
                if (rand < 0.95) return VirusType.TANK;
                return VirusType.BOSS;

            default:
                if (rand < 0.3) return VirusType.NORMAL;
                if (rand < 0.5) return VirusType.DECOY;
                if (rand < 0.7) return VirusType.FAST;
                if (rand < 0.9) return VirusType.TANK;
                return VirusType.BOSS;
        }
    }

    /**
     * 更新围城模式
     */
    updateWaveMode(deltaTime, canvasWidth, canvasHeight) {
        this.waveTimer += deltaTime;

        // 每2秒从边缘生成一波
        if (this.waveTimer >= 2) {
            const waveSize = Utils.randomInt(2, 4);
            for (let i = 0; i < waveSize; i++) {
                this.spawnVirus(canvasWidth, canvasHeight, true);
            }
            this.waveTimer = 0;
        }
    }

    /**
     * 处理点击
     */
    handleClick(x, y) {
        // 从后往前遍历（后渲染的在上面）
        for (let i = this.viruses.length - 1; i >= 0; i--) {
            const virus = this.viruses[i];

            if (virus.containsPoint(x, y)) {
                const result = virus.handleClick();

                if (result.hit) {
                    return {
                        ...result,
                        virus: virus,
                        position: { x: virus.x, y: virus.y }
                    };
                }
            }
        }

        return null;
    }

    /**
     * 添加坏死区域
     */
    addCorruptionArea(area) {
        this.corruptionAreas.push({
            ...area,
            alpha: 1,
            timestamp: Date.now()
        });
    }

    /**
     * 计算总污染度
     */
    calculateCorruption(canvasWidth, canvasHeight) {
        const totalArea = canvasWidth * canvasHeight;
        let corruptedArea = 0;

        // 计算病毒占据的面积
        this.viruses.forEach(virus => {
            corruptedArea += virus.size * virus.size;
        });

        // 计算坏死区域面积
        this.corruptionAreas.forEach(area => {
            corruptedArea += area.width * area.height;
        });

        this.totalCorruption = Math.min(1, corruptedArea / totalArea);

        return this.totalCorruption;
    }

    /**
     * 清除所有病毒（逻辑炸弹）
     */
    clearAllViruses() {
        const cleared = [];

        this.viruses = this.viruses.filter(virus => {
            if (virus.type !== VirusType.DECOY) {
                virus.kill();
                cleared.push(virus);
                return false;
            }
            return true;
        });

        return cleared;
    }

    /**
     * 渲染所有病毒
     */
    render(ctx) {
        // 渲染坏死区域
        this.corruptionAreas.forEach(area => {
            ctx.save();
            ctx.globalAlpha = area.alpha;
            ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
            ctx.fillRect(area.x, area.y, area.width, area.height);

            // 像素化效果
            ctx.strokeStyle = 'rgba(100, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(area.x, area.y, area.width, area.height);
            ctx.restore();
        });

        // 渲染病毒
        this.viruses.forEach(virus => {
            virus.render(ctx);
        });
    }

    /**
     * 设置关卡
     */
    setLevel(level) {
        this.level = level;
        this.maxViruses = 10 + level * 2;
        this.spawnInterval = Math.max(1, 2 - level * 0.2);

        // 第二关及以后启用围城模式
        if (level >= 2) {
            this.isWaveMode = true;
        }
    }

    /**
     * 重置
     */
    reset() {
        this.viruses = [];
        this.corruptionAreas = [];
        this.totalCorruption = 0;
        this.spawnTimer = 0;
        this.waveTimer = 0;
    }

    /**
     * 获取病毒数量
     */
    getCount() {
        return this.viruses.length;
    }
}
