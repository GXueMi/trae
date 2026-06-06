/**
 * 主程序入口
 * 初始化游戏并启动
 */

// 全局游戏引擎实例
let game = null;

/**
 * 初始化游戏
 */
function initGame() {
    try {
        console.log('Initializing Pixel Invasion: System Defense...');

        // 确保DOM完全就绪
        if (!document.getElementById('gameCanvas') || !document.getElementById('game-container')) {
            console.error('Game elements not ready, retrying...');
            setTimeout(initGame, 100);
            return;
        }

        // 创建游戏引擎实例
        game = new GameEngine();

        // 启动游戏
        game.start();

        console.log('Game initialized successfully!');

    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError(error);
    }
}

/**
 * 显示错误
 */
function showError(error) {
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
        errorOverlay.style.display = 'flex';

        const errorText = errorOverlay.querySelector('.error-text');
        if (errorText && error.message) {
            errorText.textContent = `哎呀，出错了: ${error.message}`;
        }
    }
}

/**
 * 页面加载完成后初始化游戏
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM已经加载完成
    initGame();
}

/**
 * 页面卸载时清理资源
 */
window.addEventListener('beforeunload', () => {
    if (game) {
        game.destroy();
    }
});

/**
 * 页面隐藏时暂停游戏
 */
document.addEventListener('visibilitychange', () => {
    if (game && game.state === GameState.PLAYING) {
        if (document.hidden) {
            game.pauseGame();
        }
    }
});

/**
 * 防止页面滚动和缩放
 */
document.addEventListener('touchmove', (e) => {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

/**
 * 双击缩放禁止
 */
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

/**
 * 横屏提示（可选）
 */
function checkOrientation() {
    // 如果需要强制竖屏，可以在这里添加提示
    // 当前游戏支持横竖屏自适应
}

window.addEventListener('orientationchange', checkOrientation);
window.addEventListener('resize', checkOrientation);

/**
 * 性能监控（开发模式）
 */
if (typeof DEBUG !== 'undefined' && DEBUG) {
    // 显示FPS
    setInterval(() => {
        if (game && game.fps) {
            console.log(`FPS: ${game.fps}`);
        }
    }, 1000);
}

/**
 * 调试工具（开发模式）
 */
window.debug = {
    // 添加道具
    addPowerup: function (type, count = 1) {
        if (game && game.powerups[type]) {
            game.powerups[type].count += count;
            console.log(`Added ${count} ${type}(s)`);
        }
    },

    // 设置分数
    setScore: function (score) {
        if (game && game.levelManager && game.levelManager.getCurrentLevel()) {
            game.levelManager.getCurrentLevel().score = score;
            console.log(`Score set to ${score}`);
        }
    },

    // 设置时间
    setTime: function (seconds) {
        if (game && game.levelManager && game.levelManager.getCurrentLevel()) {
            game.levelManager.getCurrentLevel().remainingTime = seconds;
            console.log(`Time set to ${seconds} seconds`);
        }
    },

    // 清除所有病毒
    clearViruses: function () {
        if (game && game.virusManager) {
            game.virusManager.clearAllViruses();
            console.log('All viruses cleared');
        }
    },

    // 跳转到指定关卡
    jumpToLevel: function (levelIndex) {
        if (game) {
            game.startLevel(levelIndex);
            console.log(`Jumped to level ${levelIndex + 1}`);
        }
    },

    // 显示游戏状态
    showState: function () {
        if (game) {
            console.log('Game State:', {
                state: game.state,
                fps: game.fps,
                viruses: game.virusManager ? game.virusManager.getCount() : 0,
                corruption: game.virusManager ? game.virusManager.totalCorruption : 0,
                powerups: game.powerups
            });
        }
    }
};

console.log('%c像素侵入：系统保卫战', 'font-size: 24px; font-weight: bold; color: #0f0;');
console.log('%c纯离线HTML5游戏 v1.0.0', 'font-size: 14px; color: #888;');
console.log('%c输入 debug.showState() 查看游戏状态', 'font-size: 12px; color: #666;');
