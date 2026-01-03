import { _decorator, Component, Node, Prefab, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopupBase')
export class PopupBase extends Component {
    @property(Node) container: Node = null!;
    show() {
        this.node.active = true;
        this.container.setScale(Vec3.ZERO);
        tween(this.container).to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' }).start();
    }
    hide() {
        tween(this.container).to(0.2, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .call(() => { this.node.active = false; }).start();
    }
  
    onCloseClicked() { this.hide(); }
}