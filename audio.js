/**
 * 音效系统
 * 使用Web Audio API生成所有游戏音效（无需外部音频文件）
 */

class AudioManager {
    constructor() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;

            this.isMuted = false;
            this.isInitialized = false;
        } catch (e) {
            console.error('Audio initialization failed:', e);
            this.audioContext = null;
        }
    }

    /**
     * 初始化音频上下文（需要用户交互后调用）
     */
    init() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                this.isInitialized = true;
            });
        } else {
            this.isInitialized = true;
        }
    }

    /**
     * 设置音量
     */
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Utils.clamp(value, 0, 1);
        }
    }

    /**
     * 静音切换
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.isMuted ? 0 : 0.5;
        }
        return this.isMuted;
    }

    /**
     * 播放音效
     */
    play(soundName) {
        if (!this.audioContext || !this.isInitialized || this.isMuted) return;

        try {
            const generator = this.sounds[soundName];
            if (generator) {
                generator.call(this);
            }
        } catch (e) {
            console.error('Sound play error:', e);
        }
    }

    /**
     * 音效生成器集合
     */
    sounds = {
        /**
         * 点击病毒音效
         */
        click: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.1);
        },

        /**
         * 连击音效
         */
        combo: function () {
            const frequencies = [523, 659, 784, 1047];

            frequencies.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = this.audioContext.currentTime + i * 0.05;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.15);
            });
        },

        /**
         * 过载模式音效
         */
        overload: function () {
            for (let i = 0; i < 5; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sawtooth';
                osc.frequency.value = 200 + i * 100;

                const startTime = this.audioContext.currentTime + i * 0.03;
                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.2);
            }
        },

        /**
         * 错误点击音效
         */
        error: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
            osc.frequency.linearRampToValueAtTime(50, this.audioContext.currentTime + 0.3);

            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        },

        /**
         * 警报音效
         */
        alarm: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
            osc.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.25);
            osc.frequency.setValueAtTime(440, this.audioContext.currentTime + 0.5);

            gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.6);
        },

        /**
         * 道具拾取音效
         */
        powerup: function () {
            const notes = [262, 330, 392, 523, 659, 784];

            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = this.audioContext.currentTime + i * 0.06;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.2);
            });
        },

        /**
         * 时空补丁音效
         */
        timePatch: function () {
            for (let i = 0; i < 8; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = 300 + i * 50;

                const startTime = this.audioContext.currentTime + i * 0.05;
                gain.gain.setValueAtTime(0.1, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.3);
            }
        },

        /**
         * 绝对零度音效（冰冻）
         */
        freeze: function () {
            const noise = this.audioContext.createBufferSource();
            const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < buffer.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / buffer.length * 3);
            }

            noise.buffer = buffer;

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;

            const gain = this.audioContext.createGain();
            gain.gain.value = 0.2;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start();
        },

        /**
         * 逻辑炸弹音效（爆炸）
         */
        explosion: function () {
            // 低频爆炸
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5);

            gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.5);

            // 噪音层
            const noise = this.audioContext.createBufferSource();
            const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < buffer.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / buffer.length * 4);
            }

            noise.buffer = buffer;

            const noiseGain = this.audioContext.createGain();
            noiseGain.gain.value = 0.3;

            noise.connect(noiseGain);
            noiseGain.connect(this.masterGain);

            noise.start();
        },

        /**
         * 关卡完成音效
         */
        levelComplete: function () {
            const melody = [523, 659, 784, 1047, 784, 1047, 1319];

            melody.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sine';
                osc.frequency.value = freq;

                const startTime = this.audioContext.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.3);
            });
        },

        /**
         * 游戏失败音效
         */
        gameOver: function () {
            const notes = [392, 370, 349, 330, 311, 294, 277, 262];

            notes.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'sawtooth';
                osc.frequency.value = freq;

                const startTime = this.audioContext.currentTime + i * 0.2;
                gain.gain.setValueAtTime(0.2, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.4);
            });
        },

        /**
         * 病毒出现音效
         */
        virusSpawn: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

            gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.1);
        },

        /**
         * 背景心跳音效
         */
        heartbeat: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = 60;

            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.25, this.audioContext.currentTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.25);
        },

        /**
         * 故障音效
         */
        glitch: function () {
            for (let i = 0; i < 3; i++) {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();

                osc.type = 'square';
                osc.frequency.value = Utils.random(100, 1000);

                const startTime = this.audioContext.currentTime + i * 0.05;
                gain.gain.setValueAtTime(0.1, startTime);
                gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

                osc.connect(gain);
                gain.connect(this.masterGain);

                osc.start(startTime);
                osc.stop(startTime + 0.05);
            }
        },

        /**
         * 菜单点击音效
         */
        menuClick: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = 600;

            gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.05);
        },

        /**
         * 倒计时警告音效
         */
        countdown: function () {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'beep';
            osc.frequency.value = 880;

            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + 0.15);
        }
    };

    /**
     * 播放背景音乐（循环）
     */
    playBackgroundMusic() {
        if (!this.audioContext || !this.isInitialized || this.isMuted) return;

        // 停止之前的背景音乐
        this.stopBackgroundMusic();

        // 创建低频脉冲背景音
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.value = 80;

        lfo.type = 'sine';
        lfo.frequency.value = 0.5;

        lfoGain.gain.value = 10;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        gain.gain.value = 0.05;

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        lfo.start();

        this.bgMusic = { osc, lfo, gain };
    }

    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        if (this.bgMusic) {
            try {
                this.bgMusic.osc.stop();
                this.bgMusic.lfo.stop();
            } catch (e) {
                // 忽略已停止的错误
            }
            this.bgMusic = null;
        }
    }

    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopBackgroundMusic();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();
