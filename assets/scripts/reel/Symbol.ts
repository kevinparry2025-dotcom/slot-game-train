import { _decorator, Component, Sprite, SpriteFrame, UIOpacity, Node, instantiate, tween } from 'cc';
const { ccclass, property } = _decorator;
/**
 * Component đại diện cho một Symbol đơn lẻ
 * Mỗi symbol có một ID và SpriteFrame
 */
@ccclass('Symbol')
export class Symbol extends Component {

    @property(Sprite)
    sprite: Sprite = null!;

    private _symbolId: number = 0;
    private trailNodes: Node[] = []; // Ghost copies cho motion blur

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
     * Dùng để tạo blur effect khi reel quay
     */
    setOpacity(opacity: number) {
        if (this.sprite) {
            let uiOpacity = this.sprite.node.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = this.sprite.node.addComponent(UIOpacity);
            }
            uiOpacity.opacity = opacity;
        }
    }

    /**
     * Tạo motion blur trail khi quay nhanh
     * @param intensity Cường độ blur (0-1), càng cao càng nhiều ghost copies
     */
    createMotionBlur(intensity: number) {
        // Chỉ tạo trail khi intensity đủ cao
        if (intensity < 0.3) {
            this.removeMotionBlur();
            return;
        }

        // Số lượng ghost copies dựa trên intensity (1-3 copies)
        const trailCount = Math.floor(intensity * 3);

        // Nếu đã có đủ trail nodes, không tạo thêm
        if (this.trailNodes.length === trailCount) {
            return;
        }

        // Xóa trail cũ trước
        this.removeMotionBlur();

        // Tạo ghost copies bằng cách clone sprite node
        for (let i = 0; i < trailCount; i++) {
            // Clone sprite node thay vì tạo mới
            const trailNode = instantiate(this.sprite.node);
            trailNode.name = `trail_${i}`;

            // Set opacity giảm dần (càng xa càng mờ)
            let trailOpacity = trailNode.getComponent(UIOpacity);
            if (!trailOpacity) {
                trailOpacity = trailNode.addComponent(UIOpacity);
            }
            trailOpacity.opacity = 100 - (i * 30); // 100, 70, 40...

            // Đặt vị trí offset phía trên (vì đang quay xuống)
            const offsetY = (i + 1) * 15; // 15px, 30px, 45px...
            trailNode.setPosition(0, offsetY, 0);

            // Add vào parent của symbol (this.node)
            trailNode.setParent(this.node);
            this.trailNodes.push(trailNode);
        }
    }

    /**
     * Xóa motion blur trail
     * @param smooth Nếu true, fade out mượt mà (dùng khi stop). Nếu false, xóa ngay (dùng khi đang quay)
     */
    removeMotionBlur(smooth: boolean = false) {
        if (smooth) {
            // Fade out mượt mà khi STOP
            this.trailNodes.forEach(node => {
                if (node.isValid) {
                    const uiOpacity = node.getComponent(UIOpacity);
                    if (uiOpacity) {
                        tween(uiOpacity)
                            .to(0.2, { opacity: 0 })
                            .call(() => {
                                if (node.isValid) {
                                    node.destroy();
                                }
                            })
                            .start();
                    } else {
                        node.destroy();
                    }
                }
            });
        } else {
            // Xóa ngay khi đang SPINNING (không dùng tween)
            this.trailNodes.forEach(node => {
                if (node.isValid) {
                    node.destroy();
                }
            });
        }
        this.trailNodes = [];
    }

    onDestroy() {
        this.removeMotionBlur();
    }
}