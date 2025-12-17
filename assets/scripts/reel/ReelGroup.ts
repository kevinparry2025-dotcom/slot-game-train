import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;
import { Reel } from './Reel';

@ccclass('ReelGroup')
export class ReelGroup extends Component {
    @property([Reel])
    reels: Reel[] = [];
    stopDelay: number = 0.3;
    private currentReelIndex: number = 0;


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

