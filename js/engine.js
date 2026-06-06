/**
 * 游戏引擎核心
 * 管理游戏循环、状态、渲染和交互
 */

/**
 * 游戏状态枚举
 */
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    LEVEL_INTRO: 'levelIntro',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_TRANSITION: 'levelTransition',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};

/**
 * 游戏引擎类
 */
class GameEngine {
    constructor() {
        // Canvas设置
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;

        // 游戏状态
        this.state = GameState.LOADING;
        this.isRunning = false;
        this.isPaused = false;

        // 时间管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameTime = 0;
        this.fps = 0;

        // 游戏系统
        this.virusManager = null;
        this.effectsManager = null;
        this.levelManager = null;
        this.uiManager = null;
        this.levelIntroManager = null;
        this.levelTransition = null; // 关卡过渡动画

        // 道具系统
        this.powerups = {
            timePatch: { count: 0, icon: '⏰', color: '#00ff00', name: '时空补丁' },
            freeze: { count: 0, icon: '❄️', color: '#00ffff', name: '绝对零度' },
            bomb: { count: 0, icon: '💣', color: '#ff8800', name: '逻辑炸弹' }
        };
        this.activeFreeze = false;
        this.freezeTimer = 0;

        // 触摸/鼠标输入
        this.inputPosition = { x: 0, y: 0 };
        this.isTouching = false;

        // 错误处理
        this.hasError = false;
        this.errorMessage = '';

        // 初始化
        this.init();
    }

    /**
     * 初始化游戏引擎
     */
    init() {
        try {
            // 获取Canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            this.ctx = this.canvas.getContext('2d');

            // 设置Canvas尺寸
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());

            // 初始化游戏系统
            this.virusManager = new VirusManager();
            this.effectsManager = new EffectsManager(this.canvas, this.ctx);
            this.levelManager = new LevelManager();
            this.uiManager = new UIManager(this.canvas, this.ctx);
            this.levelIntroManager = new LevelIntroManager(this.canvas, this.ctx);

            // 设置输入监听
            this.setupInputListeners();

            // 初始化音频
            this.setupAudio();

            // 显示加载完成
            this.state = GameState.MENU;
            this.uiManager.setState(UIState.MENU);

            console.log('Game engine initialized successfully');

        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 调整Canvas尺寸
     */
    resizeCanvas() {
        const container = document.getElementById('game-container');
        if (!container) {
            console.error('Game container not found');
            return;
        }

        const rect = container.getBoundingClientRect();

        // 确保尺寸有效
        const containerWidth = Math.max(rect.width, window.innerWidth);
        const containerHeight = Math.max(rect.height, window.innerHeight);

        // 获取设备像素比
        const pixelRatio = Math.min(Utils.getPixelRatio(), 2); // 限制最大为2，避免性能问题

        // 重置上下文变换
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // 设置Canvas实际尺寸
        this.canvas.width = containerWidth * pixelRatio;
        this.canvas.height = containerHeight * pixelRatio;

        // 设置显示尺寸
        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = containerHeight + 'px';

        // 应用缩放
        this.ctx.scale(pixelRatio, pixelRatio);

        // 更新尺寸
        this.width = containerWidth;
        this.height = containerHeight;

        console.log(`Canvas resized: ${this.width}x${this.height}, pixelRatio: ${pixelRatio}`);
    }

    /**
     * 设置输入监听
     */
    setupInputListeners() {
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    /**
     * 设置音频
     */
    setupAudio() {
        // 首次用户交互时初始化音频
        const initAudio = () => {
            audioManager.init();
            document.removeEventListener('touchstart', initAudio);
            document.removeEventListener('mousedown', initAudio);
        };

        document.addEventListener('touchstart', initAudio, { once: true });
        document.addEventListener('mousedown', initAudio, { once: true });
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
        e.preventDefault();

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();

        this.inputPosition.x = touch.clientX - rect.left;
        this.inputPosition.y = touch.clientY - rect.top;
        this.isTouching = true;

        this.handleInput(this.inputPosition.x, this.inputPosition.y);
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        e.preventDefault();

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();

        this.inputPosition.x = touch.clientX - rect.left;
        this.inputPosition.y = touch.clientY - rect.top;
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
        e.preventDefault();
        this.isTouching = false;
    }

    /**
     * 处理鼠标按下
     */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();

        this.inputPosition.x = e.clientX - rect.left;
        this.inputPosition.y = e.clientY - rect.top;
        this.isTouching = true;

        this.handleInput(this.inputPosition.x, this.inputPosition.y);
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();

        this.inputPosition.x = e.clientX - rect.left;
        this.inputPosition.y = e.clientY - rect.top;
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp(e) {
        this.isTouching = false;
    }

    /**
     * 处理键盘按下
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                if (this.state === GameState.PLAYING) {
                    this.pauseGame();
                } else if (this.state === GameState.PAUSED) {
                    this.resumeGame();
                }
                break;
            case ' ':
                if (this.state === GameState.PLAYING) {
                    // 空格键暂停
                    this.pauseGame();
                }
                break;
        }
    }

    /**
     * 处理键盘释放
     */
    handleKeyUp(e) {
        // 可以添加键盘释放逻辑
    }

    /**
     * 处理输入
     */
    handleInput(x, y) {
        try {
            switch (this.state) {
                case GameState.MENU:
                    this.handleMenuInput(x, y);
                    break;
                case GameState.LEVEL_INTRO:
                    // 关卡开场动画期间点击跳过
                    this.skipLevelIntro();
                    break;
                case GameState.PLAYING:
                    this.handleGameInput(x, y);
                    break;
                case GameState.PAUSED:
                    this.handlePausedInput(x, y);
                    break;
                case GameState.LEVEL_TRANSITION:
                    this.handleTransitionInput(x, y);
                    break;
                case GameState.GAME_OVER:
                    this.handleGameOverInput(x, y);
                    break;
                case GameState.VICTORY:
                    this.handleVictoryInput(x, y);
                    break;
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 处理菜单输入
     */
    handleMenuInput(x, y) {
        const action = this.uiManager.handleClick(x, y);

        if (action === 'start') {
            this.startGame();
        } else if (action === 'leaderboard') {
            this.uiManager.setState(UIState.LEADERBOARD);
            this.state = GameState.MENU;
        }
    }

    /**
     * 处理游戏输入
     */
    handleGameInput(x, y) {
        // 检查是否点击道具
        if (this.checkPowerupClick(x, y)) {
            return;
        }

        // 检查是否点击病毒
        const result = this.virusManager.handleClick(x, y);

        if (result && result.hit) {
            this.processHitResult(result);
        }
    }

    /**
     * 检查道具点击
     */
    checkPowerupClick(x, y) {
        // 与UIManager中的道具栏渲染逻辑一致
        const size = Math.max(40, Math.min(55, Math.min(this.width, this.height) * 0.12));
        const spacing = Math.max(5, size * 0.2);
        const startX = 15;
        const startY = this.height - size - 25;

        const powerupKeys = ['timePatch', 'freeze', 'bomb'];

        for (let i = 0; i < powerupKeys.length; i++) {
            const key = powerupKeys[i];
            const powerup = this.powerups[key];

            if (powerup.count > 0) {
                const px = startX + i * (size + spacing);

                if (Utils.pointInRect(x, y, px, startY, size, size)) {
                    this.usePowerup(key);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 使用道具
     */
    usePowerup(type) {
        if (this.powerups[type].count <= 0) return;

        this.powerups[type].count--;
        audioManager.play('powerup');

        switch (type) {
            case 'timePatch':
                // 时空补丁：增加15秒
                const level = this.levelManager.getCurrentLevel();
                if (level) {
                    level.remainingTime += 15;
                    audioManager.play('timePatch');
                    this.effectsManager.addFlashEffect('rgba(0, 255, 0, 0.3)', 0.5);
                }
                break;

            case 'freeze':
                // 绝对零度：冻结5秒
                this.activeFreeze = true;
                this.freezeTimer = 5;
                audioManager.play('freeze');
                this.effectsManager.addFlashEffect('rgba(0, 255, 255, 0.5)', 0.5);
                break;

            case 'bomb':
                // 逻辑炸弹：清除所有红色病毒
                const cleared = this.virusManager.clearAllViruses();
                audioManager.play('explosion');
                this.effectsManager.addFlashEffect('rgba(255, 100, 0, 0.5)', 0.3);
                this.effectsManager.addShakeEffect(20, 0.5);

                // 添加爆炸效果
                cleared.forEach(virus => {
                    this.effectsManager.addExplosion(virus.x, virus.y, virus.color, 30);
                    this.effectsManager.addScorePopup(virus.x, virus.y, virus.score, '#ffff00');
                });
                break;
        }
    }

    /**
     * 处理命中结果
     */
    processHitResult(result) {
        const level = this.levelManager.getCurrentLevel();
        if (!level) return;

        if (result.killed) {
            // 击杀病毒
            const isCombo = level.currentCombo > 0 && level.comboTimer > 0;
            const killResult = level.addKill(result.score, isCombo);

            // 添加视觉效果
            this.effectsManager.addExplosion(
                result.position.x,
                result.position.y,
                result.virus.color,
                20
            );

            this.effectsManager.addScorePopup(
                result.position.x,
                result.position.y,
                killResult.score,
                killResult.isOverload ? '#ff0' : '#fff'
            );

            // 添加波纹效果
            this.effectsManager.addRippleEffect(
                result.position.x,
                result.position.y,
                result.virus.color
            );

            // 如果病毒携带道具
            if (result.hasPowerup) {
                this.dropPowerup();
            }

        } else if (result.type === VirusType.DECOY) {
            // 点击了迷惑病毒
            level.addMiss(result.virus.penalty || -50);
            level.remainingTime = Math.max(0, level.remainingTime - 5);

            audioManager.play('error');
            this.effectsManager.addShakeEffect(15, 0.3);
            this.effectsManager.addFlashEffect('rgba(255, 0, 0, 0.5)', 0.2);

            this.effectsManager.addScorePopup(
                result.position.x,
                result.position.y,
                -50,
                '#ff0000'
            );
        }
    }

    /**
     * 掉落道具
     */
    dropPowerup() {
        const types = ['timePatch', 'freeze', 'bomb'];
        const type = types[Utils.randomInt(0, types.length - 1)];

        this.powerups[type].count++;
        this.effectsManager.addFlashEffect('rgba(255, 215, 0, 0.3)', 0.3);
    }

    /**
     * 处理暂停输入
     */
    handlePausedInput(x, y) {
        const action = this.uiManager.handleClick(x, y);

        if (action === 'resume') {
            this.resumeGame();
        } else if (action === 'restart') {
            this.restartGame();
        } else if (action === 'quit') {
            this.quitToMenu();
        }
    }

    /**
     * 处理过渡输入
     */
    handleTransitionInput(x, y) {
        const action = this.uiManager.handleClick(x, y);

        if (action === 'next') {
            this.startNextLevel();
        }
    }

    /**
     * 处理游戏结束输入
     */
    handleGameOverInput(x, y) {
        const action = this.uiManager.handleClick(x, y);

        if (action === 'retry') {
            this.restartGame();
        } else if (action === 'menu') {
            this.quitToMenu();
        }
    }

    /**
     * 处理胜利输入
     */
    handleVictoryInput(x, y) {
        const action = this.uiManager.handleClick(x, y);

        if (action === 'menu') {
            this.quitToMenu();
        }
    }

    /**
     * 开始关卡开场动画
     */
    startLevelIntro(levelIndex) {
        this.state = GameState.LEVEL_INTRO;
        this.currentLevelIndex = levelIndex;

        // 根据关卡索引选择对应的动画类型
        let levelType;
        switch (levelIndex) {
            case 0:
                levelType = LevelType.DOCUMENT;
                break;
            case 1:
                levelType = LevelType.DESKTOP;
                break;
            case 2:
                levelType = LevelType.BSOD;
                break;
            default:
                levelType = LevelType.DOCUMENT;
        }

        this.levelIntroManager.startIntro(levelType);
        this.uiManager.setState(UIState.MENU); // 隐藏UI
    }

    /**
     * 跳过关卡开场动画
     */
    skipLevelIntro() {
        if (this.state === GameState.LEVEL_INTRO) {
            // 直接进入游戏
            this.state = GameState.PLAYING;
            this.startLevel(this.currentLevelIndex);
            this.uiManager.setState(UIState.PLAYING);
            audioManager.playBackgroundMusic();
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.levelManager.resetAll();
        this.virusManager.reset();
        this.effectsManager.clear();

        // 重置道具
        Object.keys(this.powerups).forEach(key => {
            this.powerups[key].count = 0;
        });

        // 启动第一关开场动画
        this.startLevelIntro(0);
    }

    /**
     * 开始指定关卡
     */
    startLevel(levelIndex) {
        const level = this.levelManager.startLevel(levelIndex, this.width, this.height);

        if (level) {
            this.virusManager.setLevel(levelIndex + 1);
            this.virusManager.reset();
            this.activeFreeze = false;
            this.freezeTimer = 0;
        }
    }

    /**
     * 开始下一关
     */
    startNextLevel() {
        if (this.levelManager.isLastLevel()) {
            // 游戏胜利
            this.showVictory();
        } else {
            const nextLevelIndex = this.levelManager.currentLevelIndex + 1;

            // 第一关到第二关播放过渡动画
            if (this.levelManager.currentLevelIndex === 0) {
                this.startLevelTransition(1, 2);
            } else if (this.levelManager.currentLevelIndex === 1) {
                // 第二关到第三关播放过渡动画
                this.startLevelTransition(2, 3);
            } else {
                // 其他关卡直接启动开场动画
                this.startLevelIntro(nextLevelIndex);
            }
        }
    }

    /**
     * 启动关卡过渡动画
     */
    startLevelTransition(fromLevel, toLevel) {
        this.state = GameState.LEVEL_INTRO;

        // 创建过渡动画
        if (fromLevel === 1 && toLevel === 2) {
            this.levelTransition = new Level1To2Transition(this.canvas, this.ctx);
            this.levelTransition.start();
        } else if (fromLevel === 2 && toLevel === 3) {
            this.levelTransition = new Level2To3Transition(this.canvas, this.ctx);
            this.levelTransition.start();
        }
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.isPaused = true;
            this.uiManager.setState(UIState.PAUSED);
            audioManager.stopBackgroundMusic();
        }
    }

    /**
     * 恢复游戏
     */
    resumeGame() {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.isPaused = false;
            this.uiManager.setState(UIState.PLAYING);
            audioManager.playBackgroundMusic();
        }
    }

    /**
     * 重启游戏
     */
    restartGame() {
        this.startGame();
    }

    /**
     * 返回菜单
     */
    quitToMenu() {
        this.state = GameState.MENU;
        this.uiManager.setState(UIState.MENU);
        audioManager.stopBackgroundMusic();
    }

    /**
     * 显示关卡完成（直接进入下一关过渡动画，跳过结算界面）
     */
    showLevelComplete() {
        const level = this.levelManager.getCurrentLevel();
        if (!level) return;

        this.levelManager.updateTotalStats();

        // 保存分数
        this.uiManager.saveLeaderboard(level.getStats().totalScore);

        // 检查是否还有下一关
        if (this.levelManager.currentLevelIndex < 2) {
            // 进入关卡过渡动画，直接进入下一关
            const currentLevelNum = this.levelManager.currentLevelIndex + 1;
            const nextLevelNum = currentLevelNum + 1;
            this.startLevelTransition(currentLevelNum, nextLevelNum);
        } else {
            // 所有关卡完成，显示胜利界面
            this.showVictory();
        }
    }

    /**
     * 显示游戏结束
     */
    showGameOver() {
        this.state = GameState.GAME_OVER;
        this.uiManager.setState(UIState.GAME_OVER);
        audioManager.stopBackgroundMusic();
    }

    /**
     * 显示胜利
     */
    showVictory() {
        this.state = GameState.VICTORY;
        this.uiManager.setState(UIState.VICTORY);
        audioManager.stopBackgroundMusic();

        // 保存总分
        const totalStats = this.levelManager.getTotalStats();
        this.uiManager.saveLeaderboard(totalStats.totalScore);
    }

    /**
     * 游戏主循环
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        try {
            // 计算deltaTime
            this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            // 更新FPS
            this.fps = Utils.performance.update();

            // 更新游戏
            this.update(this.deltaTime);

            // 渲染游戏
            this.render();

            // 继续循环
            requestAnimationFrame((time) => this.gameLoop(time));

        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * 更新游戏
     */
    update(deltaTime) {
        switch (this.state) {
            case GameState.LEVEL_INTRO:
                this.updateLevelIntro(deltaTime);
                break;

            case GameState.PLAYING:
                this.updatePlaying(deltaTime);
                break;

            case GameState.PAUSED:
            case GameState.LEVEL_TRANSITION:
            case GameState.GAME_OVER:
            case GameState.VICTORY:
                // 这些状态只更新UI
                break;
        }

        // 更新UI淡入淡出
        this.uiManager.updateFade(deltaTime);
    }

    /**
     * 更新关卡开场动画
     */
    updateLevelIntro(deltaTime) {
        // 检查是否是过渡动画
        if (this.levelTransition) {
            this.levelTransition.update(deltaTime);

            if (this.levelTransition.isComplete) {
                // 过渡动画完成，根据当前关卡索引进入对应关卡开场动画
                this.levelTransition = null;
                // 如果是从第一关过渡（currentLevelIndex为0），进入第二关开场动画
                // 如果是从第二关过渡（currentLevelIndex为1），进入第三关开场动画
                const nextLevelIndex = this.levelManager.currentLevelIndex + 1;
                this.startLevelIntro(nextLevelIndex);
            }
        } else {
            this.levelIntroManager.update(deltaTime);

            if (this.levelIntroManager.isComplete()) {
                // 动画完成，进入游戏
                this.state = GameState.PLAYING;
                this.startLevel(this.currentLevelIndex);
                this.uiManager.setState(UIState.PLAYING);
                audioManager.playBackgroundMusic();
            }
        }
    }

    /**
     * 更新导入动画
     */
    updateIntro(deltaTime) {
        this.introAnimation.update(deltaTime);

        if (this.introAnimation.isComplete) {
            this.startGame();
        }
    }

    /**
     * 更新游戏进行中
     */
    updatePlaying(deltaTime) {
        const level = this.levelManager.getCurrentLevel();
        if (!level) return;

        // 检查冻结状态
        if (this.activeFreeze) {
            this.freezeTimer -= deltaTime;
            if (this.freezeTimer <= 0) {
                this.activeFreeze = false;
            }
            // 冻结时只更新效果
            this.effectsManager.update(deltaTime);
            return;
        }

        // 更新关卡
        level.update(deltaTime, this.virusManager);

        // 更新病毒管理器
        this.virusManager.update(deltaTime, this.width, this.height);

        // 更新效果
        this.effectsManager.update(deltaTime);

        // 检查污染度
        if (this.virusManager.totalCorruption >= 0.8) {
            // 触发降维打击
            this.effectsManager.addGlitchEffect(0.3);
        }

        // 检查关卡状态
        if (level.isCompleted) {
            this.showLevelComplete();
        } else if (this.virusManager.totalCorruption >= 0.8) {
            // 失败：坏死像素覆盖页面程度达80%
            level.fail();
            this.showGameOver();
        }
    }

    /**
     * 渲染游戏
     */
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 调试：每次渲染时打印状态
        if (Math.random() < 0.05) { // 每20帧打印一次
            console.log(`Rendering state: ${this.state}, canvas: ${this.width}x${this.height}`);
        }

        switch (this.state) {
            case GameState.LEVEL_INTRO:
                this.renderLevelIntro();
                break;

            case GameState.MENU:
                this.renderMenu();
                break;

            case GameState.PLAYING:
                this.renderPlaying();
                break;

            case GameState.PAUSED:
                this.renderPaused();
                break;

            case GameState.LEVEL_TRANSITION:
                this.renderLevelTransition();
                break;

            case GameState.GAME_OVER:
                this.renderGameOver();
                break;

            case GameState.VICTORY:
                this.renderVictory();
                break;
        }

        // 渲染淡入淡出
        this.uiManager.renderFade();
    }

    /**
     * 渲染关卡开场动画
     */
    renderLevelIntro() {
        // 检查是否是过渡动画
        if (this.levelTransition) {
            this.levelTransition.render();
        } else {
            this.levelIntroManager.render();
        }

        // 显示跳过提示
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.font = '14px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('点击跳过', this.width / 2, this.height - 30);
    }

    /**
     * 渲染菜单
     */
    renderMenu() {
        this.uiManager.render({});
    }

    /**
     * 渲染游戏进行中
     */
    renderPlaying() {
        const level = this.levelManager.getCurrentLevel();
        if (!level) return;

        // 渲染背景
        level.renderBackground(this.ctx, this.width, this.height);

        // 渲染病毒
        this.virusManager.render(this.ctx);

        // 渲染效果
        this.effectsManager.render();

        // 渲染冻结效果
        if (this.activeFreeze) {
            this.renderFreezeEffect();
        }

        // 渲染UI
        this.uiManager.render({
            score: level.score,
            remainingTime: level.remainingTime,
            corruption: this.virusManager.totalCorruption,
            levelName: level.config.name,
            alertLevel: level.alertLevel,
            combo: level.currentCombo,
            isOverload: level.currentCombo >= 3,
            powerups: this.getPowerupsArray()
        });
    }

    /**
     * 渲染冻结效果
     */
    renderFreezeEffect() {
        const ctx = this.ctx;

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(0, 0, this.width, this.height);

        // 冰晶效果
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;

        for (let i = 0; i < 20; i++) {
            const x = Utils.random(0, this.width);
            const y = Utils.random(0, this.height);
            const size = Utils.random(10, 30);

            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size * 0.3, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size * 0.3, y);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * 渲染暂停
     */
    renderPaused() {
        // 先渲染游戏画面
        this.renderPlaying();

        // 再渲染暂停UI
        this.uiManager.render({});
    }

    /**
     * 渲染关卡过渡
     */
    renderLevelTransition() {
        const level = this.levelManager.getCurrentLevel();

        this.uiManager.render({
            levelStats: level ? level.getStats() : null
        });
    }

    /**
     * 渲染游戏结束
     */
    renderGameOver() {
        const level = this.levelManager.getCurrentLevel();
        const levelStats = this.levelManager.getTotalStats();

        this.uiManager.render({
            currentLevel: level,
            levelStats: levelStats
        });
    }

    /**
     * 渲染胜利
     */
    renderVictory() {
        this.uiManager.render({
            totalStats: this.levelManager.getTotalStats()
        });
    }

    /**
     * 获取道具数组
     */
    getPowerupsArray() {
        return [
            { ...this.powerups.timePatch, type: 'timePatch' },
            { ...this.powerups.freeze, type: 'freeze' },
            { ...this.powerups.bomb, type: 'bomb' }
        ].filter(p => p.count > 0);
    }

    /**
     * 错误处理
     */
    handleError(error) {
        console.error('Game error:', error);

        this.hasError = true;
        this.errorMessage = error.message || 'Unknown error';

        // 显示错误提示
        const errorOverlay = document.getElementById('error-overlay');
        if (errorOverlay) {
            errorOverlay.style.display = 'flex';
        }

        // 停止游戏
        this.isRunning = false;
    }

    /**
     * 启动游戏引擎
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();

        requestAnimationFrame((time) => this.gameLoop(time));

        console.log('Game engine started');
    }

    /**
     * 停止游戏引擎
     */
    stop() {
        this.isRunning = false;
        audioManager.stopBackgroundMusic();

        console.log('Game engine stopped');
    }

    /**
     * 销毁游戏引擎
     */
    destroy() {
        this.stop();

        // 移除事件监听
        window.removeEventListener('resize', this.resizeCanvas);

        // 销毁音频
        audioManager.destroy();

        console.log('Game engine destroyed');
    }
}
