import { _decorator, Component, Node, Button, find, director } from 'cc';
import { ReelGroup } from '../reel/ReelGroup';
import { PharaohReelConfig } from '../reel/ReelConfig';
import { AudioManager } from '../core/AudioManager';
import { GameSceneManager } from '../scenes/GameSceneManager';
import { SlotRuleManager } from './SlotRuleManager';
const { ccclass, property } = _decorator;

enum SlotState {
    IDLE = 'IDLE',                  // Chờ user click spin
    SPINNING_ACCEL = 'SPINNING_ACCEL',  // Đang tăng tốc
    SPINNING_CONST = 'SPINNING_CONST',  // Quay với vận tốc ổn định
    STOPPING = 'STOPPING',          // Đang dừng từng reel
    RESULT = 'RESULT'               // Hiển thị kết quả win/lose
}


@ccclass('PharaohSlotMachine')
export class PharaohSlotMachine extends Component {
    @property(Node)
    btnSpin: Node = null!; // Nút spin bình thường

    @property(Node)
    btnSpinDisable: Node = null!; // Nút spin bị disable


    @property(ReelGroup)
    reelGroup: ReelGroup = null!;

    private currentState: SlotState = SlotState.IDLE;
    private targetResult: number[] = []; // Kết quả mục tiêu từ Result Matrix

    start() {
        // Nếu không có AudioManager (test trực tiếp GameScene)
        if (!AudioManager.instance) {
            console.warn('⚠️ AudioManager missing, creating temporary one...');
            // TODO: Tạo AudioManager node tạm
        } else {
            // Có AudioManager rồi (đúng flow từ Lobby)
            if (AudioManager.instance.bgm_pharaoh) {
                AudioManager.instance.fadeBGM(AudioManager.instance.bgm_pharaoh, 1.5);
            }
        }
        this.setState(SlotState.IDLE);
        this.init();
    }
    init() {
        // Khởi tạo reelGroup với config của game Pharaoh
        this.reelGroup.init(PharaohReelConfig);

        // Lắng nghe sự kiện Reel Stop từ ReelGroup (Real-time timing)
        // Lắng nghe sự kiện Reel Stop từ ReelGroup (Real-time timing)
        this.reelGroup.onReelStop = (reelIndex: number) => {
            // 🔊 Sound: Reel Stop (Chính xác thời điểm reel dừng)
            if (AudioManager.instance) {
                AudioManager.instance.playSFX(AudioManager.instance.sfx_reelStop);
            }

            // Nếu là reel cuối cùng dừng -> trigger showResult
            // (Không dùng timer cố định nữa)
            if (reelIndex >= this.reelGroup.reels.length - 1) {
                console.log('✅ Last reel stopped. Transitioning to RESULT...');
                this.showResult();
            }
        };

        // Đảm bảo nút spin được bật
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

        // 🔊 Sound: Click
        if (AudioManager.instance) {
            AudioManager.instance.playSFX(AudioManager.instance.sfx_click);
        }

        // Disable nút spin (chuyển sang màu mờ/không ấn được)
        this.btnSpin.active = false;
        this.btnSpinDisable.active = true;

        this.startSpin();
    }

    /**
     * Bắt đầu quay
     */
    private startSpin() {
        // 🔊 Sound: Spin Start (Start Loop)
        if (AudioManager.instance) {
            AudioManager.instance.playSpinLoop();
        }

        // RESULT MATRIX: Generate kết quả NGAY TỪ ĐẦU (Frontend)
        this.targetResult = this.generateRandomResult();
        console.log('🎯 Pharaoh Result Matrix generated:', this.targetResult);

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
        const config = PharaohReelConfig;
        const symbolCount = 5; // Số loại symbols (0-4)
        const result: number[] = [];

        for (let i = 0; i < config.reelCount; i++) {
            const randomSymbolId = Math.floor(Math.random() * symbolCount);
            result.push(randomSymbolId);
        }

        return result;
    }

    private setState(newState: SlotState) {
        console.log(`👑 Pharaoh State: ${this.currentState} → ${newState}`);
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
    }

    /**
  * Hiển thị kết quả
  */
    private showResult() {
        // 🔊 Sound: Stop Spin Loop (Khi tất cả reel đã dừng)
        if (AudioManager.instance) {
            AudioManager.instance.stopSpinLoop();
        }

        this.setState(SlotState.RESULT);
        this.btnSpin.active = true;
        this.btnSpinDisable.active = false;

        // ---------------------------------------------------------
        // TÍNH TOÁN KẾT QUẢ THẮNG THUA
        // ---------------------------------------------------------
        const currentMatrix = this.reelGroup.getResult();
        const winResult = SlotRuleManager.checkWin(currentMatrix, 100); // Test cược $100

        if (winResult.totalWin > 0) {
            if (AudioManager.instance) {
                AudioManager.instance.playSFX(AudioManager.instance.sfx_winBig);
            }
            console.log(`🎉 WIN! TOTAL: $${winResult.totalWin}`);
            console.table(winResult.winningLines); // In bảng chi tiết các dòng thắng

            // TODO: Hiển thị hiệu ứng thắng (Vẽ line, nổ tiền...)
            // if (AudioManager.instance) AudioManager.instance.playSFX(AudioManager.instance.sfx_winSmall);
        } else {
            console.log('😢 NO WIN.');
        }


        // Sau 1s quay về IDLE để cho spin tiếp
        this.scheduleOnce(() => {
            this.setState(SlotState.IDLE);
        }, 1);
    }

    /**
     * Xử lý khi user click nút Back
     * Load trực tiếp về LobbyScene
     */
    public backToLobby() {
        console.log('🔙 Going back to lobby...');

        // Cleanup: Dừng tất cả scheduled callbacks trong PharaohSlotMachine
        this.unscheduleAllCallbacks();

        // Cleanup: Dừng tất cả scheduled callbacks trong ReelGroup
        if (this.reelGroup) {
            this.reelGroup.unscheduleAllCallbacks();

            // Dừng callbacks trong từng reel
            this.reelGroup.reels.forEach(reel => {
                if (reel) {
                    reel.unscheduleAllCallbacks();
                }
            });
        }

        // Reset state
        this.currentState = SlotState.IDLE;

        // Tìm GameSceneManager và gọi backToLobby()
        // GameSceneManager sẽ cleanup bundles và materials đúng cách
        const canvas = find('Canvas');
        if (!canvas) {
            console.error('❌ Canvas not found!');
            return;
        }

        // Tìm GameSceneManager trong Canvas
        const manager = canvas.getComponent(GameSceneManager);
        if (manager) {
            manager.backToLobby();
        } else {
            console.error('❌ GameSceneManager component not found in Canvas children!');
        }
    }
}

