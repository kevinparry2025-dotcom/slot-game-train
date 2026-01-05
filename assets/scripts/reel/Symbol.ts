import { _decorator, Component, Sprite, SpriteFrame, UIOpacity, Node, instantiate, tween, Material } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Component đại diện cho một Symbol đơn lẻ
 * Mỗi symbol có một ID và SpriteFrame
 * ✅ OPTIMIZED: Sử dụng shader-based motion blur để giảm draw calls
 */
@ccclass('Symbol')
export class Symbol extends Component {

    @property(Sprite)
    sprite: Sprite = null!;

    @property(Material)
    normalMaterial: Material = null!; // Material bình thường (không blur)

    @property(Material)
    blurMaterial: Material = null!; // Material với motion blur shader

    private _symbolId: number = 0;
    // ✅ Không cần trailNodes nữa - dùng shader thay thế
    // private trailNodes: Node[] = [];

    /**
     * Auto-load materials nếu chưa được assign trong editor
     */
    onLoad() {
        // Nếu chưa có materials, chỉ hiển warning mà không crash
        if (!this.normalMaterial || !this.blurMaterial) {
            console.warn('[Symbol] Materials not assigned! Motion blur will be disabled.');
            console.warn('Please assign normalMaterial and blurMaterial in Symbol prefab.');
        }
    }

    /**
     * Set symbol ID và update sprite
     */
    setSymbol(id: number, spriteFrame: SpriteFrame) {
        this._symbolId = id;
        this.sprite.spriteFrame = spriteFrame;
    }

    /**
     * Get symbol ID hiện tại
     */
    getSymbolId(): number {
        return this._symbolId;
    }

    /**
     * Set opacity cho symbol (0-255)
     * ✅ OPTIMIZED: Dùng sprite.color để không phá vỡ batching
     */
    setOpacity(opacity: number) {
        if (this.sprite) {
            const color = this.sprite.color.clone();
            color.a = opacity;
            this.sprite.color = color;
        }
    }

    /**
     * ✅ SHADER-BASED: Tạo motion blur bằng shader (không tạo nodes)
     * @param intensity Cường độ blur (0-1)
     */
    createMotionBlur(intensity: number) {
        if (!this.sprite) {
            return;
        }

        // Nếu không có materials, skip blur logic (game vẫn chạy bình thường)
        if (!this.normalMaterial || !this.blurMaterial) {
            return;
        }

        // Chỉ blur khi intensity đủ cao
        if (intensity < 0.3) {
            // Dùng normal material (không blur)
            this.sprite.customMaterial = this.normalMaterial;
            return;
        }

        // Dùng blur material và set parameters
        this.sprite.customMaterial = this.blurMaterial;

        // Set shader properties
        this.blurMaterial.setProperty('blurIntensity', intensity);
        this.blurMaterial.setProperty('blurDirectionX', 0.0);
        this.blurMaterial.setProperty('blurDirectionY', -1.0); // Blur xuống dưới
    }

    /**
     * ✅ SHADER-BASED: Reset về normal material
     * @param smooth Tham số giữ lại để tương thích, nhưng không dùng nữa
     */
    removeMotionBlur(smooth: boolean = false) {
        if (this.sprite && this.normalMaterial) {
            this.sprite.customMaterial = this.normalMaterial;
        }
    }

    onDestroy() {
        // ✅ Reset material khi destroy
        this.removeMotionBlur();
    }
}