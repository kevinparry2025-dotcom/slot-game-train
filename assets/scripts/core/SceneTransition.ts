import { _decorator, Node, Sprite, director, tween, UIOpacity, Canvas, Vec3, Color, UITransform, Size } from 'cc';
const { ccclass } = _decorator;

@ccclass('SceneTransition')
export class SceneTransition {

    private static fadeNode: Node | null = null;

    /**
     * Chuyển scene với fade effect
     * @param sceneName Tên scene cần chuyển
     * @param duration Thời gian fade (giây)
     */
    public static loadSceneWithFade(sceneName: string, duration: number = 0.5) {
        this.createFadeOverlay();

        const uiOpacity = this.fadeNode?.getComponent(UIOpacity);
        if (!uiOpacity) {
            console.error('SceneTransition: UIOpacity component not found');
            // Fallback: chuyển scene trực tiếp
            director.loadScene(sceneName);
            return;
        }

        // Set opacity ban đầu = 0
        uiOpacity.opacity = 0;

        // Fade Out
        tween(uiOpacity)
            .to(duration, { opacity: 255 }, { easing: 'sineInOut' })
            .call(() => {
                // Load scene mới
                director.loadScene(sceneName, () => {
                    // Callback sau khi scene load xong
                    // Cần tạo lại fade node vì scene cũ đã bị destroy
                    this.fadeIn(duration);
                });
            })
            .start();
    }

    /**
     * Fade in sau khi load scene mới
     */
    private static fadeIn(duration: number) {
        // Tạo lại fade overlay trong scene mới (vì scene cũ đã bị destroy)
        this.createFadeOverlay();

        const uiOpacity = this.fadeNode?.getComponent(UIOpacity);
        if (!uiOpacity) {
            console.warn('SceneTransition: UIOpacity not found for fade in');
            return;
        }

        // Set opacity = 255 (đen hoàn toàn)
        uiOpacity.opacity = 255;

        // Fade In (từ đen về trong suốt)
        tween(uiOpacity)
            .to(duration, { opacity: 0 }, { easing: 'sineInOut' })
            .call(() => {
                // Destroy fade node sau khi fade in xong
                if (this.fadeNode) {
                    this.fadeNode.destroy();
                    this.fadeNode = null;
                }
            })
            .start();
    }

    /**
     * Tạo overlay đen để fade
     */
    private static createFadeOverlay() {
        // Nếu đã có fadeNode, destroy nó trước
        if (this.fadeNode && this.fadeNode.isValid) {
            this.fadeNode.destroy();
            this.fadeNode = null;
        }

        // Tìm Canvas
        const scene = director.getScene();
        if (!scene) {
            console.error('SceneTransition: Scene not found');
            return;
        }

        const canvas = scene.getComponentInChildren(Canvas);
        if (!canvas) {
            console.error('SceneTransition: Canvas not found');
            return;
        }

        // Tạo node đen full screen
        this.fadeNode = new Node('FadeOverlay');
        this.fadeNode.parent = canvas.node;

        // Set layer cao nhất
        this.fadeNode.setSiblingIndex(9999);

        // Add UITransform component (phải có trước khi add Sprite)
        const uiTransform = this.fadeNode.addComponent(UITransform);

        // Get canvas size
        const canvasTransform = canvas.node.getComponent(UITransform);
        if (canvasTransform) {
            uiTransform.setContentSize(canvasTransform.contentSize);
        } else {
            // Fallback size
            uiTransform.setContentSize(new Size(1920, 1080));
        }

        // Add Sprite component
        const sprite = this.fadeNode.addComponent(Sprite);
        sprite.color = new Color(0, 0, 0, 255); // Đen

        // Add UIOpacity
        const uiOpacity = this.fadeNode.addComponent(UIOpacity);
        uiOpacity.opacity = 0; // Bắt đầu trong suốt (sẽ set lại khi dùng)

        // Set position center
        this.fadeNode.setPosition(Vec3.ZERO);
    }
}