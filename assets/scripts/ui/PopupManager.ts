import { _decorator, Component, Node, Prefab, instantiate, director, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { PopupBase } from "./PopupBase";


// 2. PopupManager: Quản lý chung
@ccclass('PopupManager')
export class PopupManager extends Component {
    private static _instance: PopupManager = null;
    public static get instance() { return this._instance; }
    @property(Node) popupContainer: Node = null!;
    @property(Node) scrimNode: Node = null!;
    onLoad() {
        if (!PopupManager._instance) {
            PopupManager._instance = this;
            director.addPersistRootNode(this.node);
        } else { this.destroy(); }
    }
    show(prefab: Prefab): void {
        const node = instantiate(prefab);
        this.popupContainer.addChild(node);
        const popup = node.getComponent(PopupBase);
        if (!popup) {
            console.error('Prefab không có component PopupBase!', node.name);
            return;
        }
        this.scrimNode.active = true;
        popup.show();
    }
    hideAll() {
        this.popupContainer.destroyAllChildren();
        this.scrimNode.active = false;
    }
}