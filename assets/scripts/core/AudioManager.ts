import { _decorator, Component, AudioSource, AudioClip, sys, director, tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager | null = null;

    static get instance(): AudioManager {
        return this._instance!;
    }

    // 3 Audio Sources
    @property(AudioSource) bgmSource: AudioSource = null!;
    @property(AudioSource) sfxSource: AudioSource = null!;
    @property(AudioSource) voiceSource: AudioSource = null!;

    // ═══════════════════════════════════════════════════════════
    // BGM (Background Music) - Mỗi Scene/Game 1 File
    // ═══════════════════════════════════════════════════════════
    @property({ type: AudioClip, tooltip: 'Nhạc nền Lobby' })
    bgm_lobby: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Nhạc nền Game Fruits' })
    bgm_fruits: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Nhạc nền Game Dragon' })
    bgm_dragon: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Nhạc nền Game Pharaoh' })
    bgm_pharaoh: AudioClip = null!;

    // ═══════════════════════════════════════════════════════════
    // SFX (Sound Effects) - Dùng Chung Cho Tất Cả Games
    // ═══════════════════════════════════════════════════════════
    @property({ type: AudioClip, tooltip: 'Tiếng click nút' })
    sfx_click: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Tiếng bắt đầu spin' })
    sfx_spin: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Tiếng reel dừng' })
    sfx_reelStop: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Tiếng coin rơi' })
    sfx_coin: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Tiếng thắng nhỏ' })
    sfx_winSmall: AudioClip = null!;

    @property({ type: AudioClip, tooltip: 'Tiếng thắng lớn' })
    sfx_winBig: AudioClip = null!;;

    onLoad() {
        // Singleton pattern - chỉ tạo 1 instance duy nhất
        if (!AudioManager._instance) {
            AudioManager._instance = this;

            // Persist node qua scenes
            director.addPersistRootNode(this.node);

            console.log('🎵 AudioManager instance created');
        } else {
            // Nếu đã có instance → Destroy duplicate
            console.warn('⚠️ AudioManager duplicate detected, destroying...');
            this.destroy();
        }
    }

    onDestroy() {
        if (AudioManager._instance === this) {
            AudioManager._instance = null;
        }
    }

    // Phát BGM (loop)
    playBGM(clip: AudioClip) {
        this.bgmSource.clip = clip;
        this.bgmSource.loop = true;
        this.bgmSource.play();
    }

    // Fade BGM (chuyển mượt giữa các nhạc nền)
    fadeBGM(newClip: AudioClip, fadeTime: number = 1.0) {
        // Fade out BGM cũ
        tween(this.bgmSource)
            .to(fadeTime / 2, { volume: 0 })
            .call(() => {
                // Đổi sang BGM mới
                this.bgmSource.clip = newClip;
                this.bgmSource.loop = true;
                this.bgmSource.play();
            })
            .to(fadeTime / 2, { volume: 0.5 }) // Fade in
            .start();
    }

    // Phát SFX (1 lần)
    playSFX(clip: AudioClip, volume: number = 1.0) {
        this.sfxSource.playOneShot(clip, volume);
    }

    // Phát tiếng Spin liên tục (Loop)
    playSpinLoop() {
        if (!this.sfx_spin) return;

        // Dùng voiceSource làm kênh riêng cho Spin Loop để không bị ngắt bởi playOneShot của sfxSource
        this.voiceSource.stop(); // Stop trước đó nếu có
        this.bgmSource.volume = 0.2;
        this.voiceSource.clip = this.sfx_spin;
        this.voiceSource.loop = true;
        this.voiceSource.volume = 0.8; // Giảm volume chút cho đỡ ồn
        this.voiceSource.play();
    }

    // Dừng tiếng Spin loop
    stopSpinLoop() {
        // Fade out nhẹ nhàng
        tween(this.voiceSource)
            .to(0.3, { volume: 0 })
            .call(() => {
                this.voiceSource.stop();
                this.voiceSource.volume = 1.0; // Reset volume
                this.bgmSource.volume = 1.0;
            })
            .start();
    }

    // Điều chỉnh volume (từ Settings)
    setMusicVolume(vol: number) {
        this.bgmSource.volume = vol;
        sys.localStorage.setItem('music', vol.toString());
    }

    setSFXVolume(vol: number) {
        this.sfxSource.volume = vol;
        // voiceSource cũng là SFX nhưng dạng loop
        this.voiceSource.volume = vol;
        sys.localStorage.setItem('sfx', vol.toString());
    }
}