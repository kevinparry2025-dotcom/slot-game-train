import { _decorator, Slider, sys, Button } from 'cc';
import { PopupBase } from './PopupBase';
import { PopupManager } from './PopupManager';
import { AudioManager } from '../core/AudioManager';
const { ccclass, property } = _decorator;

@ccclass('SettingsPopup')
export class SettingsPopup extends PopupBase {
    @property(Slider) volumeSlider: Slider = null!;
    @property(Slider) musicSlider: Slider = null!;
    @property(Button)
    saveButton: Button = null!;
    @property(Button)
    closeButton: Button = null!;

    start() {
        console.log('⚙️ SettingsPopup started');
        // Init volume slider from AudioManager or LocalStorage
        const savedMusic = sys.localStorage.getItem('music');
        if (savedMusic) {
            this.musicSlider.progress = parseFloat(savedMusic);
        } else if (AudioManager.instance) {
            console.log('✅ Found AudioManager instance in SettingsPopup');
            this.musicSlider.progress = AudioManager.instance.bgmSource.volume;
        }

        this.saveButton.node.on(Button.EventType.CLICK, () => {
            this.saveSettings();
        }, this);

        this.closeButton.node.on(Button.EventType.CLICK, () => {
            this.hidePopup();
        }, this);
    }

    // Called by Slider Event in Editor
    onMusicSliderChanged(slider: Slider) {
        if (AudioManager.instance) {
            AudioManager.instance.setMusicVolume(slider.progress);
        } else {
            console.error('❌ AudioManager.instance is NULL in onMusicSliderChanged!');
        }
    }

    // Optional: If you have SFX slider
    onSFXSliderChanged(slider: Slider) {
        if (AudioManager.instance) {
            AudioManager.instance.setSFXVolume(slider.progress);
        }
    }

    private saveSettings() {
        this.onMusicSliderChanged(this.musicSlider);
        PopupManager.instance.hideAll();
    }

    private hidePopup() {
        PopupManager.instance.hideAll();
    }
}
