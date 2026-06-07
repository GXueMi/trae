/**
 * 关卡开场动画系统
 * 为三个关卡分别创建独特的开场动画
 * LevelType 已在 levels.js 中定义
 */

/**
 * 文档保卫战开场动画
 */
class DocumentIntro {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // 计算缩放比例（适应手机屏幕）
        this.scale = Math.min(this.width, this.height) / 400;
        this.scale = Math.max(0.5, Math.min(1.5, this.scale));

        // 动画状态
        this.totalDuration = 14; // 14秒总时长
        this.currentTime = 0;
        this.isComplete = false;

        // 阶段配置 - 正常编辑到最后一行时病毒出现
        this.phases = [
            { start: 0, end: 5, name: 'normal_edit' },      // 正常编辑论文
            { start: 5, end: 8, name: 'virus_appears' },    // 病毒在最后一行出现
            { start: 8, end: 11, name: 'virus_spread' },    // 病毒快速扩散
            { start: 11, end: 12, name: 'countdown_end' },  // 倒计时结束
            { start: 12, end: 14, name: 'start' }            // 开始
        ];

        // 当前阶段
        this.currentPhase = 0;

        // 文档数据
        this.lines = this.generateDocumentLines();
        this.cursorX = 0;
        this.cursorY = 0;
        this.cursorVisible = true;
        this.cursorTimer = 0;

        // 病毒粒子
        this.virusParticles = [];

        // 背景渐变
        this.bgColor = { r: 255, g: 255, b: 255 };
        this.targetBgColor = { r: 255, g: 255, b: 255 };

        // 标题动画
        this.attackTitleScale = 0;
        this.attackTitleAlpha = 0;
        this.documentTitleScale = 0;
        this.documentTitleAlpha = 0;

        // 文档围困程度
        this.siegeProgress = 0;

        // 音效计时器
        this.soundTimer = 0;
        this.lastSoundTime = 0;
    }

    /**
     * 生成文档内容 - 论文格式
     */
    generateDocumentLines() {
        const lines = [];
        const lineHeight = 25;
        const startY = 140; // 再往下移，避免和标题栏重叠

        const texts = [
            '新媒体环境下用户信息阅读行为研究',
            '×××',
            '',
            '摘要：随着移动互联网、短视频、社交平台等新媒体形态的快速普及，大众的信息获取',
            '与阅读方式发生了颠覆性变革。传统纸质阅读、深度阅读模式逐渐被碎片化、轻量化、场景',
            '化的新媒体阅读行为替代。为系统探究新媒体环境下用户信息阅读的行为特征、现存问题及',
            '优化路径，本文采用文献研究法、归纳分析法，梳理新媒体传播特征与用户阅读行为的变化',
            '规律，总结当前用户阅读存在碎片化严重、深度思考缺失、信息茧房固化、虚假信息辨识能',
            '力不足等问题，并从用户自身、平台运营、社会引导三个维度提出优化策略。',
            '',
            '关键词：新媒体；信息阅读；阅读行为；碎片化阅读',
            '',
            '一、绪论',
            '（一）研究背景',
            '移动智能终端的全面普及，推动媒介环境进入全新发展阶段。以微信、微博、短视频平',
            '台、资讯 APP 为代表的新媒体，凭借传播速度快、内容形式丰富、交互性强、获取门槛低等',
            '优势，彻底改变了传统信息传播格局。',
            '',
            '（二）研究目的',
            '本研究旨在深入分析新媒体环境下用户的信...'
        ];

        texts.forEach((text, index) => {
            lines.push({
                text: text,
                x: 50,
                y: startY + index * lineHeight,
                opacity: 1,
                infected: false,
                infectionProgress: 0,
                isLastLine: index === texts.length - 1  // 标记最后一行
            });
        });

        return lines;
    }

    /**
     * 开始动画
     */
    start() {
        this.currentTime = 0;
        this.isComplete = false;
        this.currentPhase = 0;
        this.virusParticles = [];
        this.cursorX = 30;
        this.cursorY = 80;
        this.attackTitleScale = 0;
        this.attackTitleAlpha = 0;
        this.documentTitleScale = 0;
        this.documentTitleAlpha = 0;
        this.siegeProgress = 0;

        // 重置行状态
        this.lines.forEach(line => {
            line.opacity = 1;
            line.infected = false;
            line.infectionProgress = 0;
        });
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.isComplete) return;

        // 保存deltaTime供updateSounds使用
        this.deltaTime = deltaTime;

        this.currentTime += deltaTime;

        // 更新当前阶段
        for (let i = 0; i < this.phases.length; i++) {
            if (this.currentTime >= this.phases[i].start &&
                this.currentTime < this.phases[i].end) {
                this.currentPhase = i;
                break;
            }
        }

        // 更新音效
        this.updateSounds();

        // 更新阶段
        switch (this.phases[this.currentPhase].name) {
            case 'normal_edit':
                this.updateNormalEdit(deltaTime);
                break;
            case 'virus_appears':
                this.updateVirusAppears(deltaTime);
                break;
            case 'virus_spread':
                this.updateVirusSpread(deltaTime);
                break;
            case 'countdown_end':
                this.updateCountdownEnd(deltaTime);
                break;
            case 'start':
                this.updateStart(deltaTime);
                break;
        }

        // 更新光标
        this.cursorTimer += deltaTime;
        if (this.cursorTimer >= 0.5) {
            this.cursorVisible = !this.cursorVisible;
            this.cursorTimer = 0;
        }

        // 更新病毒粒子
        this.virusParticles = this.virusParticles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });

        // 检查完成
        if (this.currentTime >= this.totalDuration) {
            this.isComplete = true;
        }
    }

    /**
     * 更新音效
     */
    updateSounds() {
        this.soundTimer += this.deltaTime || 0.016;

        const phase = this.phases[this.currentPhase].name;

        switch (phase) {
            case 'normal_edit':
                // 打字声
                if (this.soundTimer - this.lastSoundTime > 0.15) {
                    audioManager.play('click');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'virus_appears':
                // 病毒出现音效
                if (this.currentTime >= 5 && this.currentTime < 5.5) {
                    audioManager.play('error');
                }
                // 心跳声
                if (this.soundTimer - this.lastSoundTime > 0.5) {
                    audioManager.play('heartbeat');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'virus_spread':
                // 病毒扩散音效
                if (this.soundTimer - this.lastSoundTime > 0.3) {
                    audioManager.play('heartbeat');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'start':
                // BGM 开始
                if (this.currentTime >= 12) {
                    audioManager.play('levelComplete');
                }
                break;
        }
    }

    /**
     * 更新正常编辑阶段 - 模拟论文编辑
     */
    updateNormalEdit(deltaTime) {
        // 光标在最后一行移动，模拟正在输入
        const lastLine = this.lines.find(l => l.isLastLine);
        if (lastLine) {
            const progress = (this.currentTime) / 5; // 5 秒内完成输入
            const typingSpeed = 0.3; // 输入速度

            // 模拟逐字输入效果
            if (progress < 1 && Math.random() < deltaTime * 3) {
                const currentText = lastLine.text;
                const targetText = '本研究旨在深入分析新媒体环境下用户的信息阅读行为，探索科学的优化路径。';

                if (currentText.length < targetText.length) {
                    const nextChar = targetText[currentText.length];
                    lastLine.text = targetText.substring(0, currentText.length + 1);

                    // 更新光标位置
                    this.cursorX = lastLine.x + lastLine.text.length * 14 * this.scale;
                    this.cursorY = lastLine.y;
                }
            }
        }

        // 背景保持白色
        this.targetBgColor = { r: 255, g: 255, b: 255 };
    }

    /**
     * 更新病毒出现阶段 - 在最后一行输入时病毒突然出现
     */
    updateVirusAppears(deltaTime) {
        const progress = (this.currentTime - 5) / 3;

        // 在最后一行突然出现病毒
        const lastLine = this.lines.find(l => l.isLastLine);
        if (lastLine && Math.random() < deltaTime * 8) {
            const charIndex = Math.floor(Math.random() * lastLine.text.length);

            this.virusParticles.push({
                x: lastLine.x + charIndex * 14 * this.scale,
                y: lastLine.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                size: Utils.random(8, 20),
                color: '#ff0000',
                life: Utils.random(1.5, 3),
                maxLife: 3,
                isVirus: true
            });
        }

        // 最后一行开始被感染
        if (lastLine) {
            lastLine.infectionProgress = Math.min(1, lastLine.infectionProgress + deltaTime * 0.8);
            lastLine.infected = true;
        }

        // 背景开始微微变红
        this.targetBgColor = { r: 255, g: 240, b: 240 };
    }

    /**
     * 更新病毒扩散阶段 - 病毒快速感染整个文档
     */
    updateVirusSpread(deltaTime) {
        const progress = (this.currentTime - 8) / 3;

        // 大量生成病毒粒子
        if (Math.random() < deltaTime * 15) {
            const line = this.lines[Math.floor(Math.random() * this.lines.length)];
            this.virusParticles.push({
                x: line.x + Utils.random(0, line.text.length * 14) * this.scale,
                y: line.y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                size: Utils.random(10, 25),
                color: '#ff0000',
                life: Utils.random(2, 4),
                maxLife: 4,
                isVirus: true
            });
        }

        // 所有行快速被感染
        this.lines.forEach((line, index) => {
            line.infected = true;
            line.infectionProgress = Math.min(1, line.infectionProgress + deltaTime * (0.5 + progress));
        });

        // 背景快速变红
        this.targetBgColor = {
            r: Math.min(255, 200 + progress * 55),
            g: Math.max(100, 200 - progress * 100),
            b: Math.max(100, 200 - progress * 100)
        };

        // 标题暂不显示，等文档完全被侵蚀后再出现
    }

    /**
     * 更新倒计时阶段
     */
    updateCountdown(deltaTime) {
        const progress = (this.currentTime - 9) / 2;

        // 背景完全变红
        this.targetBgColor = { r: 255, g: 50, b: 50 };

        // 标题动画
        this.attackTitleScale = Utils.lerp(this.attackTitleScale, 1, deltaTime * 5);
        this.attackTitleAlpha = Utils.lerp(this.attackTitleAlpha, 1, deltaTime * 5);
    }

    /**
     * 更新倒计时结束阶段
     */
    updateCountdownEnd(deltaTime) {
        // 保持标题显示
        this.attackTitleScale = 1;
        this.attackTitleAlpha = 1;
    }

    /**
     * 更新开始阶段
     */
    updateStart(deltaTime) {
        const progress = (this.currentTime - 12) / 2;

        // 标题动画
        this.documentTitleScale = Utils.lerp(this.documentTitleScale, 1, deltaTime * 8);
        this.documentTitleAlpha = Utils.lerp(this.documentTitleAlpha, 1, deltaTime * 8);

        // 背景变黑
        this.targetBgColor = { r: 0, g: 0, b: 0 };

        // 文字炸开效果
        this.lines.forEach(line => {
            line.opacity = Math.max(0, line.opacity - deltaTime * 3);
        });
    }

    /**
     * 渲染动画
     */
    render() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const scale = this.scale;

        // 更新背景颜色
        this.bgColor.r = Utils.lerp(this.bgColor.r, this.targetBgColor.r, 0.1);
        this.bgColor.g = Utils.lerp(this.bgColor.g, this.targetBgColor.g, 0.1);
        this.bgColor.b = Utils.lerp(this.bgColor.b, this.targetBgColor.b, 0.1);

        ctx.fillStyle = `rgb(${this.bgColor.r}, ${this.bgColor.g}, ${this.bgColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // 渲染标题栏
        ctx.fillStyle = '#2b579a';
        const titleBarHeight = Math.floor(50 * scale);
        ctx.fillRect(0, 0, width, titleBarHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(16 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('毕业论文_最终版_打死不改.docx - Word', 20 * scale, 32 * scale);

        // 渲染工具栏
        ctx.fillStyle = '#f3f3f3';
        ctx.fillRect(0, titleBarHeight, width, 30 * scale);

        // 渲染文档内容
        ctx.font = `${Math.floor(14 * scale)}px "Microsoft YaHei", Arial`;
        ctx.shadowBlur = 0; // 重置阴影，确保文字没有绿色发光

        this.lines.forEach((line, lineIndex) => {
            ctx.globalAlpha = line.opacity;

            if (line.infected && line.infectionProgress > 0) {
                // 被感染的文字显示为像素块
                const charWidth = 14 * scale;
                for (let i = 0; i < line.text.length; i++) {
                    const charProgress = i / line.text.length;
                    if (charProgress < line.infectionProgress) {
                        // 像素块效果
                        const pixelSize = 8 * scale;
                        const charsPerPixel = 2;
                        const pixelIndex = Math.floor(i / charsPerPixel);

                        if (Math.random() < 0.7) {
                            ctx.fillStyle = `rgb(${Utils.randomInt(200, 255)}, ${Utils.randomInt(0, 50)}, ${Utils.randomInt(0, 50)})`;
                            ctx.fillRect(
                                line.x + i * charWidth,
                                line.y - 12 * scale,
                                charWidth + 2,
                                16 * scale
                            );
                        }
                    } else {
                        // 正常文字
                        ctx.fillStyle = '#000000';
                        ctx.fillText(line.text[i], line.x + i * charWidth, line.y);
                    }
                }
            } else {
                // 正常文字
                ctx.fillStyle = '#000000';
                ctx.fillText(line.text, line.x, line.y);
            }
        });

        ctx.globalAlpha = 1;

        // 渲染光标 - 只在正常编辑阶段显示
        if (this.cursorVisible && (this.currentPhase === 0 || this.currentPhase === 1)) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.cursorX, this.cursorY - 12 * scale, 2 * scale, 16 * scale);
        }

        // 渲染病毒粒子
        this.virusParticles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;

            // 绘制病毒为像素块
            const virusSize = p.size;
            ctx.fillRect(p.x - virusSize / 2, p.y - virusSize / 2, virusSize, virusSize);

            // 病毒内部细节
            ctx.fillStyle = '#ff8888';
            ctx.fillRect(p.x - virusSize / 4, p.y - virusSize / 4, virusSize / 2, virusSize / 2);

            ctx.restore();
        });

        // 渲染"THE DOCUMENT"炸开效果
        if (this.documentTitleAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.documentTitleAlpha;
            ctx.translate(width / 2, height / 2);
            ctx.scale(this.documentTitleScale, this.documentTitleScale);

            ctx.shadowColor = '#ff0088';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#ff0088';
            ctx.font = `bold ${Math.floor(48 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('THE DOCUMENT', 0, 0);

            ctx.font = `${Math.floor(24 * scale)}px "Microsoft YaHei", Arial`;
            ctx.fillText('文档保卫战', 0, 40 * scale);

            ctx.restore();
        }
    }
}

/**
 * 桌面封锁线开场动画 - 删除文件夹确认窗口
 */
class DesktopIntro {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // 计算缩放比例（适应手机屏幕）
        this.scale = Math.min(this.width, this.height) / 400;
        this.scale = Math.max(0.5, Math.min(1.5, this.scale));

        // 动画状态
        this.totalDuration = 14;
        this.currentTime = 0;
        this.isComplete = false;

        // 阶段配置
        this.phases = [
            { start: 0, end: 2, name: 'window_appear' },    // 窗口出现
            { start: 2, end: 5, name: 'normal_state' },     // 正常状态
            { start: 5, end: 8, name: 'warning_start' },    // 警告开始
            { start: 8, end: 11, name: 'critical' },        // 危急状态
            { start: 11, end: 12, name: 'countdown' },      // 倒计时
            { start: 12, end: 14, name: 'start' }           // 开始
        ];

        // 当前阶段
        this.currentPhase = 0;

        // 窗口属性
        this.windowX = 0;
        this.windowY = 0;
        this.windowWidth = 320;
        this.windowHeight = 180;
        this.windowScale = 0;

        // 按钮状态
        this.yesButtonHover = false;
        this.noButtonHover = false;
        this.buttonShake = 0;

        // 警告图标
        this.warningPulse = 0;
        this.warningScale = 1;

        // 背景颜色
        this.bgColor = { r: 100, g: 100, b: 100 };
        this.targetBgColor = { r: 100, g: 100, b: 100 };

        // 标题动画
        this.titleScale = 0;
        this.titleAlpha = 0;

        // 音效计时器
        this.soundTimer = 0;
        this.lastSoundTime = 0;

        // 删除进度
        this.deleteProgress = 0;
        this.fileFlicker = 0;

        // 初始化窗口位置
        this.calculateWindowPosition();
    }

    /**
     * 计算窗口位置（居中）
     */
    calculateWindowPosition() {
        const scaledWidth = this.windowWidth * this.scale;
        const scaledHeight = this.windowHeight * this.scale;
        this.windowX = (this.width - scaledWidth) / 2;
        this.windowY = (this.height - scaledHeight) / 2;
    }

    /**
     * 开始动画
     */
    start() {
        this.currentTime = 0;
        this.isComplete = false;
        this.currentPhase = 0;
        this.windowScale = 0;
        this.titleScale = 0;
        this.titleAlpha = 0;
        this.warningPulse = 0;
        this.warningScale = 1;
        this.deleteProgress = 0;
        this.buttonShake = 0;
        this.calculateWindowPosition();

        this.targetBgColor = { r: 100, g: 100, b: 100 };
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.isComplete) return;

        // 保存deltaTime供updateSounds使用
        this.deltaTime = deltaTime;

        this.currentTime += deltaTime;

        // 更新阶段
        for (let i = 0; i < this.phases.length; i++) {
            if (this.currentTime >= this.phases[i].start &&
                this.currentTime < this.phases[i].end) {
                this.currentPhase = i;
                break;
            }
        }

        // 更新音效
        this.updateSounds();

        // 更新阶段
        switch (this.phases[this.currentPhase].name) {
            case 'window_appear':
                this.updateWindowAppear(deltaTime);
                break;
            case 'normal_state':
                this.updateNormalState(deltaTime);
                break;
            case 'warning_start':
                this.updateWarningStart(deltaTime);
                break;
            case 'critical':
                this.updateCritical(deltaTime);
                break;
            case 'countdown':
                this.updateCountdown(deltaTime);
                break;
            case 'start':
                this.updateStart(deltaTime);
                break;
        }

        // 更新背景颜色
        this.bgColor.r = Utils.lerp(this.bgColor.r, this.targetBgColor.r, 0.1);
        this.bgColor.g = Utils.lerp(this.bgColor.g, this.targetBgColor.g, 0.1);
        this.bgColor.b = Utils.lerp(this.bgColor.b, this.targetBgColor.b, 0.1);

        // 检查完成
        if (this.currentTime >= this.totalDuration) {
            this.isComplete = true;
        }
    }

    /**
     * 更新音效
     */
    updateSounds() {
        this.soundTimer += this.deltaTime || 0.016;

        const phase = this.phases[this.currentPhase].name;

        switch (phase) {
            case 'window_appear':
                // 窗口出现音效
                if (this.currentTime >= 0.5 && this.currentTime < 1) {
                    audioManager.play('menuClick');
                }
                break;
            case 'normal_state':
                // 系统提示音
                if (this.soundTimer - this.lastSoundTime > 2) {
                    audioManager.play('menuClick');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'warning_start':
                // 警告音开始
                if (this.currentTime >= 5 && this.currentTime < 6) {
                    audioManager.play('error');
                }
                break;
            case 'critical':
                // 心跳声
                if (this.soundTimer - this.lastSoundTime > 0.5) {
                    audioManager.play('heartbeat');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'countdown':
                // 警报音
                if (this.currentTime >= 11 && this.currentTime < 12) {
                    audioManager.play('alarm');
                }
                break;
            case 'start':
                // BGM高潮
                if (this.currentTime >= 12) {
                    audioManager.play('levelComplete');
                }
                break;
        }
    }

    /**
     * 更新窗口出现阶段
     */
    updateWindowAppear(deltaTime) {
        const progress = this.currentTime / 2;
        this.windowScale = Utils.lerp(this.windowScale, 1, deltaTime * 3);
        this.targetBgColor = { r: 80, g: 80, b: 80 };
    }

    /**
     * 更新正常状态阶段
     */
    updateNormalState(deltaTime) {
        // 轻微脉动
        this.warningPulse = Math.sin(Date.now() / 1000) * 0.02;
    }

    /**
     * 更新警告开始阶段
     */
    updateWarningStart(deltaTime) {
        const progress = (this.currentTime - 5) / 3;

        // 警告图标开始脉动
        this.warningPulse = Math.sin(Date.now() / 200) * progress * 0.1;
        this.warningScale = 1 + this.warningPulse;

        // 背景逐渐变红
        this.targetBgColor = {
            r: Utils.lerp(80, 100, progress),
            g: Utils.lerp(80, 40, progress),
            b: Utils.lerp(80, 40, progress)
        };

        // 文件开始闪烁
        this.fileFlicker = Math.random() < progress * 0.1;
    }

    /**
     * 更新危急状态阶段
     */
    updateCritical(deltaTime) {
        const progress = (this.currentTime - 8) / 3;

        // 强烈脉动
        this.warningPulse = Math.sin(Date.now() / 100) * (0.1 + progress * 0.1);
        this.warningScale = 1 + this.warningPulse;

        // 背景完全变红
        this.targetBgColor = {
            r: Utils.lerp(100, 150, progress),
            g: Utils.lerp(40, 20, progress),
            b: Utils.lerp(40, 20, progress)
        };

        // 删除进度增加
        this.deleteProgress = progress * 0.5;

        // 按钮抖动
        this.buttonShake = Math.sin(Date.now() / 50) * progress * 3;

        // 文件闪烁加剧
        this.fileFlicker = Math.random() < 0.3;
    }

    /**
     * 更新倒计时阶段
     */
    updateCountdown(deltaTime) {
        this.warningScale = 1 + Math.sin(Date.now() / 50) * 0.2;
        this.deleteProgress = 0.5 + (this.currentTime - 11) * 0.3;
        this.buttonShake = Math.sin(Date.now() / 30) * 5;
        this.targetBgColor = { r: 180, g: 10, b: 10 };
    }

    /**
     * 更新开始阶段
     */
    updateStart(deltaTime) {
        const progress = (this.currentTime - 12) / 2;

        this.titleScale = Utils.lerp(this.titleScale, 1, deltaTime * 5);
        this.titleAlpha = Utils.lerp(this.titleAlpha, 1, deltaTime * 5);

        // 背景变黑
        this.targetBgColor = { r: 0, g: 0, b: 0 };

        // 窗口缩小消失
        this.windowScale = Utils.lerp(this.windowScale, 0, deltaTime * 3);
    }

    /**
     * 渲染动画
     */
    render() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const scale = this.scale;

        // 背景
        ctx.fillStyle = `rgb(${this.bgColor.r}, ${this.bgColor.g}, ${this.bgColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // 桌面背景（灰色）
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(0, 0, width, height);

        // 渲染删除确认窗口
        if (this.windowScale > 0) {
            ctx.save();
            ctx.translate(this.windowX + (this.windowWidth * scale) / 2, this.windowY + (this.windowHeight * scale) / 2);
            ctx.scale(this.windowScale, this.windowScale);
            ctx.translate(-(this.windowWidth * scale) / 2, -(this.windowHeight * scale) / 2);

            // 窗口外边框（Windows风格）
            ctx.fillStyle = '#dfdfdf';
            ctx.fillRect(0, 0, this.windowWidth * scale, this.windowHeight * scale);

            // 窗口阴影
            ctx.fillStyle = '#808080';
            ctx.fillRect(3 * scale, 3 * scale, this.windowWidth * scale, this.windowHeight * scale);

            // 窗口内容区域
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(2 * scale, 2 * scale, (this.windowWidth - 4) * scale, (this.windowHeight - 4) * scale);

            // 标题栏
            ctx.fillStyle = '#0078d7';
            ctx.fillRect(2 * scale, 2 * scale, (this.windowWidth - 4) * scale, 28 * scale);

            // 标题栏文字
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${12 * scale}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText('删除文件夹', 10 * scale, 20 * scale);

            // 关闭按钮
            ctx.fillStyle = '#c0c0c0';
            ctx.fillRect((this.windowWidth - 24) * scale, 4 * scale, 18 * scale, 18 * scale);
            ctx.fillStyle = '#666';
            ctx.font = `bold ${14 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('×', (this.windowWidth - 15) * scale, 18 * scale);

            // 警告图标区域
            const iconSize = 48 * scale;
            const iconX = 15 * scale;
            const iconY = 40 * scale;

            ctx.save();
            ctx.translate(iconX + iconSize / 2, iconY + iconSize / 2);
            ctx.scale(this.warningScale, this.warningScale);
            ctx.translate(-iconSize / 2, -iconSize / 2);

            // 黄色警告三角形背景
            ctx.fillStyle = '#ffc000';
            ctx.beginPath();
            ctx.moveTo(iconSize / 2, 2 * scale);
            ctx.lineTo(iconSize - 2 * scale, iconSize - 2 * scale);
            ctx.lineTo(2 * scale, iconSize - 2 * scale);
            ctx.closePath();
            ctx.fill();

            // 三角形边框
            ctx.strokeStyle = '#cc9900';
            ctx.lineWidth = 2 * scale;
            ctx.stroke();

            // 感叹号
            ctx.fillStyle = '#cc9900';
            ctx.font = `bold ${32 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', iconSize / 2, iconSize / 2);

            ctx.restore();

            // 文字区域
            const textX = iconX + iconSize + 10 * scale;
            const textY = 45 * scale;

            ctx.fillStyle = '#000000';
            ctx.font = `${11 * scale}px Arial`;
            ctx.textAlign = 'left';

            // 第一行提示
            ctx.fillText('确实要永久性地删除此文件夹吗？', textX, textY);

            // 删除线效果（根据删除进度）
            if (this.deleteProgress > 0) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = 1 * scale;
                ctx.beginPath();
                ctx.moveTo(textX, textY - 2 * scale);
                ctx.lineTo(textX + 150 * scale, textY - 2 * scale);
                ctx.stroke();
            }

            // 文件夹图标和名称
            const folderY = textY + 20 * scale;

            // 文件夹图标
            ctx.fillStyle = '#ffc000';
            ctx.beginPath();
            ctx.moveTo(textX, folderY + 12 * scale);
            ctx.lineTo(textX + 8 * scale, folderY);
            ctx.lineTo(textX + 28 * scale, folderY);
            ctx.lineTo(textX + 28 * scale, folderY + 12 * scale);
            ctx.lineTo(textX + 32 * scale, folderY + 12 * scale);
            ctx.lineTo(textX + 32 * scale, folderY + 20 * scale);
            ctx.lineTo(textX, folderY + 20 * scale);
            ctx.closePath();
            ctx.fill();

            // 删除进度条覆盖
            if (this.deleteProgress > 0) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(textX, folderY, 32 * scale * this.deleteProgress, 20 * scale);
            }

            // 删除标记（危急阶段）
            if (this.currentPhase >= 3) {
                ctx.fillStyle = '#ff0000';
                ctx.font = `bold ${16 * scale}px Arial`;
                ctx.fillText('×', textX + 8 * scale, folderY + 14 * scale);
            }

            // 文件夹名称
            ctx.fillStyle = this.fileFlicker && this.currentPhase >= 2 ? '#ff0000' : '#000000';
            ctx.font = `${11 * scale}px Arial`;
            ctx.fillText('毕业论文', textX + 38 * scale, folderY + 15 * scale);

            // 创建日期
            ctx.fillStyle = '#666666';
            ctx.font = `${10 * scale}px Arial`;
            ctx.fillText('创建日期: 2026/4/25 20:58', textX + 38 * scale, folderY + 28 * scale);

            // 按钮区域
            const buttonWidth = 75 * scale;
            const buttonHeight = 23 * scale;
            const buttonY = this.windowHeight * scale - 35 * scale;
            const yesButtonX = (this.windowWidth * scale - buttonWidth * 2 - 12 * scale) / 2 + this.buttonShake;
            const noButtonX = yesButtonX + buttonWidth + 12 * scale - this.buttonShake;

            // "是(Y)"按钮
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(yesButtonX, buttonY, buttonWidth, buttonHeight);

            // 按钮边框
            ctx.strokeStyle = '#a0a0a0';
            ctx.lineWidth = 1 * scale;
            ctx.strokeRect(yesButtonX, buttonY, buttonWidth, buttonHeight);

            // 按钮高亮
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(yesButtonX + 1 * scale, buttonY + 1 * scale, buttonWidth - 2 * scale, 3 * scale);
            ctx.fillRect(yesButtonX + 1 * scale, buttonY + 1 * scale, 3 * scale, buttonHeight - 2 * scale);

            // 按钮阴影
            ctx.fillStyle = '#808080';
            ctx.fillRect(yesButtonX + buttonWidth - 3 * scale, buttonY + 3 * scale, 2 * scale, buttonHeight - 4 * scale);
            ctx.fillRect(yesButtonX + 3 * scale, buttonY + buttonHeight - 3 * scale, buttonWidth - 4 * scale, 2 * scale);

            // 按钮文字
            ctx.fillStyle = '#000000';
            ctx.font = `${11 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('是(Y)', yesButtonX + buttonWidth / 2, buttonY + 15 * scale);

            // "否(N)"按钮
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(noButtonX, buttonY, buttonWidth, buttonHeight);

            // 按钮边框
            ctx.strokeStyle = '#a0a0a0';
            ctx.lineWidth = 1 * scale;
            ctx.strokeRect(noButtonX, buttonY, buttonWidth, buttonHeight);

            // 按钮高亮
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(noButtonX + 1 * scale, buttonY + 1 * scale, buttonWidth - 2 * scale, 3 * scale);
            ctx.fillRect(noButtonX + 1 * scale, buttonY + 1 * scale, 3 * scale, buttonHeight - 2 * scale);

            // 按钮阴影
            ctx.fillStyle = '#808080';
            ctx.fillRect(noButtonX + buttonWidth - 3 * scale, buttonY + 3 * scale, 2 * scale, buttonHeight - 4 * scale);
            ctx.fillRect(noButtonX + 3 * scale, buttonY + buttonHeight - 3 * scale, buttonWidth - 4 * scale, 2 * scale);

            // 按钮文字
            ctx.fillStyle = '#000000';
            ctx.fillText('否(N)', noButtonX + buttonWidth / 2, buttonY + 15 * scale);

            // 删除进度条（危急阶段）
            if (this.currentPhase >= 3) {
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(2 * scale, this.windowHeight * scale - 2 * scale, (this.windowWidth - 4) * scale * this.deleteProgress, 2 * scale);
            }

            ctx.restore();
        }

        // 渲染阶段5的警告文字
        if (this.currentPhase === 4) {
            const progress = (this.currentTime - 11) / 1;

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.floor(24 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.globalAlpha = progress;

            ctx.fillText('DELETE IMMINENT', width / 2, height - 80 * scale);
            ctx.font = `bold ${Math.floor(16 * scale)}px "Courier New", monospace`;
            ctx.fillText('PROTECT YOUR FILES!', width / 2, height - 50 * scale);
            ctx.globalAlpha = 1;
        }

        // 渲染阶段6的标题
        if (this.currentPhase === 5) {
            ctx.save();
            ctx.globalAlpha = this.titleAlpha;
            ctx.translate(width / 2, height / 2);
            ctx.scale(this.titleScale, this.titleScale);

            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#00ffff';
            ctx.font = `bold ${Math.floor(48 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('THE DESKTOP', 0, 0);

            ctx.restore();
        }
    }
}

/**
 * 蓝屏核心开场动画
 */
class BSODIntro {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // 计算缩放比例（适应手机屏幕）
        this.scale = Math.min(this.width, this.height) / 400;
        this.scale = Math.max(0.5, Math.min(1.5, this.scale));

        // 动画状态
        this.totalDuration = 16;
        this.currentTime = 0;
        this.isComplete = false;

        // 阶段配置
        this.phases = [
            { start: 0, end: 3, name: 'crash前兆' },        // 崩溃前兆
            { start: 3, end: 6, name: 'bsod爆发' },         // 蓝屏爆发
            { start: 6, end: 10, name: 'virus扩散' },       // 病毒扩散
            { start: 10, end: 13, name: 'core显现' },       // 核心显现
            { start: 13, end: 14, name: 'countdown' },      // 倒计时
            { start: 14, end: 16, name: 'start' }           // 开始
        ];

        // 当前阶段
        this.currentPhase = 0;

        // 错误代码
        this.errorCodes = this.generateErrorCodes();
        this.scrollOffset = 0;

        // 病毒粒子
        this.virusParticles = [];

        // 核心
        this.coreSize = 0;
        this.corePulse = 0;

        // 背景颜色
        this.bgColor = { r: 255, g: 255, b: 255 };
        this.targetBgColor = { r: 255, g: 255, b: 255 };

        // 标题动画
        this.titleScale = 0;
        this.titleAlpha = 0;

        // 音效计时器
        this.soundTimer = 0;
        this.lastSoundTime = 0;

        // 故障效果
        this.glitchOffset = 0;
    }

    /**
     * 生成错误代码
     */
    generateErrorCodes() {
        return [
            'STOP: 0x0000007E (0xFFFFFFFFC0000005, 0xFFFFF80002E55150)',
            'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED',
            'A problem has been detected and Windows has been shut down',
            'to prevent damage to your computer.',
            '',
            'If this is the first time you\'ve seen this Stop error screen,',
            'restart your computer.',
            '',
            'Technical information:',
            '',
            '*** STOP: 0x0000007E',
            '*** dxgkrnl.sys - Address FFFFF80002E55150',
            'Collecting data for crash dump...',
            'Initializing disk for crash dump...',
            'Physical memory dump complete.',
            'SYSTEM BREACHED... INIT DEFENSE PROTOCOL'
        ];
    }

    /**
     * 开始动画
     */
    start() {
        this.currentTime = 0;
        this.isComplete = false;
        this.currentPhase = 0;
        this.scrollOffset = 0;
        this.virusParticles = [];
        this.coreSize = 0;
        this.corePulse = 0;
        this.titleScale = 0;
        this.titleAlpha = 0;
        this.glitchOffset = 0;
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.isComplete) return;

        // 保存deltaTime供updateSounds使用
        this.deltaTime = deltaTime;

        this.currentTime += deltaTime;

        // 更新阶段
        for (let i = 0; i < this.phases.length; i++) {
            if (this.currentTime >= this.phases[i].start &&
                this.currentTime < this.phases[i].end) {
                this.currentPhase = i;
                break;
            }
        }

        // 更新音效
        this.updateSounds();

        // 更新阶段
        switch (this.phases[this.currentPhase].name) {
            case 'crash前兆':
                this.updateCrashPrelude(deltaTime);
                break;
            case 'bsod爆发':
                this.updateBSODExplosion(deltaTime);
                break;
            case 'virus扩散':
                this.updateVirusSpread(deltaTime);
                break;
            case 'core显现':
                this.updateCoreAppearance(deltaTime);
                break;
            case 'countdown':
                this.updateCountdown(deltaTime);
                break;
            case 'start':
                this.updateStart(deltaTime);
                break;
        }

        // 更新滚动
        this.scrollOffset += deltaTime * 10;
        if (this.scrollOffset > this.errorCodes.length * 30) {
            this.scrollOffset = 0;
        }

        // 更新病毒粒子
        this.virusParticles = this.virusParticles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 50 * deltaTime; // 重力
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });

        // 更新背景颜色
        this.bgColor.r = Utils.lerp(this.bgColor.r, this.targetBgColor.r, 0.1);
        this.bgColor.g = Utils.lerp(this.bgColor.g, this.targetBgColor.g, 0.1);
        this.bgColor.b = Utils.lerp(this.bgColor.b, this.targetBgColor.b, 0.1);

        // 检查完成
        if (this.currentTime >= this.totalDuration) {
            this.isComplete = true;
        }
    }

    /**
     * 更新音效
     */
    updateSounds() {
        this.soundTimer += this.deltaTime;

        const phase = this.phases[this.currentPhase].name;

        switch (phase) {
            case 'crash前兆':
                // 故障音
                if (this.soundTimer - this.lastSoundTime > 0.3) {
                    audioManager.play('glitch');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'bsod爆发':
                // 警报声
                if (this.currentTime >= 3 && this.currentTime < 4) {
                    audioManager.play('alarm');
                }
                break;
            case 'virus扩散':
                // 爆炸音
                if (this.soundTimer - this.lastSoundTime > 0.6) {
                    audioManager.play('explosion');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'core显现':
                // 重音
                if (this.currentTime >= 10 && this.currentTime < 11) {
                    audioManager.play('explosion');
                }
                break;
            case 'countdown':
                // 警告音
                if (this.currentTime >= 13 && this.currentTime < 14) {
                    audioManager.play('alarm');
                }
                break;
            case 'start':
                // BGM高潮
                if (this.currentTime >= 14) {
                    audioManager.play('levelComplete');
                }
                break;
        }
    }

    /**
     * 更新崩溃前兆阶段
     */
    updateCrashPrelude(deltaTime) {
        const progress = this.currentTime / 3;

        // 故障偏移
        this.glitchOffset = Math.sin(Date.now() / 50) * progress * 20;

        // 背景逐渐变灰
        this.targetBgColor = {
            r: Utils.lerp(255, 150, progress),
            g: Utils.lerp(255, 150, progress),
            b: Utils.lerp(255, 150, progress)
        };
    }

    /**
     * 更新蓝屏爆发阶段
     */
    updateBSODExplosion(deltaTime) {
        const progress = (this.currentTime - 3) / 3;

        // 快速变蓝
        this.targetBgColor = {
            r: Utils.lerp(150, 0, progress),
            g: Utils.lerp(150, 120, progress),
            b: Utils.lerp(150, 215, progress)
        };

        // 故障效果
        this.glitchOffset = Math.sin(Date.now() / 30) * 30;
    }

    /**
     * 更新病毒扩散阶段
     */
    updateVirusSpread(deltaTime) {
        const progress = (this.currentTime - 6) / 4;

        // 生成病毒粒子
        if (Math.random() < progress * deltaTime * 6) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(50, 150);

            this.virusParticles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.random(8, 20),
                color: '#ff0000',
                life: Utils.random(2, 3),
                maxLife: 3
            });
        }

        // 核心开始形成
        this.coreSize = progress * 30;
    }

    /**
     * 更新核心显现阶段
     */
    updateCoreAppearance(deltaTime) {
        const progress = (this.currentTime - 10) / 3;

        // 核心增大
        this.coreSize = 30 + progress * 70;
        this.corePulse = Math.sin(Date.now() / 100) * 10;

        // 更多病毒
        if (Math.random() < deltaTime * 8) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(80, 200);

            this.virusParticles.push({
                x: centerX + (Math.random() - 0.5) * this.coreSize,
                y: centerY + (Math.random() - 0.5) * this.coreSize,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.random(5, 15),
                color: '#ff0088',
                life: Utils.random(1.5, 2.5),
                maxLife: 2.5
            });
        }
    }

    /**
     * 更新倒计时阶段
     */
    updateCountdown(deltaTime) {
        this.corePulse = Math.sin(Date.now() / 50) * 20;
    }

    /**
     * 更新开始阶段
     */
    updateStart(deltaTime) {
        const progress = (this.currentTime - 14) / 2;

        this.titleScale = Utils.lerp(this.titleScale, 1, deltaTime * 5);
        this.titleAlpha = Utils.lerp(this.titleAlpha, 1, deltaTime * 5);

        // 背景变黑
        this.targetBgColor = { r: 0, g: 0, b: 0 };

        // 核心收缩消失
        this.coreSize = Utils.lerp(this.coreSize + this.corePulse, 0, deltaTime * 3);
    }

    /**
     * 渲染动画
     */
    render() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const scale = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // 背景
        ctx.fillStyle = `rgb(${this.bgColor.r}, ${this.bgColor.g}, ${this.bgColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // 故障效果（阶段0-2）
        if (this.currentPhase < 3 && this.glitchOffset !== 0) {
            ctx.save();
            ctx.globalAlpha = 0.5;

            // RGB分离
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(this.glitchOffset * scale, 0, width, height);

            ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
            ctx.fillRect(-this.glitchOffset * scale, 0, width, height);

            ctx.restore();
        }

        // 渲染错误代码（阶段1-4）
        if (this.currentPhase >= 1 && this.currentPhase <= 4) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.floor(16 * scale)}px Arial`;
            ctx.textAlign = 'left';

            // 悲伤表情
            ctx.font = `bold ${Math.floor(80 * scale)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(':(', centerX, 120 * scale);

            ctx.font = `${Math.floor(16 * scale)}px Arial`;
            ctx.textAlign = 'left';

            const startY = 180 * scale;
            const lineHeight = 25 * scale;

            this.errorCodes.forEach((code, index) => {
                const y = startY + index * lineHeight - this.scrollOffset * scale;
                if (y > 0 && y < height) {
                    ctx.globalAlpha = 0.8;
                    ctx.fillText(code, 50 * scale, y);
                }
            });

            ctx.globalAlpha = 1;
        }

        // 渲染病毒粒子
        this.virusParticles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * scale / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        // 渲染核心（阶段 3-5）
        if (this.currentPhase >= 3 && this.coreSize > 0) {
            const totalSize = Math.max(0, (this.coreSize + this.corePulse) * scale);

            // 外发光
            ctx.save();
            ctx.shadowColor = '#ff0088';
            ctx.shadowBlur = 50 * scale;

            // 核心外圈（确保半径不为负）
            if (totalSize > 0) {
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, totalSize);
                gradient.addColorStop(0, '#ff00ff');
                gradient.addColorStop(0.5, '#8800ff');
                gradient.addColorStop(1, '#440088');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, totalSize, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // 核心内部
            if (totalSize > 0) {
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(centerX, centerY, totalSize * 0.6, 0, Math.PI * 2);
                ctx.fill();

                // 核心标记
                ctx.fillStyle = '#ff00ff';
                ctx.font = `bold ${totalSize * 0.4}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('CORE', centerX, centerY);
            }
        }

        // 渲染阶段5的警告文字
        if (this.currentPhase === 4) {
            const progress = (this.currentTime - 13) / 1;

            ctx.fillStyle = '#ff0000';
            ctx.font = `bold ${Math.floor(28 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.globalAlpha = progress;

            ctx.fillText('WARNING: CORE BREACH', centerX, height - 100 * scale);
            ctx.globalAlpha = 1;
        }

        // 渲染阶段6的标题
        if (this.currentPhase === 5) {
            ctx.save();
            ctx.globalAlpha = this.titleAlpha;
            ctx.translate(centerX, centerY);
            ctx.scale(this.titleScale, this.titleScale);

            ctx.shadowColor = '#ff0088';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#ff0088';
            ctx.font = `bold ${Math.floor(48 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('THE BSOD', 0, 0);

            ctx.restore();
        }
    }
}

/**
 * 第二关到第三关过渡动画
 * 展示从桌面封锁线到蓝屏核心的过渡
 */
class Level2To3Transition {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // 计算缩放比例
        this.scale = Math.min(this.width, this.height) / 400;
        this.scale = Math.max(0.5, Math.min(1.5, this.scale));

        // 动画状态
        this.totalDuration = 20;
        this.currentTime = 0;
        this.isComplete = false;

        // 阶段配置
        this.phases = [
            { start: 0, end: 4, name: 'celebration' },      // 通关庆祝
            { start: 4, end: 7, name: 'close_dialog' },     // 关闭弹窗
            { start: 7, end: 10, name: 'desktop_save' },    // 桌面恢复
            { start: 10, end: 14, name: 'system_error' },   // 系统错误
            { start: 14, end: 17, name: 'bsod_start' },     // 蓝屏开始
            { start: 17, end: 20, name: 'game_start' }      // 游戏开始
        ];

        this.currentPhase = 0;

        // 庆祝动画属性
        this.confetti = [];
        this.celebrationAlpha = 0;
        this.celebrationScale = 0;

        // 删除弹窗属性
        this.deleteWindowScale = 1;
        this.deleteWindowAlpha = 1;

        // 桌面图标
        this.desktopIcons = this.generateDesktopIcons();
        this.desktopAlpha = 0;

        // 蓝屏效果
        this.bsodColor = { r: 0, g: 120, b: 215 };
        this.bsodLines = [];
        this.glitchOffset = 0;

        // 背景颜色
        this.bgColor = { r: 100, g: 100, b: 100 };
        this.targetBgColor = { r: 100, g: 100, b: 100 };

        // 音效计时器
        this.soundTimer = 0;
        this.lastSoundTime = 0;
    }

    /**
     * 生成桌面图标
     */
    generateDesktopIcons() {
        return [
            { name: '我的电脑', x: 20, y: 20, infected: false },
            { name: '毕业论文', x: 20, y: 100, infected: false, saved: true },
            { name: '回收站', x: 20, y: 180, infected: false },
            { name: '浏览器', x: 20, y: 260, infected: false }
        ];
    }

    /**
     * 开始动画
     */
    start() {
        this.currentTime = 0;
        this.isComplete = false;
        this.currentPhase = 0;
        this.confetti = [];
        this.celebrationAlpha = 0;
        this.celebrationScale = 0;
        this.deleteWindowScale = 1;
        this.deleteWindowAlpha = 1;
        this.desktopAlpha = 0;
        this.bsodLines = [];
        this.glitchOffset = 0;
        this.targetBgColor = { r: 100, g: 100, b: 100 };

        // 生成庆祝彩带
        this.generateConfetti();
        this.generateBSODLines();
    }

    /**
     * 生成庆祝彩带
     */
    generateConfetti() {
        const colors = ['#00ff00', '#00ffff', '#ffff00', '#00ff88', '#88ff00'];
        for (let i = 0; i < 50; i++) {
            this.confetti.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height - this.height,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 100 + 50,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 200,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Utils.random(5, 15),
                alpha: 1
            });
        }
    }

    /**
     * 生成蓝屏代码行
     */
    generateBSODLines() {
        const lines = [
            'STOP: 0x0000007E',
            'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED',
            'A problem has been detected...',
            'Virus detected in system core',
            'Initiating BSOD protocol',
            'Memory dump in progress...',
            'CRITICAL ERROR: CORE BREACH'
        ];
        this.bsodLines = lines;
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.isComplete) return;

        // 保存deltaTime供updateSounds使用
        this.deltaTime = deltaTime;

        this.currentTime += deltaTime;

        // 更新阶段
        for (let i = 0; i < this.phases.length; i++) {
            if (this.currentTime >= this.phases[i].start &&
                this.currentTime < this.phases[i].end) {
                this.currentPhase = i;
                break;
            }
        }

        // 更新音效
        this.updateSounds();

        // 更新阶段
        switch (this.phases[this.currentPhase].name) {
            case 'celebration':
                this.updateCelebration(deltaTime);
                break;
            case 'close_dialog':
                this.updateCloseDialog(deltaTime);
                break;
            case 'desktop_save':
                this.updateDesktopSave(deltaTime);
                break;
            case 'system_error':
                this.updateSystemError(deltaTime);
                break;
            case 'bsod_start':
                this.updateBSODStart(deltaTime);
                break;
            case 'game_start':
                this.updateGameStart(deltaTime);
                break;
        }

        // 更新彩带
        this.confetti = this.confetti.filter(c => {
            c.x += c.vx * deltaTime;
            c.y += c.vy * deltaTime;
            c.rotation += c.rotationSpeed * deltaTime;
            c.alpha = Math.max(0, c.alpha - deltaTime * 0.3);
            return c.y < this.height + 50 && c.alpha > 0;
        });

        // 更新背景颜色
        this.bgColor.r = Utils.lerp(this.bgColor.r, this.targetBgColor.r, 0.1);
        this.bgColor.g = Utils.lerp(this.bgColor.g, this.targetBgColor.g, 0.1);
        this.bgColor.b = Utils.lerp(this.bgColor.b, this.targetBgColor.b, 0.1);

        // 更新蓝屏颜色
        this.bsodColor.r = Utils.lerp(this.bsodColor.r, this.targetBgColor.r, 0.05);
        this.bsodColor.g = Utils.lerp(this.bsodColor.g, this.targetBgColor.g, 0.05);
        this.bsodColor.b = Utils.lerp(this.bsodColor.b, this.targetBgColor.b, 0.05);

        // 更新故障效果
        this.glitchOffset = Math.sin(Date.now() / 50) * 10;

        // 检查完成
        if (this.currentTime >= this.totalDuration) {
            this.isComplete = true;
        }
    }

    /**
     * 更新音效
     */
    updateSounds() {
        this.soundTimer += this.deltaTime || 0.016;

        const phase = this.phases[this.currentPhase].name;

        switch (phase) {
            case 'celebration':
                // 庆祝音
                if (this.currentTime >= 0.5 && this.currentTime < 1) {
                    audioManager.play('levelComplete');
                }
                break;
            case 'close_dialog':
                // 关闭音
                if (this.currentTime >= 4 && this.currentTime < 5) {
                    audioManager.play('menuClick');
                }
                break;
            case 'desktop_save':
                // 保存音
                if (this.soundTimer - this.lastSoundTime > 2) {
                    audioManager.play('menuClick');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'system_error':
                // 警报声
                if (this.currentTime >= 10 && this.currentTime < 11) {
                    audioManager.play('error');
                }
                if (this.soundTimer - this.lastSoundTime > 0.5) {
                    audioManager.play('heartbeat');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'bsod_start':
                // 爆炸音
                if (this.soundTimer - this.lastSoundTime > 0.6) {
                    audioManager.play('explosion');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'game_start':
                // BGM
                if (this.currentTime >= 17) {
                    audioManager.play('levelComplete');
                }
                break;
        }
    }

    /**
     * 更新通关庆祝阶段
     */
    updateCelebration(deltaTime) {
        const progress = this.currentTime / 4;

        this.celebrationAlpha = Math.min(1, this.currentTime * 0.8);
        this.celebrationScale = Utils.lerp(this.celebrationScale, 1, deltaTime * 3);

        // 背景变暗
        this.targetBgColor = { r: 50, g: 50, b: 50 };
    }

    /**
     * 更新关闭弹窗阶段
     */
    updateCloseDialog(deltaTime) {
        const progress = (this.currentTime - 4) / 3;

        // 删除弹窗缩小消失
        this.deleteWindowScale = Utils.lerp(1, 0, progress);
        this.deleteWindowAlpha = Utils.lerp(1, 0, progress);

        // 背景变亮
        this.targetBgColor = { r: 0, g: 120, b: 215 };
    }

    /**
     * 更新桌面恢复阶段
     */
    updateDesktopSave(deltaTime) {
        const progress = (this.currentTime - 7) / 3;

        this.desktopAlpha = Utils.lerp(0, 1, progress);

        // 背景保持桌面颜色
        this.targetBgColor = { r: 0, g: 120, b: 215 };
    }

    /**
     * 更新系统错误阶段
     */
    updateSystemError(deltaTime) {
        const progress = (this.currentTime - 10) / 4;

        // 背景变蓝
        this.targetBgColor = {
            r: Utils.lerp(0, 0, progress),
            g: Utils.lerp(120, 120, progress),
            b: Utils.lerp(215, 215, progress)
        };

        // 桌面图标消失
        this.desktopAlpha = Utils.lerp(1, 0, progress);
    }

    /**
     * 更新蓝屏开始阶段
     */
    updateBSODStart(deltaTime) {
        const progress = (this.currentTime - 14) / 3;

        // 背景变成蓝屏颜色
        this.targetBgColor = {
            r: Utils.lerp(0, 0, progress),
            g: Utils.lerp(120, 128, progress),
            b: Utils.lerp(215, 255, progress)
        };
    }

    /**
     * 更新游戏开始阶段
     */
    updateGameStart(deltaTime) {
        const progress = (this.currentTime - 17) / 3;

        // 背景变黑
        this.targetBgColor = {
            r: Utils.lerp(0, 0, progress),
            g: Utils.lerp(128, 0, progress),
            b: Utils.lerp(255, 0, progress)
        };
    }

    /**
     * 渲染动画
     */
    render() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const scale = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // 背景
        ctx.fillStyle = `rgb(${this.bgColor.r}, ${this.bgColor.g}, ${this.bgColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // 阶段1: 通关庆祝
        if (this.currentPhase === 0) {
            // 渲染彩带
            this.confetti.forEach(c => {
                ctx.save();
                ctx.globalAlpha = c.alpha;
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation * Math.PI / 180);
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
                ctx.restore();
            });

            // 渲染庆祝文字
            ctx.save();
            ctx.globalAlpha = this.celebrationAlpha;
            ctx.translate(centerX, centerY - 50 * scale);
            ctx.scale(this.celebrationScale, this.celebrationScale);

            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#00ff00';
            ctx.font = `bold ${Math.floor(36 * scale)}px "Microsoft YaHei", Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('恭喜你，论文没有被删除！', 0, 0);

            ctx.font = `${Math.floor(18 * scale)}px "Microsoft YaHei", Arial`;
            ctx.fillText('桌面封锁线 胜利！', 0, 40 * scale);

            ctx.restore();
        }

        // 阶段2: 关闭弹窗
        if (this.currentPhase === 1 && this.deleteWindowScale > 0) {
            this.renderDeleteWindow(ctx, scale, centerX, centerY);
        }

        // 阶段3-4: 桌面
        if (this.currentPhase >= 2 && this.currentPhase <= 3 && this.desktopAlpha > 0) {
            this.renderDesktop(ctx, scale, width, height);
        }

        // 阶段4-5: 蓝屏效果
        if (this.currentPhase >= 3) {
            this.renderBSOD(ctx, scale, width, height);
        }

        // 阶段6: 游戏开始
        if (this.currentPhase === 5) {
            const progress = (this.currentTime - 17) / 3;

            ctx.save();
            ctx.globalAlpha = progress;
            ctx.translate(centerX, centerY);

            ctx.shadowColor = '#ff0088';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#ff0088';
            ctx.font = `bold ${Math.floor(48 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('THE BSOD', 0, 0);

            ctx.font = `${Math.floor(24 * scale)}px "Microsoft YaHei", Arial`;
            ctx.fillText('蓝屏核心', 0, 40 * scale);

            ctx.restore();
        }
    }

    /**
     * 渲染删除弹窗（显示保存成功）
     */
    renderDeleteWindow(ctx, scale, centerX, centerY) {
        ctx.save();
        ctx.globalAlpha = this.deleteWindowAlpha;
        ctx.translate(centerX, centerY);
        ctx.scale(this.deleteWindowScale, this.deleteWindowScale);
        ctx.translate(-160 * scale, -100 * scale);

        // 窗口背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 320 * scale, 200 * scale);

        // 标题栏
        ctx.fillStyle = '#0078d7';
        ctx.fillRect(0, 0, 320 * scale, 30 * scale);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('删除文件夹', 10 * scale, 20 * scale);

        // 绿色勾选图标
        const iconSize = 40 * scale;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(20 * scale + iconSize / 2, 60 * scale + 5 * scale);
        ctx.lineTo(20 * scale + 15 * scale, 60 * scale + iconSize / 2);
        ctx.lineTo(20 * scale + iconSize - 5 * scale, 60 * scale + 10 * scale);
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = '#00ff00';
        ctx.stroke();

        // 文字
        ctx.fillStyle = '#000000';
        ctx.font = `${11 * scale}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('操作已取消，文件已保存！', 70 * scale, 70 * scale);

        ctx.fillStyle = '#00ff00';
        ctx.font = `${11 * scale}px Arial`;
        ctx.fillText('毕业论文', 70 * scale, 95 * scale);

        // 确定按钮
        const buttonWidth = 70 * scale;
        const buttonHeight = 25 * scale;
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(125 * scale, 160 * scale, buttonWidth, buttonHeight);
        ctx.strokeStyle = '#a0a0a0';
        ctx.strokeRect(125 * scale, 160 * scale, buttonWidth, buttonHeight);
        ctx.fillStyle = '#000000';
        ctx.font = `${11 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('确定', 160 * scale, 176 * scale);

        ctx.restore();
    }

    /**
     * 渲染桌面
     */
    renderDesktop(ctx, scale, width, height) {
        ctx.globalAlpha = this.desktopAlpha;

        // 桌面背景
        ctx.fillStyle = '#0078d7';
        ctx.fillRect(0, 0, width, height);

        // 渲染桌面图标
        this.desktopIcons.forEach(icon => {
            ctx.save();
            ctx.translate(icon.x * scale, icon.y * scale);

            // 图标背景
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(0, 0, 60 * scale, 60 * scale);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2 * scale;
            ctx.strokeRect(0, 0, 60 * scale, 60 * scale);

            // 图标名称
            ctx.fillStyle = '#ffffff';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(icon.name, 30 * scale, 75 * scale);

            // 保存成功标记
            if (icon.saved) {
                ctx.fillStyle = '#00ff00';
                ctx.font = `bold ${20 * scale}px Arial`;
                ctx.fillText('✓', 30 * scale, 40 * scale);
            }

            ctx.restore();
        });

        // 任务栏
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, height - 50 * scale, width, 50 * scale);

        ctx.globalAlpha = 1;
    }

    /**
     * 渲染蓝屏效果
     */
    renderBSOD(ctx, scale, width, height) {
        // 蓝屏背景
        ctx.fillStyle = `rgb(${this.bsodColor.r}, ${this.bsodColor.g}, ${this.bsodColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // 故障效果
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx.fillRect(this.glitchOffset * scale, 0, width, height);
        ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.fillRect(-this.glitchOffset * scale, 0, width, height);
        ctx.restore();

        // 悲伤表情
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(80 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(':(', width / 2, 120 * scale);

        // 错误代码
        ctx.font = `${Math.floor(16 * scale)}px Arial`;
        ctx.textAlign = 'left';

        const startY = 180 * scale;
        const lineHeight = 25 * scale;

        this.bsodLines.forEach((line, index) => {
            const y = startY + index * lineHeight;
            if (y > 0 && y < height) {
                ctx.globalAlpha = 0.8;
                ctx.fillText(line, 50 * scale, y);
            }
        });

        ctx.globalAlpha = 1;
    }
}

/**
 * 关卡开场动画管理器
 */
class LevelIntroManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.currentIntro = null;
        this.levelType = null;
    }

    /**
     * 开始指定关卡的开场动画
     */
    startIntro(levelType) {
        this.levelType = levelType;

        switch (levelType) {
            case LevelType.DOCUMENT:
                this.currentIntro = new DocumentIntro(this.canvas, this.ctx);
                break;
            case LevelType.DESKTOP:
                this.currentIntro = new DesktopIntro(this.canvas, this.ctx);
                break;
            case LevelType.BSOD:
                this.currentIntro = new BSODIntro(this.canvas, this.ctx);
                break;
        }

        if (this.currentIntro) {
            this.currentIntro.start();
        }
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.currentIntro) {
            this.currentIntro.update(deltaTime);
        }
    }

    /**
     * 渲染动画
     */
    render() {
        if (this.currentIntro) {
            this.currentIntro.render();
        }
    }

    /**
     * 检查动画是否完成
     */
    isComplete() {
        return this.currentIntro ? this.currentIntro.isComplete : false;
    }

    /**
     * 获取当前关卡类型
     */
    getLevelType() {
        return this.levelType;
    }

    /**
     * 重置
     */
    reset() {
        this.currentIntro = null;
        this.levelType = null;
    }
}

/**
 * 第一关到第二关过渡动画
 * 展示从文档保卫战到桌面封锁线的过渡
 */
class Level1To2Transition {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // 计算缩放比例
        this.scale = Math.min(this.width, this.height) / 400;
        this.scale = Math.max(0.5, Math.min(1.5, this.scale));

        // 动画状态
        this.totalDuration = 20;
        this.currentTime = 0;
        this.isComplete = false;

        // 阶段配置
        this.phases = [
            { start: 0, end: 4, name: 'celebration' },      // 通关庆祝
            { start: 4, end: 7, name: 'close_document' },   // 关闭文档
            { start: 7, end: 10, name: 'desktop' },         // 回到桌面
            { start: 10, end: 14, name: 'delete_warning' }, // 删除警告
            { start: 14, end: 17, name: 'virus_expose' },   // 病毒暴露
            { start: 17, end: 20, name: 'game_start' }      // 游戏开始
        ];

        this.currentPhase = 0;

        // 庆祝动画属性
        this.confetti = [];
        this.celebrationAlpha = 0;
        this.celebrationScale = 0;

        // Word窗口属性
        this.wordWindowScale = 1;
        this.wordWindowAlpha = 1;
        this.wordWindowY = 0;

        // 桌面图标
        this.desktopIcons = this.generateDesktopIcons();
        this.desktopAlpha = 0;

        // 删除弹窗
        this.deleteWindowScale = 0;
        this.deleteWindowShake = 0;
        this.warningPulse = 0;

        // 病毒粒子
        this.virusParticles = [];

        // 背景颜色
        this.bgColor = { r: 255, g: 255, b: 255 };
        this.targetBgColor = { r: 255, g: 255, b: 255 };

        // 音效计时器
        this.soundTimer = 0;
        this.lastSoundTime = 0;
    }

    /**
     * 生成桌面图标
     */
    generateDesktopIcons() {
        return [
            { name: '我的电脑', x: 20, y: 20, infected: false },
            { name: '毕业论文', x: 20, y: 100, infected: false, completed: true },
            { name: '回收站', x: 20, y: 180, infected: false },
            { name: '浏览器', x: 20, y: 260, infected: false }
        ];
    }

    /**
     * 开始动画
     */
    start() {
        this.currentTime = 0;
        this.isComplete = false;
        this.currentPhase = 0;
        this.confetti = [];
        this.celebrationAlpha = 0;
        this.celebrationScale = 0;
        this.wordWindowScale = 1;
        this.wordWindowAlpha = 1;
        this.wordWindowY = 0;
        this.desktopAlpha = 0;
        this.deleteWindowScale = 0;
        this.deleteWindowShake = 0;
        this.warningPulse = 0;
        this.virusParticles = [];
        this.targetBgColor = { r: 255, g: 255, b: 255 };

        // 重置桌面图标
        this.desktopIcons.forEach(icon => {
            icon.infected = false;
        });

        // 生成庆祝彩带
        this.generateConfetti();
    }

    /**
     * 生成庆祝彩带
     */
    generateConfetti() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        for (let i = 0; i < 50; i++) {
            this.confetti.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height - this.height,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 100 + 50,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 200,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Utils.random(5, 15),
                alpha: 1
            });
        }
    }

    /**
     * 更新动画
     */
    update(deltaTime) {
        if (this.isComplete) return;

        // 保存deltaTime供updateSounds使用
        this.deltaTime = deltaTime;

        this.currentTime += deltaTime;

        // 更新阶段
        for (let i = 0; i < this.phases.length; i++) {
            if (this.currentTime >= this.phases[i].start &&
                this.currentTime < this.phases[i].end) {
                this.currentPhase = i;
                break;
            }
        }

        // 更新音效
        this.updateSounds();

        // 更新阶段
        switch (this.phases[this.currentPhase].name) {
            case 'celebration':
                this.updateCelebration(deltaTime);
                break;
            case 'close_document':
                this.updateCloseDocument(deltaTime);
                break;
            case 'desktop':
                this.updateDesktop(deltaTime);
                break;
            case 'delete_warning':
                this.updateDeleteWarning(deltaTime);
                break;
            case 'virus_expose':
                this.updateVirusExpose(deltaTime);
                break;
            case 'game_start':
                this.updateGameStart(deltaTime);
                break;
        }

        // 更新彩带
        this.confetti = this.confetti.filter(c => {
            c.x += c.vx * deltaTime;
            c.y += c.vy * deltaTime;
            c.rotation += c.rotationSpeed * deltaTime;
            c.alpha = Math.max(0, c.alpha - deltaTime * 0.3);
            return c.y < this.height + 50 && c.alpha > 0;
        });

        // 更新病毒粒子
        this.virusParticles = this.virusParticles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.life -= deltaTime;
            p.alpha = p.life / p.maxLife;
            return p.life > 0;
        });

        // 更新背景颜色
        this.bgColor.r = Utils.lerp(this.bgColor.r, this.targetBgColor.r, 0.1);
        this.bgColor.g = Utils.lerp(this.bgColor.g, this.targetBgColor.g, 0.1);
        this.bgColor.b = Utils.lerp(this.bgColor.b, this.targetBgColor.b, 0.1);

        // 检查完成
        if (this.currentTime >= this.totalDuration) {
            this.isComplete = true;
        }
    }

    /**
     * 更新音效
     */
    updateSounds() {
        this.soundTimer += this.deltaTime || 0.016;

        const phase = this.phases[this.currentPhase].name;

        switch (phase) {
            case 'celebration':
                // 庆祝音
                if (this.currentTime >= 0.5 && this.currentTime < 1) {
                    audioManager.play('levelComplete');
                }
                break;
            case 'close_document':
                // 关闭音
                if (this.currentTime >= 4 && this.currentTime < 5) {
                    audioManager.play('menuClick');
                }
                break;
            case 'desktop':
                // 桌面音
                if (this.soundTimer - this.lastSoundTime > 2) {
                    audioManager.play('menuClick');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'delete_warning':
                // 警报声
                if (this.currentTime >= 10 && this.currentTime < 11) {
                    audioManager.play('error');
                }
                if (this.soundTimer - this.lastSoundTime > 0.5) {
                    audioManager.play('heartbeat');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'virus_expose':
                // 爆炸音
                if (this.soundTimer - this.lastSoundTime > 0.3) {
                    audioManager.play('explosion');
                    this.lastSoundTime = this.soundTimer;
                }
                break;
            case 'game_start':
                // BGM
                if (this.currentTime >= 17) {
                    audioManager.play('levelComplete');
                }
                break;
        }
    }

    /**
     * 更新通关庆祝阶段
     */
    updateCelebration(deltaTime) {
        const progress = this.currentTime / 4;

        // 庆祝文字淡入
        this.celebrationAlpha = Math.min(1, this.currentTime * 0.8);
        this.celebrationScale = Utils.lerp(this.celebrationScale, 1, deltaTime * 3);

        // 背景保持白色
        this.targetBgColor = { r: 255, g: 255, b: 255 };
    }

    /**
     * 更新关闭文档阶段
     */
    updateCloseDocument(deltaTime) {
        const progress = (this.currentTime - 4) / 3;

        // Word窗口缩小并向下移动
        this.wordWindowScale = Utils.lerp(1, 0, progress);
        this.wordWindowAlpha = Utils.lerp(1, 0, progress);
        this.wordWindowY = progress * 100;

        // 背景逐渐变灰
        this.targetBgColor = {
            r: Utils.lerp(255, 200, progress),
            g: Utils.lerp(255, 200, progress),
            b: Utils.lerp(255, 200, progress)
        };
    }

    /**
     * 更新回到桌面阶段
     */
    updateDesktop(deltaTime) {
        const progress = (this.currentTime - 7) / 3;

        // 桌面淡入
        this.desktopAlpha = Utils.lerp(0, 1, progress);

        // 背景变成桌面颜色
        this.targetBgColor = { r: 0, g: 120, b: 215 };
    }

    /**
     * 更新删除警告阶段
     */
    updateDeleteWarning(deltaTime) {
        const progress = (this.currentTime - 10) / 4;

        // 删除弹窗突然出现
        this.deleteWindowScale = progress < 0.1 ? progress * 10 : 1;

        // 警告脉动
        this.warningPulse = Math.sin(Date.now() / 100) * 0.1;

        // 弹窗抖动
        this.deleteWindowShake = Math.sin(Date.now() / 50) * progress * 3;

        // 背景变暗
        this.targetBgColor = {
            r: Utils.lerp(0, 40, progress),
            g: Utils.lerp(120, 40, progress),
            b: Utils.lerp(215, 60, progress)
        };
    }

    /**
     * 更新病毒暴露阶段
     */
    updateVirusExpose(deltaTime) {
        const progress = (this.currentTime - 14) / 3;

        // 生成病毒粒子
        if (Math.random() < progress * deltaTime * 10) {
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(100, 300);

            this.virusParticles.push({
                x: centerX + (Math.random() - 0.5) * 100,
                y: centerY + (Math.random() - 0.5) * 100,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.random(10, 30),
                color: '#ff0000',
                life: Utils.random(2, 3),
                maxLife: 3
            });
        }

        // 感染桌面图标
        this.desktopIcons.forEach(icon => {
            if (!icon.infected && Math.random() < progress * deltaTime * 2) {
                icon.infected = true;
            }
        });

        // 弹窗剧烈抖动
        this.deleteWindowShake = Math.sin(Date.now() / 30) * (5 + progress * 10);

        // 背景变红
        this.targetBgColor = {
            r: Utils.lerp(40, 100, progress),
            g: Utils.lerp(40, 20, progress),
            b: Utils.lerp(60, 20, progress)
        };
    }

    /**
     * 更新游戏开始阶段
     */
    updateGameStart(deltaTime) {
        const progress = (this.currentTime - 17) / 3;

        // 弹窗消失
        this.deleteWindowScale = Utils.lerp(1, 0, progress);

        // 背景变黑
        this.targetBgColor = {
            r: Utils.lerp(100, 0, progress),
            g: Utils.lerp(20, 0, progress),
            b: Utils.lerp(20, 0, progress)
        };
    }

    /**
     * 渲染动画
     */
    render() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        const scale = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // 背景
        ctx.fillStyle = `rgb(${this.bgColor.r}, ${this.bgColor.g}, ${this.bgColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // 阶段1: 通关庆祝
        if (this.currentPhase === 0) {
            // 渲染彩带
            this.confetti.forEach(c => {
                ctx.save();
                ctx.globalAlpha = c.alpha;
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation * Math.PI / 180);
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
                ctx.restore();
            });

            // 渲染庆祝文字
            ctx.save();
            ctx.globalAlpha = this.celebrationAlpha;
            ctx.translate(centerX, centerY - 50 * scale);
            ctx.scale(this.celebrationScale, this.celebrationScale);

            // 外发光
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#00ff00';
            ctx.font = `bold ${Math.floor(36 * scale)}px "Microsoft YaHei", Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('恭喜你，论文完成了！', 0, 0);

            ctx.font = `${Math.floor(18 * scale)}px "Microsoft YaHei", Arial`;
            ctx.fillText('文档保卫战 胜利！', 0, 40 * scale);

            ctx.restore();
        }

        // 阶段2: 关闭文档
        if (this.currentPhase === 1) {
            this.renderWordWindow(ctx, scale);
        }

        // 阶段3-5: 桌面
        if (this.currentPhase >= 2 && this.currentPhase <= 4) {
            this.renderDesktop(ctx, scale, width, height);
        }

        // 阶段3-4: 删除弹窗
        if (this.currentPhase >= 3 && this.currentPhase <= 4 && this.deleteWindowScale > 0) {
            this.renderDeleteWindow(ctx, scale, centerX, centerY);
        }

        // 阶段4: 病毒粒子
        if (this.currentPhase >= 4) {
            this.virusParticles.forEach(p => {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            });
            ctx.globalAlpha = 1;
        }

        // 阶段6: 游戏开始
        if (this.currentPhase === 5) {
            const progress = (this.currentTime - 17) / 3;

            ctx.save();
            ctx.globalAlpha = progress;
            ctx.translate(centerX, centerY);

            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 30 * scale;

            ctx.fillStyle = '#00ffff';
            ctx.font = `bold ${Math.floor(48 * scale)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('THE DESKTOP', 0, 0);

            ctx.font = `${Math.floor(24 * scale)}px "Microsoft YaHei", Arial`;
            ctx.fillText('桌面封锁线', 0, 40 * scale);

            ctx.restore();
        }
    }

    /**
     * 渲染Word窗口
     */
    renderWordWindow(ctx, scale) {
        ctx.save();
        ctx.globalAlpha = this.wordWindowAlpha;
        ctx.translate(this.width / 2, this.height / 2 + this.wordWindowY);
        ctx.scale(this.wordWindowScale, this.wordWindowScale);
        ctx.translate(-200 * scale, -150 * scale);

        // 窗口背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400 * scale, 300 * scale);

        // 标题栏
        ctx.fillStyle = '#2b579a';
        ctx.fillRect(0, 0, 400 * scale, 40 * scale);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('毕业论文_最终版.docx - Word', 10 * scale, 26 * scale);

        // 文档内容
        ctx.fillStyle = '#000000';
        ctx.font = `${12 * scale}px Arial`;
        ctx.fillText('摘要：本文研究了基于深度学习的图像识别技术...', 20 * scale, 70 * scale);
        ctx.fillText('关键词：深度学习；卷积神经网络；图像识别', 20 * scale, 90 * scale);

        ctx.restore();
    }

    /**
     * 渲染桌面
     */
    renderDesktop(ctx, scale, width, height) {
        ctx.globalAlpha = this.desktopAlpha;

        // 桌面背景
        ctx.fillStyle = '#0078d7';
        ctx.fillRect(0, 0, width, height);

        // 渲染桌面图标
        this.desktopIcons.forEach(icon => {
            ctx.save();
            ctx.translate(icon.x * scale, icon.y * scale);

            // 图标背景
            if (icon.infected) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            }
            ctx.fillRect(0, 0, 60 * scale, 60 * scale);

            // 图标边框
            ctx.strokeStyle = icon.infected ? '#ff0000' : 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2 * scale;
            ctx.strokeRect(0, 0, 60 * scale, 60 * scale);

            // 图标名称
            ctx.fillStyle = '#ffffff';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(icon.name, 30 * scale, 75 * scale);

            // 完成标记
            if (icon.completed) {
                ctx.fillStyle = '#00ff00';
                ctx.font = `bold ${20 * scale}px Arial`;
                ctx.fillText('✓', 30 * scale, 40 * scale);
            }

            // 感染标记
            if (icon.infected) {
                ctx.fillStyle = '#ff0000';
                ctx.font = `bold ${20 * scale}px Arial`;
                ctx.fillText('✕', 30 * scale, 40 * scale);
            }

            ctx.restore();
        });

        // 任务栏
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, height - 50 * scale, width, 50 * scale);

        ctx.globalAlpha = 1;
    }

    /**
     * 渲染删除弹窗
     */
    renderDeleteWindow(ctx, scale, centerX, centerY) {
        ctx.save();
        ctx.translate(centerX + this.deleteWindowShake, centerY);
        ctx.scale(this.deleteWindowScale, this.deleteWindowScale);
        ctx.translate(-160 * scale, -100 * scale);

        // 窗口背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 320 * scale, 200 * scale);

        // 标题栏
        ctx.fillStyle = '#0078d7';
        ctx.fillRect(0, 0, 320 * scale, 30 * scale);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('删除文件夹', 10 * scale, 20 * scale);

        // 警告图标
        const iconSize = 40 * scale;
        ctx.save();
        ctx.translate(20 * scale + iconSize / 2, 60 * scale + iconSize / 2);
        ctx.scale(1 + this.warningPulse, 1 + this.warningPulse);
        ctx.translate(-iconSize / 2, -iconSize / 2);

        ctx.fillStyle = '#ffc000';
        ctx.beginPath();
        ctx.moveTo(iconSize / 2, 0);
        ctx.lineTo(iconSize, iconSize);
        ctx.lineTo(0, iconSize);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${24 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('!', iconSize / 2, iconSize * 0.7);

        ctx.restore();

        // 警告文字
        ctx.fillStyle = '#000000';
        ctx.font = `${11 * scale}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('确实要永久性地删除此文件夹吗？', 70 * scale, 70 * scale);

        // 文件夹图标
        ctx.fillStyle = '#ffc000';
        ctx.beginPath();
        ctx.moveTo(70 * scale, 90 * scale);
        ctx.lineTo(78 * scale, 82 * scale);
        ctx.lineTo(98 * scale, 82 * scale);
        ctx.lineTo(98 * scale, 90 * scale);
        ctx.lineTo(102 * scale, 90 * scale);
        ctx.lineTo(102 * scale, 105 * scale);
        ctx.lineTo(70 * scale, 105 * scale);
        ctx.closePath();
        ctx.fill();

        // 文件夹名称
        ctx.fillStyle = '#000000';
        ctx.fillText('毕业论文', 110 * scale, 100 * scale);

        // 按钮
        const buttonWidth = 70 * scale;
        const buttonHeight = 25 * scale;
        const buttonY = 160 * scale;

        // 是按钮
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(80 * scale, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = '#a0a0a0';
        ctx.strokeRect(80 * scale, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = '#000000';
        ctx.font = `${11 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('是(Y)', 115 * scale, buttonY + 16 * scale);

        // 否按钮
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(170 * scale, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = '#a0a0a0';
        ctx.strokeRect(170 * scale, buttonY, buttonWidth, buttonHeight);
        ctx.fillText('否(N)', 205 * scale, buttonY + 16 * scale);

        ctx.restore();
    }
}
