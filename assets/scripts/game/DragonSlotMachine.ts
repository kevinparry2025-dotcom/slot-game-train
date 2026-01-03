import { _decorator, Component, Node } from 'cc';
import { ReelGroup } from '../reel/ReelGroup';
import { DragonReelConfig } from '../reel/ReelConfig';
const { ccclass, property } = _decorator;

enum SlotState {
    IDLE = 'IDLE',                  // Chờ user click spin
    SPINNING_ACCEL = 'SPINNING_ACCEL',  // Đang tăng tốc
    SPINNING_CONST = 'SPINNING_CONST',  // Quay với vận tốc ổn định
    STOPPING = 'STOPPING',          // Đang dừng từng reel
    RESULT = 'RESULT'               // Hiển thị kết quả win/lose
}

@ccclass('DragonSlotMachine')
export class DragonSlotMachine extends Component {
    @property(Node)
    btnSpin: Node = null!; // Nút spin bình thường

    @property(Node)
    btnSpinDisable: Node = null!; // Nút spin bị disable


    @property(ReelGroup)
    reelGroup: ReelGroup = null!;

    private currentState: SlotState = SlotState.IDLE;
    private targetResult: number[] = []; // Kết quả mục tiêu từ Result Matrix

    start() {
        this.setState(SlotState.IDLE);
        this.init();
    }
    init() {
        // Khởi tạo reelGroup với config của game Dragon
        this.reelGroup.init(DragonReelConfig);

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
        // RESULT MATRIX: Generate kết quả NGAY Từ ĐẦU (Frontend)
        this.targetResult = this.generateRandomResult();
        console.log('🎯 Dragon Result Matrix generated:', this.targetResult);

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

    /**
     * Tạo kết quả ngẫu nhiên (Frontend)
     * Ví dụ: [1, 3, 4, 2, 0] cho 5 reels
     */
    private generateRandomResult(): number[] {
        const config = DragonReelConfig;
        const symbolCount = 5; // Số loại symbols (0-4)
        const result: number[] = [];

        for (let i = 0; i < config.reelCount; i++) {
            const randomSymbolId = Math.floor(Math.random() * symbolCount);
            result.push(randomSymbolId);
        }

        return result;
    }

    private setState(newState: SlotState) {
        console.log(`🐉 Dragon State: ${this.currentState} → ${newState}`);
        this.currentState = newState;

        // TODO: Update UI theo state
    }

    /**
     * Dừng quay
     */
    private stopSpin() {
        this.setState(SlotState.STOPPING);

        // RESULT MATRIX: Truyền kết quả mục tiêu cho reels
        this.reelGroup.stopWithResult(this.targetResult);

        this.btnSpin.active = true;
        this.btnSpinDisable.active = false;
        // Dừng hết reels mất: stopDelay * reelCount + animation time
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
        console.log('🐉 Dragon Result:', result);

        // TODO: Check win logic

        // Sau 1s quay về IDLE để cho spin tiếp
        this.scheduleOnce(() => {
            this.setState(SlotState.IDLE);
        }, 1);
    }
}
