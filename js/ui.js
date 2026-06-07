/**
 * UI系统
 * 管理游戏界面、菜单、结算、排行榜等
 */

/**
 * UI状态枚举
 */
const UIState = {
    LOADING: 'loading',
    INTRO: 'intro',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory',
    LEADERBOARD: 'leaderboard'
};

/**
 * UI管理器
 */
class UIManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.state = UIState.LOADING;

        // UI元素
        this.buttons = [];
        this.modals = [];

        // 动画
        this.fadeAlpha = 0;
        this.fadeTarget = 0;

        // 排行榜数据
        this.leaderboard = this.loadLeaderboard();

        // 响应式字体（根据屏幕大小动态调整）
        this.updateFonts();
    }

    /**
     * 更新字体大小（响应式）
     */
    updateFonts() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const minDim = Math.min(width, height);

        // 根据最小维度计算缩放比例
        const scale = minDim / 400; // 400px为基准

        this.fonts = {
            title: `bold ${Math.floor(48 * scale)}px "Courier New", monospace`,
            subtitle: `${Math.floor(24 * scale)}px "Courier New", monospace`,
            normal: `${Math.floor(18 * scale)}px "Courier New", monospace`,
            small: `${Math.floor(14 * scale)}px "Courier New", monospace`
        };

        // 存储缩放比例供其他方法使用
        this.scale = Math.max(0.6, Math.min(1.2, scale));
    }

    /**
     * 设置UI状态
     */
    setState(state) {
        this.state = state;
        this.buttons = [];
        this.updateFonts(); // 每次状态变化时更新字体
        this.setupUI();
    }

    /**
     * 设置UI
     */
    setupUI() {
        switch (this.state) {
            case UIState.MENU:
                this.setupMenuUI();
                break;
            case UIState.PAUSED:
                this.setupPausedUI();
                break;
            case UIState.LEVEL_COMPLETE:
                this.setupLevelCompleteUI();
                break;
            case UIState.GAME_OVER:
                this.setupGameOverUI();
                break;
            case UIState.VICTORY:
                this.setupVictoryUI();
                break;
            case UIState.LEADERBOARD:
                this.setupLeaderboardUI();
                break;
        }
    }

    /**
     * 获取响应式按钮尺寸
     */
    getButtonSize() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 按钮宽度：屏幕宽度的45%，最小140px，最大240px
        const buttonWidth = Math.max(140, Math.min(240, width * 0.45));
        // 按钮高度：屏幕高度的7%，最小44px，最大60px
        const buttonHeight = Math.max(44, Math.min(60, height * 0.07));

        return { width: buttonWidth, height: buttonHeight };
    }

    /**
     * 设置主菜单UI
     */
    setupMenuUI() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const btnSize = this.getButtonSize();
        const spacing = btnSize.height + 15; // 按钮间距

        this.buttons = [
            {
                id: 'start',
                x: centerX - btnSize.width / 2,
                y: centerY + 50 * this.scale,
                width: btnSize.width,
                height: btnSize.height,
                text: '开始游戏',
                action: () => 'start'
            },
            {
                id: 'leaderboard',
                x: centerX - btnSize.width / 2,
                y: centerY + 50 * this.scale + spacing,
                width: btnSize.width,
                height: btnSize.height,
                text: '排行榜',
                action: () => 'leaderboard'
            }
        ];
    }

    /**
     * 设置暂停UI
     */
    setupPausedUI() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const btnSize = this.getButtonSize();
        const spacing = btnSize.height + 15;

        this.buttons = [
            {
                id: 'resume',
                x: centerX - btnSize.width / 2,
                y: centerY - spacing,
                width: btnSize.width,
                height: btnSize.height,
                text: '继续游戏',
                action: () => 'resume'
            },
            {
                id: 'restart',
                x: centerX - btnSize.width / 2,
                y: centerY,
                width: btnSize.width,
                height: btnSize.height,
                text: '重新开始',
                action: () => 'restart'
            },
            {
                id: 'quit',
                x: centerX - btnSize.width / 2,
                y: centerY + spacing,
                width: btnSize.width,
                height: btnSize.height,
                text: '返回菜单',
                action: () => 'quit'
            }
        ];
    }

    /**
     * 设置关卡完成UI
     */
    setupLevelCompleteUI() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const btnSize = this.getButtonSize();

        this.buttons = [
            {
                id: 'next',
                x: centerX - btnSize.width / 2,
                y: centerY + 80 * this.scale,
                width: btnSize.width,
                height: btnSize.height,
                text: '下一关',
                action: () => 'next'
            }
        ];
    }

    /**
     * 设置游戏失败UI
     */
    setupGameOverUI() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const btnSize = this.getButtonSize();
        const spacing = btnSize.height + 15;

        this.buttons = [
            {
                id: 'retry',
                x: centerX - btnSize.width / 2,
                y: centerY + 30 * this.scale,
                width: btnSize.width,
                height: btnSize.height,
                text: '重新挑战',
                action: () => 'retry'
            },
            {
                id: 'menu',
                x: centerX - btnSize.width / 2,
                y: centerY + 30 * this.scale + spacing,
                width: btnSize.width,
                height: btnSize.height,
                text: '返回菜单',
                action: () => 'menu'
            }
        ];
    }

    /**
     * 设置胜利UI
     */
    setupVictoryUI() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const btnSize = this.getButtonSize();

        this.buttons = [
            {
                id: 'menu',
                x: centerX - btnSize.width / 2,
                y: centerY + 120 * this.scale,
                width: btnSize.width,
                height: btnSize.height,
                text: '返回菜单',
                action: () => 'menu'
            }
        ];
    }

    /**
     * 设置排行榜UI
     */
    setupLeaderboardUI() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const btnSize = this.getButtonSize();

        this.buttons = [
            {
                id: 'back',
                x: centerX - btnSize.width / 2,
                y: centerY + 150 * this.scale,
                width: btnSize.width,
                height: btnSize.height,
                text: '返回',
                action: () => 'back'
            }
        ];
    }

    /**
     * 处理点击
     */
    handleClick(x, y) {
        for (const button of this.buttons) {
            if (Utils.pointInRect(x, y, button.x, button.y, button.width, button.height)) {
                audioManager.play('menuClick');
                return button.action();
            }
        }
        return null;
    }

    /**
     * 渲染UI
     */
    render(gameState) {
        switch (this.state) {
            case UIState.INTRO:
                this.renderIntro(gameState);
                break;
            case UIState.MENU:
                this.renderMenu();
                break;
            case UIState.PLAYING:
                this.renderPlayingUI(gameState);
                break;
            case UIState.PAUSED:
                this.renderPaused();
                break;
            case UIState.LEVEL_COMPLETE:
                this.renderLevelComplete(gameState);
                break;
            case UIState.GAME_OVER:
                this.renderGameOver(gameState);
                break;
            case UIState.VICTORY:
                this.renderVictory(gameState);
                break;
            case UIState.LEADERBOARD:
                this.renderLeaderboard();
                break;
        }
    }

    /**
     * 渲染导入动画
     */
    renderIntro(gameState) {
        // 由IntroAnimation类处理
    }

    /**
     * 渲染主菜单
     */
    renderMenu() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 动态背景
        const time = Date.now() / 1000;

        // 渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#050510');
        gradient.addColorStop(1, '#000005');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 像素化网格背景（动态闪烁）
        ctx.strokeStyle = `rgba(0, ${100 + Math.sin(time) * 50}, 0, 0.08)`;
        ctx.lineWidth = 1;
        const gridSize = 15 * this.scale;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 漂浮的像素粒子
        this.renderFloatingPixels(ctx, width, height, time);

        // 标题区域
        ctx.save();

        // 主标题 - 像素风格
        const titleY = height / 2 - 80 * this.scale;

        // 外层发光
        ctx.shadowColor = '#0f0';
        ctx.shadowBlur = 20 * this.scale;

        ctx.fillStyle = '#0f0';
        ctx.font = this.fonts.title;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 故障效果动画
        const glitchOffset = Math.sin(time * 3) * 4 * this.scale;
        const glitchOffset2 = Math.sin(time * 5) * 3 * this.scale;

        // 主标题
        ctx.fillText('像素侵入', width / 2, titleY);

        // 故障重影
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#f00';
        ctx.fillText('像素侵入', width / 2 + glitchOffset, titleY);
        ctx.fillStyle = '#0ff';
        ctx.fillText('像素侵入', width / 2 - glitchOffset2, titleY);

        ctx.globalAlpha = 1;

        // 副标题
        ctx.shadowColor = '#f00';
        ctx.shadowBlur = 15 * this.scale;
        ctx.fillStyle = '#f00';
        ctx.font = this.fonts.subtitle;
        ctx.fillText('SYSTEM DEFENSE', width / 2, titleY + 60 * this.scale);

        ctx.restore();

        // 按钮
        this.renderButtons();

        // 版本信息
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = this.fonts.small;
        ctx.textAlign = 'center';
        ctx.fillText('v1.0.0 | OFFLINE HTML5 GAME', width / 2, height - 25 * this.scale);
    }

    /**
     * 渲染漂浮像素粒子
     */
    renderFloatingPixels(ctx, width, height, time) {
        const pixelCount = 30;

        for (let i = 0; i < pixelCount; i++) {
            const seed = i * 137;
            const x = (seed * 7 + Math.sin(time + seed) * 50) % width;
            const y = (seed * 11 + Math.cos(time * 0.5 + seed) * 30) % height;
            const size = 2 + Math.sin(time + seed) * 2;
            const alpha = 0.2 + Math.sin(time * 2 + seed) * 0.15;

            ctx.fillStyle = `rgba(0, ${150 + Math.sin(time + seed) * 100}, 0, ${alpha})`;
            ctx.fillRect(x, y, size * this.scale, size * this.scale);
        }
    }

    /**
     * 渲染游戏内UI
     */
    renderPlayingUI(gameState) {
        const ctx = this.ctx;
        const width = this.canvas.width;

        // 顶部信息栏
        this.renderTopBar(gameState);

        // 道具栏
        this.renderPowerups(gameState.powerups);

        // 警报效果
        if (gameState.alertLevel > 0) {
            this.renderAlert(gameState.alertLevel);
        }

    }

    /**
     * 渲染顶部信息栏
     */
    renderTopBar(gameState) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const topBarHeight = Math.max(50, Math.min(60, height * 0.08));

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, topBarHeight);

        // 字体大小根据屏幕调整
        const fontSize = Math.max(16, Math.floor(24 * this.scale));
        ctx.font = `bold ${fontSize}px "Courier New", monospace`;

        // 分数
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'left';
        ctx.fillText(`分数: ${Utils.formatNumber(gameState.score)}`, 15, topBarHeight * 0.65);

        // 时间
        const timeColor = gameState.remainingTime < 30 ? '#f00' :
            gameState.remainingTime < 60 ? '#ff0' : '#0f0';
        ctx.fillStyle = timeColor;
        ctx.textAlign = 'center';
        ctx.fillText(Utils.formatTime(gameState.remainingTime), width / 2, topBarHeight * 0.65);

        // 污染度
        const corruptionColor = gameState.corruption > 0.8 ? '#f00' :
            gameState.corruption > 0.6 ? '#ff0' : '#0f0';
        ctx.fillStyle = corruptionColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.floor(gameState.corruption * 100)}%`, width - 15, topBarHeight * 0.65);

        // 关卡名称
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = this.fonts.small;
        ctx.textAlign = 'center';
        ctx.fillText(gameState.levelName, width / 2, topBarHeight * 0.9);
    }

    /**
     * 渲染道具栏
     */
    renderPowerups(powerups) {
        if (!powerups || powerups.length === 0) return;

        const ctx = this.ctx;
        const height = this.canvas.height;
        const width = this.canvas.width;

        // 道具大小根据屏幕调整
        const size = Math.max(40, Math.min(55, Math.min(width, height) * 0.12));
        const spacing = Math.max(5, size * 0.2);
        const startX = 15;
        const y = height - size - 25; // 底部留出安全距离

        powerups.forEach((powerup, index) => {
            const x = startX + index * (size + spacing);

            // 背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x, y, size, size);

            // 图标
            ctx.fillStyle = powerup.color;
            ctx.font = `bold ${Math.floor(size * 0.5)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(powerup.icon, x + size / 2, y + size / 2);

            // 数量
            if (powerup.count > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.floor(size * 0.25)}px Arial`;
                ctx.fillText(powerup.count.toString(), x + size - 8, y + size - 8);
            }

            // 边框
            ctx.strokeStyle = powerup.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, size, size);
        });
    }

    /**
     * 渲染警报效果
     */
    renderAlert(alertLevel) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 闪烁效果
        const flash = Math.sin(Date.now() / (alertLevel === 2 ? 80 : 150)) > 0;

        if (flash) {
            // 像素化警报效果
            const blockSize = 10 * this.scale;
            const color = alertLevel === 2 ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 0, 0.15)';

            for (let x = 0; x < width; x += blockSize * 2) {
                for (let y = 0; y < height; y += blockSize * 2) {
                    if ((Math.floor(x / blockSize) + Math.floor(y / blockSize)) % 2 === 0) {
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, blockSize, blockSize);
                    }
                }
            }
        }

        // 警报文字
        ctx.save();
        ctx.fillStyle = alertLevel === 2 ? '#f00' : '#ff0';
        ctx.font = `bold ${Math.floor(20 * this.scale)}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.9;

        // 文字闪烁效果
        const textAlpha = 0.7 + Math.sin(Date.now() / 100) * 0.3;
        ctx.globalAlpha = textAlpha;

        // 文字发光
        ctx.shadowColor = alertLevel === 2 ? '#f00' : '#ff0';
        ctx.shadowBlur = 15 * this.scale;

        const text = alertLevel === 2 ? 'SYSTEM ALERT' : 'WARNING';
        ctx.fillText(text, width / 2, 80 * this.scale);
        ctx.restore();
    }

    /**
     * 渲染暂停界面
     */
    renderPaused() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = this.fonts.title;
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', width / 2, height / 2 - 100);

        // 按钮
        this.renderButtons();
    }

    /**
     * 渲染关卡完成界面
     */
    renderLevelComplete(gameState) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const stats = gameState.levelStats;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.fillStyle = '#0f0';
        ctx.font = this.fonts.title;
        ctx.textAlign = 'center';
        ctx.fillText('关卡完成', width / 2, 100);

        // 关卡名称
        ctx.fillStyle = '#fff';
        ctx.font = this.fonts.subtitle;
        ctx.fillText(stats.levelName, width / 2, 150);

        // 统计信息
        const statsY = 200;
        const lineHeight = 35;

        ctx.font = this.fonts.normal;
        ctx.textAlign = 'left';

        const statsData = [
            { label: '击杀数', value: stats.kills },
            { label: '最高连击', value: stats.maxCombo },
            { label: '基础得分', value: stats.score },
            { label: '时间奖励', value: `+${stats.timeBonus}` },
            { label: '总分', value: stats.totalScore, highlight: true }
        ];

        statsData.forEach((item, index) => {
            const y = statsY + index * lineHeight;

            ctx.fillStyle = item.highlight ? '#ff0' : '#fff';
            ctx.fillText(item.label, width / 2 - 120, y);
            ctx.textAlign = 'right';
            ctx.fillText(Utils.formatNumber(item.value), width / 2 + 120, y);
            ctx.textAlign = 'left';
        });

        // 按钮
        this.renderButtons();
    }

    /**
     * 渲染游戏失败界面
     */
    renderGameOver(gameState) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 获取当前关卡信息
        const currentLevel = gameState && gameState.currentLevel;
        let failureMessage = '';
        let titleText = '系统崩溃';

        if (currentLevel) {
            switch (currentLevel.type) {
                case LevelType.DOCUMENT:
                    failureMessage = '你的毕业论文内容清空了';
                    titleText = '文档丢失';
                    break;
                case LevelType.DESKTOP:
                    failureMessage = '你的毕业论文文件被永久删除';
                    titleText = '文件删除';
                    break;
                case LevelType.BSOD:
                    failureMessage = '你的电脑已崩溃';
                    titleText = '系统崩溃';
                    break;
                default:
                    failureMessage = '系统崩溃';
                    titleText = '系统崩溃';
            }
        } else {
            failureMessage = '系统崩溃';
            titleText = '系统崩溃';
        }

        // 背景
        ctx.fillStyle = 'rgba(50, 0, 0, 0.95)';
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.fillStyle = '#f00';
        ctx.font = this.fonts.title;
        ctx.textAlign = 'center';
        ctx.fillText(titleText, width / 2, height / 2 - 120);

        // 副标题
        ctx.fillStyle = '#fff';
        ctx.font = this.fonts.subtitle;
        ctx.fillText('GAME OVER', width / 2, height / 2 - 70);

        // 失败消息
        ctx.fillStyle = '#ff6666';
        ctx.font = this.fonts.normal;
        ctx.fillText(failureMessage, width / 2, height / 2 - 20);

        // 最终得分
        if (gameState && gameState.levelStats) {
            ctx.font = this.fonts.normal;
            ctx.fillStyle = '#fff';
            ctx.fillText(`最终得分: ${Utils.formatNumber(gameState.levelStats.totalScore)}`, width / 2, height / 2 + 30);
        }

        // 按钮
        this.renderButtons();
    }

    /**
     * 渲染胜利界面
     */
    renderVictory(gameState) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const stats = gameState.totalStats;

        // 背景
        ctx.fillStyle = 'rgba(0, 50, 0, 0.95)';
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.fillStyle = '#0f0';
        ctx.font = this.fonts.title;
        ctx.textAlign = 'center';
        ctx.fillText('系统已修复', width / 2, 80);

        ctx.fillStyle = '#ff0';
        ctx.font = this.fonts.subtitle;
        ctx.fillText('VICTORY!', width / 2, 130);

        // 总统计
        const statsY = 180;
        const lineHeight = 30;

        ctx.font = this.fonts.normal;
        ctx.textAlign = 'left';

        const statsData = [
            { label: '总得分', value: stats.totalScore, highlight: true },
            { label: '总击杀', value: stats.totalKills },
            { label: '最高连击', value: stats.totalMaxCombo },
            { label: '完成关卡', value: `${stats.levelsCompleted}/3` }
        ];

        statsData.forEach((item, index) => {
            const y = statsY + index * lineHeight;

            ctx.fillStyle = item.highlight ? '#ff0' : '#fff';
            ctx.fillText(item.label, width / 2 - 100, y);
            ctx.textAlign = 'right';
            ctx.fillText(Utils.formatNumber(item.value), width / 2 + 100, y);
            ctx.textAlign = 'left';
        });

        // 上传提示
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = this.fonts.small;
        ctx.textAlign = 'center';
        ctx.fillText('正在上传至全球防御网络...', width / 2, height / 2 + 50);

        // 按钮
        this.renderButtons();
    }

    /**
     * 渲染排行榜
     */
    renderLeaderboard() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // 背景
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.fillStyle = '#0f0';
        ctx.font = this.fonts.title;
        ctx.textAlign = 'center';
        ctx.fillText('排行榜', width / 2, 80);

        // 排行榜列表
        const startY = 130;
        const lineHeight = 40;

        ctx.font = this.fonts.normal;

        if (this.leaderboard.length === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText('暂无记录', width / 2, startY);
        } else {
            this.leaderboard.forEach((entry, index) => {
                const y = startY + index * lineHeight;

                // 排名
                ctx.fillStyle = index < 3 ? '#ff0' : '#fff';
                ctx.textAlign = 'left';
                ctx.fillText(`${index + 1}.`, 50, y);

                // 分数
                ctx.textAlign = 'center';
                ctx.fillText(Utils.formatNumber(entry.score), width / 2, y);

                // 日期
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.textAlign = 'right';
                ctx.fillText(entry.date, width - 50, y);
            });
        }

        // 按钮
        this.renderButtons();
    }

    /**
     * 渲染按钮
     */
    renderButtons() {
        const ctx = this.ctx;

        this.buttons.forEach((button) => {
            // 按钮背景（像素风格边框）
            const borderWidth = 3 * this.scale;
            const innerX = button.x + borderWidth;
            const innerY = button.y + borderWidth;
            const innerWidth = button.width - borderWidth * 2;
            const innerHeight = button.height - borderWidth * 2;

            // 外边框
            ctx.fillStyle = '#0f0';
            ctx.fillRect(button.x, button.y, button.width, borderWidth);
            ctx.fillRect(button.x, button.y + borderWidth, borderWidth, button.height - borderWidth * 2);
            ctx.fillRect(button.x + button.width - borderWidth, button.y + borderWidth, borderWidth, button.height - borderWidth * 2);
            ctx.fillRect(button.x, button.y + button.height - borderWidth, button.width, borderWidth);

            // 内部填充
            ctx.fillStyle = 'rgba(0, 30, 0, 0.8)';
            ctx.fillRect(innerX, innerY, innerWidth, innerHeight);

            // 按钮文字
            ctx.fillStyle = '#0f0';
            ctx.font = this.fonts.normal;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 文字发光效果
            ctx.shadowColor = '#0f0';
            ctx.shadowBlur = 10 * this.scale;

            ctx.fillText(button.text,
                button.x + button.width / 2,
                button.y + button.height / 2);
        });
    }

    /**
     * 加载排行榜
     */
    loadLeaderboard() {
        return Utils.storage.get('pixelInvasion_leaderboard', []);
    }

    /**
     * 保存排行榜
     */
    saveLeaderboard(score) {
        const entry = {
            score: score,
            date: new Date().toLocaleDateString('zh-CN')
        };

        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // 只保留前10名

        Utils.storage.set('pixelInvasion_leaderboard', this.leaderboard);
    }

    /**
     * 更新淡入淡出
     */
    updateFade(deltaTime) {
        if (this.fadeAlpha !== this.fadeTarget) {
            const speed = 3;
            if (this.fadeAlpha < this.fadeTarget) {
                this.fadeAlpha = Math.min(this.fadeAlpha + speed * deltaTime, this.fadeTarget);
            } else {
                this.fadeAlpha = Math.max(this.fadeAlpha - speed * deltaTime, this.fadeTarget);
            }
        }
    }

    /**
     * 渲染淡入淡出
     */
    renderFade() {
        if (this.fadeAlpha > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * 开始淡入
     */
    fadeIn() {
        this.fadeAlpha = 1;
        this.fadeTarget = 0;
    }

    /**
     * 开始淡出
     */
    fadeOut() {
        this.fadeAlpha = 0;
        this.fadeTarget = 1;
    }
}


