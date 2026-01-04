import { _decorator, Slider, sys, Button } from 'cc';
import { PopupBase } from './PopupBase';
import { PopupManager } from './PopupManager';
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
        const savedVol = sys.localStorage.getItem('volume');
        if (savedVol) {
            this.volumeSlider.progress = parseFloat(savedVol);
        }

        this.saveButton.node.on(Button.EventType.CLICK, () => {
            this.saveSettings();
        }, this);

        this.closeButton.node.on(Button.EventType.CLICK, () => {
            this.hidePopup();
        }, this);
    }

    // Gán hàm này vào Event 'Slide' của Slider trong Editor
    // onSliderChanged(slider: Slider) {
    //     sys.localStorage.setItem('volume', slider.progress.toString());
    //     // AudioManager.instance.setVolume(slider.progress);
    // }

    private saveSettings() {
        sys.localStorage.setItem('volume', this.volumeSlider.progress.toString());

        // Tắt cả popup và Scrim
        PopupManager.instance.hideAll();
    }
    private hidePopup() {
        PopupManager.instance.hideAll();
    }

}
