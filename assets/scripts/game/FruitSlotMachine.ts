

import { _decorator, Component, Node } from 'cc';
import { ReelGroup } from '../reel/ReelGroup';
import { FruitsReelConfig } from '../reel/ReelConfig';
const { ccclass, property } = _decorator;

enum SlotState {
    IDLE = 'IDLE',                  // Chờ user click spin
    SPINNING_ACCEL = 'SPINNING_ACCEL',  // Đang tăng tốc
    SPINNING_CONST = 'SPINNING_CONST',  // Quay với vận tốc ổn định
    STOPPING = 'STOPPING',          // Đang dừng từng reel
    RESULT = 'RESULT'               // Hiển thị kết quả win/lose
}

@ccclass('FruitSlotMachine')
export class FruitSlotMachine extends Component {
    @property(Node)
    btnSpin: Node = null!; // Nút spin bình thường

    @property(Node)
    btnSpinDisable: Node = null!; // Nút spin bị disable


    @property(ReelGroup)
    reelGroup: ReelGroup = null!;

    private currentState: SlotState = SlotState.IDLE;

    start() {
        this.setState(SlotState.IDLE);
        this.init();
    }
    init() {
        // Khởi tạo reelGroup với config của game Fruits
        this.reelGroup.init(FruitsReelConfig);

        this.btnSpin.active = true;
        this.btnSpinDisable.active = false;
    }

    /**
     * User click nút Spin
     */
    public onSpinButtonClicked() {
        if (this.currentState !== SlotState.IDLE) {
            console.log('❌ Cannot spin! Current state:', this.currentState);
            return;
        }

        this.btnSpin.active = false;
        this.btnSpinDisable.active = true;

        this.startSpin();
    }

    /**
     * Bắt đầu quay
     */
    private startSpin() {
        this.setState(SlotState.SPINNING_ACCEL);
        this.reelGroup.startAllReels();

        // Sau 1 giây → chuyển sang CONST state
        this.scheduleOnce(() => {
            this.setState(SlotState.SPINNING_CONST);

            // Sau thêm 1.5 giây → bắt đầu dừng
            this.scheduleOnce(() => {
                this.stopSpin();
            }, 1.5);
        }, 1);
    }

    private setState(newState: SlotState) {
        console.log(`🍇 Fruits State: ${this.currentState} → ${newState}`);
        this.currentState = newState;

        // TODO: Update UI theo state
    }

    /**
     * Dừng quay
     */
    private stopSpin() {
        this.setState(SlotState.STOPPING);
        this.reelGroup.stopReelsSequentially();
        this.btnSpin.active = true;
        this.btnSpinDisable.active = false;
        // Dừng hết 3 reels mất: 0.3s * 3 + 0.5s (animation) ≈ 1.5s
        this.scheduleOnce(() => {
            this.showResult();
        }, 1.5);
    }

    /**
  * Hiển thị kết quả
  */
    private showResult() {
        this.setState(SlotState.RESULT);

        const result = this.reelGroup.getResult();
        console.log('🍇 Fruits Result:', result);

        // TODO: Check win logic

        // Sau 1s quay về IDLE để cho spin tiếp
        this.scheduleOnce(() => {
            this.setState(SlotState.IDLE);
        }, 1);
    }

}

