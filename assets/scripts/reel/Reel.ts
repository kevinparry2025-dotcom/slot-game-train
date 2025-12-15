import {
  _decorator,
  Component,
  Node,
  Prefab,
  instantiate,
  Vec3,
  tween,
  SpriteFrame,
} from "cc";
import { Symbol } from "./Symbol";
const { ccclass, property } = _decorator;

@ccclass("Reel")
export class Reel extends Component {

  @property(Prefab)
  symbolPrefab: Prefab = null!;

  @property([SpriteFrame])
  symbolSpriteFrames: SpriteFrame[] = []; // Kéo 5 hình symbols vào

  private symbols: Node[] = [];
  private symbolHeight: number = 110; // Chiều cao mỗi symbol
  private symbolCount: number = 10; // Số symbols hiển thị

  // start() {
  //   this.initSymbols();
  // }
  onLoad(): void {
    this.initSymbols();
  }

  initSymbols() {
    for (let i = 0; i < this.symbolCount; i++) {
      const symbolNode = instantiate(this.symbolPrefab);
      symbolNode.setParent(this.node);

      // Đặt vị trí: từ trên xuống
      symbolNode.setPosition(0, (this.symbolCount - 2 - i) * this.symbolHeight + 5, 0);

      // Set hình ảnh random
      const randomId = Math.floor(Math.random() * this.symbolSpriteFrames.length);
      const symbolComponent = symbolNode.getComponent(Symbol)!;
      console.log("randomId", randomId);
      console.log("symbolSpriteFrames", this.symbolSpriteFrames[randomId]);
      symbolComponent.setSymbol(randomId, this.symbolSpriteFrames[randomId]);

      this.symbols.push(symbolNode);

    }
  }

}
