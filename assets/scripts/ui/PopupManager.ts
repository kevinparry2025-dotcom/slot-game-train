import { _decorator, Component, Node, Prefab, instantiate, director, tween, Vec3, Camera, Canvas, Director, Widget } from 'cc';
const { ccclass, property } = _decorator;
import { PopupBase } from "./PopupBase";

@ccclass('PopupManager')
export class PopupManager extends Component {
    private static _instance: PopupManager = null;
    public static get instance() { return this._instance; }
    @property(Node) popupContainer: Node = null!;
    @property(Node) scrimNode: Node = null!;

    onLoad() {
        if (!PopupManager._instance) {
            PopupManager._instance = this;
            console.log('✅ PopupManager instance initialized');
            console.log('✅ popupContainer assigned:', this.popupContainer ? this.popupContainer.name : 'NULL');
            director.addPersistRootNode(this.node);

            // Fix Widget targets to prevent crash when switching scenes
            this.fixWidgetTarget(this.popupContainer);
            this.fixWidgetTarget(this.scrimNode);

            // Listen for scene changes to update Camera
            director.on(Director.EVENT_BEFORE_SCENE_LOADING, this.onBeforeSceneLoading, this);
            director.on(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLaunched, this);
        } else {
            console.log('⚠️ PopupManager instance already exists, destroying duplicate');
            this.destroy();
        }
    }

    private fixWidgetTarget(node: Node) {
        if (!node) return;
        const widget = node.getComponent(Widget);
        if (widget) {
            console.log(`🔧 Fixing Widget target for ${node.name} -> PopupManager`);
            widget.target = this.node;
            widget.updateAlignment();
        }
    }

    private onBeforeSceneLoading() {
        console.log('🛑 Scene loading started. Disabling PopupManager Canvas to prevent crash...');
        const canvas = this.getComponent(Canvas);
        if (canvas) {
            canvas.enabled = false;
        }
    }

    private onSceneLaunched() {
        console.log('🔄 Scene launched, updating PopupManager Camera...');
        const canvas = this.getComponent(Canvas);
        if (canvas) {
            // Find the new Main Camera in the scene
            const mainCamera = director.getScene().getComponentInChildren(Camera);
            if (mainCamera) {
                canvas.cameraComponent = mainCamera;
                canvas.enabled = true; // Re-enable Canvas after camera assignment
                console.log('✅ PopupManager Camera updated to:', mainCamera.node.name);
            } else {
                console.warn('⚠️ No Camera found in new scene for PopupManager Canvas!');
            }
        }
    }

    show(prefab: Prefab): void {
        console.log('🔍 PopupManager.show called');

        if (!this.isValid) {
            console.error('❌ PopupManager instance is DESTROYED/INVALID but was called!');
            if (PopupManager._instance === this) {
                PopupManager._instance = null;
            }
            return;
        }

        console.log('  - Instance:', PopupManager._instance ? 'Valid' : 'NULL');
        console.log('  - This:', this);
        console.log('  - popupContainer:', this.popupContainer);

        if (!this.popupContainer) {
            console.error('❌ FATAL: popupContainer is null! Attempting to find it...');
            // Fallback attempt
            this.popupContainer = this.node.getChildByName('PopupContainer');
            if (!this.popupContainer) {
                console.error('❌ Still cannot find PopupContainer. Using self as fallback.');
                this.popupContainer = this.node;
            } else {
                console.log('✅ Found PopupContainer manually.');
            }
        }

        const node = instantiate(prefab);
        this.popupContainer.addChild(node);
        const popup = node.getComponent(PopupBase);
        if (!popup) {
            console.error('Prefab không có component PopupBase!', node.name);
            return;
        }
        if (this.scrimNode) this.scrimNode.active = true;
        popup.show();
    }

    onDestroy() {
        console.log('💥 PopupManager destroyed!');
        console.log('  - Instance was this?', PopupManager._instance === this);
        if (PopupManager._instance === this) {
            director.off(Director.EVENT_BEFORE_SCENE_LOADING, this.onBeforeSceneLoading, this);
            director.off(Director.EVENT_AFTER_SCENE_LAUNCH, this.onSceneLaunched, this);
            // PopupManager._instance = null; // Optional: clean up, but we want to see the error behavior
        }
    }

    hideAll() {
        if (this.popupContainer) {
            this.popupContainer.destroyAllChildren();
        }
        if (this.scrimNode) {
            this.scrimNode.active = false;
        }
    }
}