/**
 * 关卡系统
 * 管理三大关卡：文档保卫战、桌面封锁线、蓝屏核心
 */

/**
 * 关卡类型枚举
 */
const LevelType = {
    DOCUMENT: 1,    // 第一关：文档保卫战
    DESKTOP: 2,     // 第二关：桌面封锁线
    BSOD: 3         // 第三关：蓝屏核心
};

/**
 * 关卡配置
 */
const LevelConfig = {
    [LevelType.DOCUMENT]: {
        name: '文档保卫战',
        subtitle: 'The Document',
        duration: 20,               // 20秒
        background: 'document',
        virusTypes: [VirusType.NORMAL],
        maxViruses: 25,             // 大幅增加病毒数量
        spawnInterval: 0.3,         // 大幅减少生成间隔，病毒出现更快
        description: '保护你的毕业论文不被病毒侵蚀！',
        tip: '点击红色病毒块即可消灭它们'
    },
    [LevelType.DESKTOP]: {
        name: '桌面封锁线',
        subtitle: 'The Desktop',
        duration: 30,
        background: 'desktop',
        virusTypes: [VirusType.NORMAL, VirusType.DECOY, VirusType.FAST],
        maxViruses: 35,             // 大幅增加病毒数量
        spawnInterval: 0.2,         // 大幅减少生成间隔，病毒出现更快
        description: '系统桌面已被封锁，小心伪装病毒！',
        tip: '绿色和蓝色是伪装病毒，点击会扣分！',
        waveMode: true              // 启用围城模式
    },
    [LevelType.BSOD]: {
        name: '蓝屏核心',
        subtitle: 'The BSOD',
        duration: 30,
        background: 'bsod',
        virusTypes: [VirusType.NORMAL, VirusType.DECOY, VirusType.FAST, VirusType.TANK, VirusType.BOSS],
        maxViruses: 45,             // 大幅增加病毒数量
        spawnInterval: 0.15,        // 大幅减少生成间隔，病毒出现更快
        description: '最终决战！系统核心岌岌可危！',
        tip: '像素病毒会逐渐变大！',
        dynamicDifficulty: true     // 动态难度
    }
};

/**
 * 关卡类
 */
class Level {
    constructor(type) {
        this.type = type;
        this.config = LevelConfig[type];

        // 关卡状态
        this.isStarted = false;
        this.isCompleted = false;
        this.isFailed = false;

        // 时间
        this.duration = this.config.duration;
        this.remainingTime = this.duration;

        // 统计
        this.score = 0;
        this.maxCombo = 0;
        this.currentCombo = 0;
        this.comboTimer = 0;
        this.kills = 0;
        this.missed = 0;

        // 警报状态
        this.alertLevel = 0; // 0: 正常, 1: 一级警报, 2: 二级警报
        this.alertTimer = 0;

        // 动态难度（第三关）
        this.difficultyMultiplier = 1;

        // 背景数据
        this.backgroundData = null;
    }

    /**
     * 开始关卡
     */
    start(canvasWidth, canvasHeight) {
        this.isStarted = true;
        this.isCompleted = false;
        this.isFailed = false;
        this.remainingTime = this.duration;
        this.score = 0;
        this.maxCombo = 0;
        this.currentCombo = 0;
        this.kills = 0;
        this.missed = 0;
        this.alertLevel = 0;
        this.difficultyMultiplier = 1;

        // 生成背景数据
        this.generateBackground(canvasWidth, canvasHeight);

        return this;
    }

    /**
     * 更新关卡
     */
    update(deltaTime, virusManager) {
        if (!this.isStarted || this.isCompleted || this.isFailed) return;

        // 更新时间
        this.remainingTime -= deltaTime;

        // 更新连击计时器
        if (this.currentCombo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.currentCombo = 0;
            }
        }

        // 更新动态难度（第三关）
        if (this.config.dynamicDifficulty) {
            this.updateDynamicDifficulty();
        }

        // 更新警报
        this.updateAlert(virusManager);

        // 检查胜利/失败条件
        this.checkWinLoseCondition();
    }

    /**
     * 更新动态难度
     */
    updateDynamicDifficulty() {
        // 剩余时间越少，难度越高
        const timeRatio = this.remainingTime / this.duration;

        if (timeRatio < 0.25) {
            // 最后30秒
            this.difficultyMultiplier = 2.5;
        } else if (timeRatio < 0.5) {
            // 最后60秒
            this.difficultyMultiplier = 2.0;
        } else if (timeRatio < 0.75) {
            // 最后90秒
            this.difficultyMultiplier = 1.5;
        } else {
            this.difficultyMultiplier = 1.0;
        }
    }

    /**
     * 更新警报
     */
    updateAlert(virusManager) {
        const virusCount = virusManager.getCount();

        // 一级警报：时间不足60秒 或 病毒数>5
        if (this.remainingTime < 60 || virusCount > 5) {
            if (this.alertLevel < 1) {
                this.alertLevel = 1;
                audioManager.play('alarm');
            }
        }

        // 二级警报：时间不足30秒 或 病毒数>8
        if (this.remainingTime < 30 || virusCount > 8) {
            if (this.alertLevel < 2) {
                this.alertLevel = 2;
                audioManager.play('alarm');
            }
        }

        // 恢复正常
        if (this.remainingTime >= 60 && virusCount <= 5) {
            this.alertLevel = 0;
        }
    }

    /**
     * 检查胜负条件
     */
    checkWinLoseCondition() {
        // 胜利：时间结束
        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            this.complete();
        }

        // 失败：坏死像素覆盖页面程度达80%
        // 这个检查在游戏引擎中进行，通过virusManager.totalCorruption判断
    }

    /**
     * 添加击杀
     */
    addKill(score, isCombo) {
        this.kills++;

        // 更新连击
        if (isCombo) {
            this.currentCombo++;
            this.comboTimer = 5; // 5秒连击窗口

            if (this.currentCombo > this.maxCombo) {
                this.maxCombo = this.currentCombo;
            }

            // 连击奖励
            if (this.currentCombo >= 3) {
                score *= 2; // 过载模式：分数翻倍
                audioManager.play('overload');
            } else {
                audioManager.play('combo');
            }
        } else {
            this.currentCombo = 1;
            this.comboTimer = 5;
        }

        this.score += score;

        return {
            score: score,
            combo: this.currentCombo,
            isOverload: this.currentCombo >= 3
        };
    }

    /**
     * 添加失误
     */
    addMiss(penalty = 0) {
        this.missed++;
        this.currentCombo = 0;
        this.score += penalty;
    }

    /**
     * 完成关卡
     */
    complete() {
        this.isCompleted = true;
        audioManager.play('levelComplete');
    }

    /**
     * 失败
     */
    fail() {
        this.isFailed = true;
        audioManager.play('gameOver');
    }

    /**
     * 生成背景数据
     */
    generateBackground(canvasWidth, canvasHeight) {
        switch (this.config.background) {
            case 'document':
                this.backgroundData = this.generateDocumentBackground(canvasWidth, canvasHeight);
                break;
            case 'desktop':
                this.backgroundData = this.generateDesktopBackground(canvasWidth, canvasHeight);
                break;
            case 'bsod':
                this.backgroundData = this.generateBSODBackground(canvasWidth, canvasHeight);
                break;
        }
    }

    /**
     * 生成文档背景
     */
    generateDocumentBackground(width, height) {
        const lines = [];
        const lineHeight = 25;
        const startY = 80;
        const maxLines = Math.floor((height - startY - 50) / lineHeight);

        // 生成模拟的论文文本
        const sampleTexts = [
            '摘要：本文研究了基于深度学习的图像识别技术...',
            '关键词：深度学习；卷积神经网络；图像识别',
            '1. 引言',
            '随着人工智能技术的快速发展，深度学习...',
            '1.1 研究背景',
            '近年来，计算机视觉领域取得了显著进展...',
            '卷积神经网络（CNN）在图像分类任务中...',
            '本研究旨在探索更高效的图像识别方法...',
            '1.2 研究意义',
            '图像识别技术在医疗诊断、自动驾驶...',
            '提高识别准确率具有重要的实际意义...',
            '2. 相关工作',
            '2.1 深度学习基础',
            '深度学习是机器学习的一个重要分支...',
            '通过多层神经网络提取特征表示...',
            '2.2 卷积神经网络',
            'CNN由卷积层、池化层和全连接层组成...',
            '卷积操作能够有效提取图像特征...',
            '3. 方法',
            '3.1 网络架构设计',
            '本文提出的网络架构包含...',
            '使用残差连接解决梯度消失问题...',
            '3.2 训练策略',
            '采用数据增强技术提高泛化能力...',
            '使用Adam优化器进行训练...'
        ];

        for (let i = 0; i < maxLines; i++) {
            const text = sampleTexts[i % sampleTexts.length];
            const corruption = Math.random() < 0.1; // 10%的行被侵蚀

            lines.push({
                text: text,
                x: 30,
                y: startY + i * lineHeight,
                corruption: corruption,
                corruptionProgress: corruption ? Math.random() : 0
            });
        }

        return {
            type: 'document',
            title: '毕业论文_最终版_打死不改.docx',
            lines: lines,
            width: width,
            height: height
        };
    }

    /**
     * 生成桌面背景
     */
    generateDesktopBackground(width, height) {
        const icons = [];
        const iconSize = 60;
        const padding = 20;
        const cols = Math.floor(width / (iconSize + padding));
        const rows = Math.floor(height / (iconSize + padding));

        // 桌面图标
        const iconNames = [
            '我的电脑', '回收站', '我的文档', '浏览器',
            '音乐', '图片', '视频', '控制面板',
            '杀毒软件', '游戏', '工作', '学习资料',
            '项目文件', '备份', '下载', '工具'
        ];

        let iconIndex = 0;
        for (let row = 0; row < Math.min(rows, 4); row++) {
            for (let col = 0; col < Math.min(cols, 4); col++) {
                const x = padding + col * (iconSize + padding);
                const y = padding + row * (iconSize + padding) + 50;

                icons.push({
                    name: iconNames[iconIndex % iconNames.length],
                    x: x,
                    y: y,
                    size: iconSize,
                    locked: Math.random() < 0.3, // 30%被锁
                    corrupted: Math.random() < 0.2 // 20%被侵蚀
                });

                iconIndex++;
            }
        }

        return {
            type: 'desktop',
            icons: icons,
            taskbarHeight: 60,
            width: width,
            height: height
        };
    }

    /**
     * 生成蓝屏背景
     */
    generateBSODBackground(width, height) {
        const errorCodes = [
            'STOP: 0x0000007E (0xFFFFFFFFC0000005, 0xFFFFF80002E55150, 0xFFFFF880009A9958, 0xFFFFF880009A91B0)',
            'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED',
            'A problem has been detected and Windows has been shut down to prevent damage to your computer.',
            'If this is the first time you\'ve seen this Stop error screen, restart your computer.',
            'Check to make sure any new hardware or software is properly installed.',
            'Technical information:',
            '*** STOP: 0x0000007E (0xFFFFFFFFC0000005, 0xFFFFF80002E55150)',
            '*** dxgkrnl.sys - Address FFFFF80002E55150 base at FFFFF80002E4D000',
            'Collecting data for crash dump...',
            'Initializing disk for crash dump...',
            'Physical memory dump complete.',
            'SYSTEM BREACHED... INIT DEFENSE PROTOCOL'
        ];

        return {
            type: 'bsod',
            errorCodes: errorCodes,
            scrollOffset: 0,
            scrollSpeed: 30,
            width: width,
            height: height
        };
    }

    /**
     * 渲染背景
     */
    renderBackground(ctx, width, height) {
        if (!this.backgroundData) return;

        switch (this.backgroundData.type) {
            case 'document':
                this.renderDocumentBackground(ctx);
                break;
            case 'desktop':
                this.renderDesktopBackground(ctx);
                break;
            case 'bsod':
                this.renderBSODBackground(ctx);
                break;
        }
    }

    /**
     * 渲染文档背景
     */
    renderDocumentBackground(ctx) {
        const data = this.backgroundData;

        // 背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, data.width, data.height);

        // 标题栏
        ctx.fillStyle = '#2b579a';
        ctx.fillRect(0, 0, data.width, 50);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(data.title, 20, 32);

        // 工具栏
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(0, 50, data.width, 30);

        // 文本内容
        ctx.fillStyle = '#000000';
        ctx.font = '14px Arial, sans-serif';
        ctx.shadowBlur = 0; // 重置阴影，确保文字没有绿色发光

        data.lines.forEach(line => {
            // 只显示正常文字，没有病毒入侵效果
            ctx.fillStyle = '#000000';
            ctx.fillText(line.text, line.x, line.y);
        });
    }

    /**
     * 渲染桌面背景 - 文件彻底删除
     */
    renderDesktopBackground(ctx) {
        const data = this.backgroundData;

        // 暗色调桌面背景 - 象征文件被删除后的空虚
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, data.width, data.height);

        // 删除进度条背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(data.width / 2 - 150, data.height / 2 - 80, 300, 160);

        // 删除进度条边框
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(data.width / 2 - 150, data.height / 2 - 80, 300, 160);

        // 删除图标 - 文件碎纸机效果
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🗑️', data.width / 2, data.height / 2 - 30);

        // 删除文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Microsoft YaHei", Arial';
        ctx.fillText('正在删除文件...', data.width / 2, data.height / 2 + 10);

        // 删除进度条
        const progress = (Date.now() % 3000) / 3000;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(data.width / 2 - 120, data.height / 2 + 25, 240 * progress, 20);

        // 进度条边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(data.width / 2 - 120, data.height / 2 + 25, 240, 20);

        // 残留的图标碎片效果
        for (let i = 0; i < 5; i++) {
            const x = data.width / 2 - 100 + i * 50;
            const y = data.height / 2 - 150 - Math.sin(Date.now() / 500 + i) * 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, y, 30, 30);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.strokeRect(x, y, 30, 30);
        }

        // 任务栏 - 黑色表示系统不响应
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, data.height - data.taskbarHeight, data.width, data.taskbarHeight);

        // 任务栏上显示警告
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ 文件删除中，请勿关闭计算机', data.width / 2, data.height - 20);
    }

    /**
     * 渲染蓝屏背景
     */
    renderBSODBackground(ctx) {
        const data = this.backgroundData;

        // 蓝屏背景
        ctx.fillStyle = '#0078d7';
        ctx.fillRect(0, 0, data.width, data.height);

        // 悲伤表情
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(':(', data.width / 2, 150);

        // 错误信息
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';

        const startY = 200;
        const lineHeight = 30;

        data.errorCodes.forEach((code, index) => {
            const y = startY + index * lineHeight - data.scrollOffset;

            if (y > 0 && y < data.height) {
                ctx.fillText(code, 50, y);
            }
        });

        // 更新滚动
        data.scrollOffset += data.scrollSpeed * 0.016;
        if (data.scrollOffset > data.errorCodes.length * lineHeight) {
            data.scrollOffset = 0;
        }

        // 像素化效果
        if (this.alertLevel >= 2) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(0, 0, data.width, data.height);
        }
    }

    /**
     * 获取关卡统计
     */
    getStats() {
        return {
            level: this.type,
            levelName: this.config.name,
            score: this.score,
            maxCombo: this.maxCombo,
            kills: this.kills,
            missed: this.missed,
            remainingTime: this.remainingTime,
            timeBonus: Math.floor(this.remainingTime * 10),
            totalScore: this.score + Math.floor(this.remainingTime * 10)
        };
    }

    /**
     * 重置关卡
     */
    reset() {
        this.isStarted = false;
        this.isCompleted = false;
        this.isFailed = false;
        this.remainingTime = this.duration;
        this.score = 0;
        this.maxCombo = 0;
        this.currentCombo = 0;
        this.kills = 0;
        this.missed = 0;
        this.alertLevel = 0;
        this.difficultyMultiplier = 1;
        this.backgroundData = null;
    }
}

/**
 * 关卡管理器
 */
class LevelManager {
    constructor() {
        this.currentLevel = null;
        this.currentLevelIndex = 0;
        this.levels = [
            new Level(LevelType.DOCUMENT),
            new Level(LevelType.DESKTOP),
            new Level(LevelType.BSOD)
        ];

        // 总体统计
        this.totalScore = 0;
        this.totalKills = 0;
        this.totalMaxCombo = 0;
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelIndex, canvasWidth, canvasHeight) {
        if (levelIndex < 0 || levelIndex >= this.levels.length) {
            return null;
        }

        this.currentLevelIndex = levelIndex;
        this.currentLevel = this.levels[levelIndex];
        this.currentLevel.start(canvasWidth, canvasHeight);

        return this.currentLevel;
    }

    /**
     * 开始下一关
     */
    startNextLevel(canvasWidth, canvasHeight) {
        return this.startLevel(this.currentLevelIndex + 1, canvasWidth, canvasHeight);
    }

    /**
     * 获取当前关卡
     */
    getCurrentLevel() {
        return this.currentLevel;
    }

    /**
     * 是否最后一关
     */
    isLastLevel() {
        return this.currentLevelIndex >= this.levels.length - 1;
    }

    /**
     * 更新总统计
     */
    updateTotalStats() {
        if (this.currentLevel) {
            const stats = this.currentLevel.getStats();
            this.totalScore += stats.totalScore;
            this.totalKills += stats.kills;
            this.totalMaxCombo = Math.max(this.totalMaxCombo, stats.maxCombo);
        }
    }

    /**
     * 获取总统计
     */
    getTotalStats() {
        return {
            totalScore: this.totalScore,
            totalKills: this.totalKills,
            totalMaxCombo: this.totalMaxCombo,
            levelsCompleted: this.currentLevelIndex + (this.currentLevel?.isCompleted ? 1 : 0)
        };
    }

    /**
     * 重置所有
     */
    resetAll() {
        this.levels.forEach(level => level.reset());
        this.currentLevel = null;
        this.currentLevelIndex = 0;
        this.totalScore = 0;
        this.totalKills = 0;
        this.totalMaxCombo = 0;
    }
}
