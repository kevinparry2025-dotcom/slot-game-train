import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { Reel } from './Reel';
import { ReelConfig, FruitsReelConfig } from './ReelConfig';

@ccclass('ReelGroup')
export class ReelGroup extends Component {
    @property([Reel])
    reels: Reel[] = [];

    private config: ReelConfig = FruitsReelConfig; // Cấu hình mặc định
    private stopDelay: number = 0.3;
    private currentReelIndex: number = 0;


    /**
     * Khởi tạo ReelGroup với configuration
     */
    public init(config?: ReelConfig) {
        if (config) {
            this.config = config;
            this.stopDelay = config.stopDelay;
        }

        // Khởi tạo tất cả reels với cùng config
        this.reels.forEach(reel => {
            reel.init(this.config);
        });
    }

    /**
    * Bắt đầu quay tất cả reels cùng lúc
    */
    public startAllReels() {
        this.reels.forEach(reel => {
            reel.startSpin();
        });
    }

    public stopReelsSequentially() {
        this.currentReelIndex = 0;
        this.stopNextReel();
    }

    /**
     * Dừng reels tuần tự với kết quả mục tiêu từ Result Matrix
     * @param targetResults - Mảng symbol IDs mục tiêu, vd: [1, 3, 4]
     */
    public stopWithResult(targetResults: number[]) {
        console.log('🎯 Result Matrix received:', targetResults);

        // Gán target cho từng reel
        targetResults.forEach((symbolId, index) => {
            if (index < this.reels.length) {
                this.reels[index].setTargetSymbol(symbolId);
            }
        });

        // Bắt đầu dừng tuần tự
        this.stopReelsSequentially();
    }


    private stopNextReel() {
        if (this.currentReelIndex >= this.reels.length) {
            // TODO: Trigger check win logic
            return;
        }

        const reel = this.reels[this.currentReelIndex];
        reel.stopSpin();

        // Schedule dừng reel tiếp theo
        this.scheduleOnce(() => {
            this.currentReelIndex++;
            this.stopNextReel();
        }, this.stopDelay);
    }

    /**
    * Lấy kết quả của tất cả reels
    */
    public getResult(): number[][] {
        return this.reels.map(reel => reel.getVisibleSymbols());
    }

}

