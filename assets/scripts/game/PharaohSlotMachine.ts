import { _decorator, Component, Node, Button, find, director, SpriteFrame, CCInteger, Sprite, UIOpacity, tween, Vec3 } from 'cc';
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

    @property(Node)
    youWinNode: Node = null;

    @property(SpriteFrame)
    youWinSprite: SpriteFrame = null;

    @property([SpriteFrame])
    digitSprites: SpriteFrame[] = [];

    @property(CCInteger)
    winDisplayDuration: number = 2;

    private currentState: SlotState = SlotState.IDLE;
    private targetResult: number[] = []; // Kết quả mục tiêu từ Result Matrix

    // Win Streak Logic
    private consecutiveWins: number = 0;
    private consecutiveLosses: number = 0;
    private isIntenseMode: boolean = false;

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

        // Register Touch Event for Spin Button
        if (this.btnSpin) {
            console.log('🔍 Checking btnSpin type:', this.btnSpin.constructor.name);
            // Handle case where btnSpin might be a Component (due to editor quirks) instead of a Node
            let btnNode = this.btnSpin;
            if (!(this.btnSpin instanceof Node) && (this.btnSpin as any).node) {
                btnNode = (this.btnSpin as any).node;
                console.warn('⚠️ btnSpin is not a Node! Using .node property instead.');
            }

            if (btnNode && typeof btnNode.on === 'function') {
                btnNode.on(Node.EventType.TOUCH_END, this.onSpinButtonClicked, this);
            } else {
                console.error('❌ Cannot register touch event: btnNode is invalid or missing .on method', btnNode);
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

        // Đảm bảo nút spin được bật (User requested removal of active toggling)
        // this.btnSpin.active = true;
        // this.btnSpinDisable.active = false;
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
        // User requested removal of active toggling
        // this.btnSpin.active = false;
        // this.btnSpinDisable.active = true;

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
        // User requested removal of active toggling
        // this.btnSpin.active = true;
        // this.btnSpinDisable.active = false;

        // ---------------------------------------------------------
        // TÍNH TOÁN KẾT QUẢ THẮNG THUA
        // ---------------------------------------------------------
        const currentMatrix = this.reelGroup.getResult();
        const winResult = SlotRuleManager.checkWin(currentMatrix, 100); // Test cược $100

        if (winResult.totalWin > 0) {
            // --- WIN LOGIC ---
            this.consecutiveWins++;
            this.consecutiveLosses = 0; // Reset losses

            if (AudioManager.instance) {
                AudioManager.instance.playSFX(AudioManager.instance.sfx_winBig);
            }
            console.log(`🎉 WIN! TOTAL: $${winResult.totalWin} | Streak: ${this.consecutiveWins}`);
            this.showWinAmount(winResult.totalWin);
            console.table(winResult.winningLines);

            // Check if we should switch to INTENSE music
            // Trigger: 2 wins in a row
            if (this.consecutiveWins >= 2 && !this.isIntenseMode) {
                console.log('🔥 WIN STREAK! Switch to Intense Music!');
                this.isIntenseMode = true;
                if (AudioManager.instance && AudioManager.instance.bgm_pharaoh_intense) {
                    AudioManager.instance.fadeBGM(AudioManager.instance.bgm_pharaoh_intense, 1.0);
                }
            }

        } else {
            // --- LOSE LOGIC ---
            this.consecutiveWins = 0; // Reset wins

            if (this.isIntenseMode) {
                this.consecutiveLosses++;
                console.log(`❄️ LOSS count: ${this.consecutiveLosses}/3 to calm down.`);

                // Calm down: 3 losses in a row
                if (this.consecutiveLosses >= 3) {
                    console.log('🧊 CALM DOWN. Switch back to Normal Music.');
                    this.isIntenseMode = false;
                    this.consecutiveLosses = 0;
                    if (AudioManager.instance && AudioManager.instance.bgm_pharaoh) {
                        AudioManager.instance.fadeBGM(AudioManager.instance.bgm_pharaoh, 1.0);
                    }
                }
            }

            console.log('😢 NO WIN.');
        }


        // Sau 1s quay về IDLE để cho spin tiếp
        this.scheduleOnce(() => {
            this.setState(SlotState.IDLE);
        }, 1);
    }

    showWinAmount(totalWin: number = 200) {
        if (!this.youWinNode) return;

        const amountNode = this.youWinNode.getChildByName("Amount");
        if (!amountNode) {
            console.error('❌ Amount node not found in YouWinNode! check the name "Amount" vs "amount"');
            return;
        }

        const digits = totalWin.toString().split('');

        // Ensure enough digit nodes
        while (amountNode.children.length < digits.length) {
            const digitNode = new Node();
            const sprite = digitNode.addComponent(Sprite);
            amountNode.addChild(digitNode);
        }

        for (let i = 0; i < amountNode.children.length; i++) {
            const digitNode = amountNode.children[i];
            const sprite = digitNode.getComponent(Sprite);

            if (i < digits.length) {
                const digit = parseInt(digits[i]);
                sprite.spriteFrame = this.digitSprites[digit];
                digitNode.active = true;
            } else {
                digitNode.active = false;
            }
        }

        // Ensure UIOpacity component exists
        let opacityComp = this.youWinNode.getComponent(UIOpacity);
        if (!opacityComp) {
            opacityComp = this.youWinNode.addComponent(UIOpacity);
        }

        // Set initial styles
        this.youWinNode.active = true;
        this.youWinNode.setScale(new Vec3(0.5, 0.5, 1)); // pop from small
        opacityComp.opacity = 0;

        // Pop-in + fade-in animation
        tween(this.youWinNode)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();

        tween(opacityComp)
            .to(0.3, { opacity: 255 })
            .delay(this.winDisplayDuration)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.youWinNode.active = false;
            })
            .start();
    }

    /**
     * Xử lý khi user click nút Back
     * Load trực tiếp về LobbyScene
     */
    onDestroy() {
        if (this.btnSpin) {
            let btnNode = this.btnSpin;
            if (!(this.btnSpin instanceof Node) && (this.btnSpin as any).node) {
                btnNode = (this.btnSpin as any).node;
            }
            if (btnNode && typeof btnNode.off === 'function') {
                btnNode.off(Node.EventType.TOUCH_END, this.onSpinButtonClicked, this);
            }
        }
    }

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

