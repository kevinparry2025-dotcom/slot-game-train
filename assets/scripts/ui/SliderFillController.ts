import { _decorator, Component, Slider, Sprite } from 'cc';
const { ccclass, property, requireComponent, executionOrder } = _decorator;


@ccclass('SliderFillController')
@requireComponent(Slider)
@executionOrder(100) // Chạy sau Slider
export class SliderFillController extends Component {

    @property(Sprite)
    fillSprite: Sprite = null!; // Kéo cc.Sprite của slider-fill vào đây

    private slider: Slider = null!;

    onLoad() {
        this.slider = this.getComponent(Slider)!;
    }

    update() {
        if (!this.fillSprite || !this.slider) return;

        // Set fillRange theo progress (0.0 → 1.0)
        this.fillSprite.fillRange = this.slider.progress;
    }
}
