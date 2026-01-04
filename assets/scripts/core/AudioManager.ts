import { _decorator, Component, AudioSource, AudioClip, sys, director } from 'cc';
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

    // Các file nhạc
    @property(AudioClip) bgm_lobby: AudioClip = null!;
    @property(AudioClip) sfx_click: AudioClip = null!;
    @property(AudioClip) sfx_win: AudioClip = null!;

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

    // Phát SFX (1 lần)
    playSFX(clip: AudioClip) {
        this.sfxSource.playOneShot(clip);
    }

    // Điều chỉnh volume (từ Settings)
    setMusicVolume(vol: number) {
        this.bgmSource.volume = vol;
        sys.localStorage.setItem('music', vol.toString());
    }

    setSFXVolume(vol: number) {
        this.sfxSource.volume = vol;
        sys.localStorage.setItem('sfx', vol.toString());
    }
}