import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
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
}