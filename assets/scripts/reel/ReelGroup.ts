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


    // Callback khi từng reel dừng: (index) => void
    public onReelStop?: (index: number) => void;

    /**
     * Khởi tạo ReelGroup với configuration
     */
    public init(config?: ReelConfig) {
        if (config) {
            this.config = config;
            this.stopDelay = config.stopDelay;
        }

        // Khởi tạo tất cả reels với cùng config
        this.reels.forEach((reel, index) => {
            reel.init(this.config);

            // Lắng nghe sự kiện dừng từ reel
            reel.onStop = () => {
                // console.log(`🛑 ReelGroup: Reel ${index} stopped.`);
                if (this.onReelStop) {
                    this.onReelStop(index);
                }
            };
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

        // Bắt đầu dừng tuần tự từ reel đầu tiên
        this.stopReelsSequentially();
    }

    public stopReelsSequentially() {
        this.currentReelIndex = 0;
        this.triggerStopForCurrentReel();
    }

    private triggerStopForCurrentReel() {
        if (this.currentReelIndex >= this.reels.length) {
            // Đã dừng hết tất cả reels -> CHECK WIN
            console.log('🏁 All reels stopped. Checking for win...');
            // TODO: Trigger check win logic here
            return;
        }

        const reelIndex = this.currentReelIndex;
        const reel = this.reels[reelIndex];

        // Setup callback: Khi reel này dừng xong -> gọi reel tiếp theo
        // Lưu ý: Chúng ta override onStop của reel này để chain sang reel kế tiếp.
        // "Stop xong" nghĩa là đã snap vào grid và animation hoàn tất.
        reel.onStop = () => {
            // console.log(`🛑 Reel ${reelIndex} stopped completely.`);

            // Gọi callback chung (nếu có) để Controller bên ngoài biết
            if (this.onReelStop) {
                this.onReelStop(reelIndex);
            }

            // Kích hoạt việc dừng reel TIẾP THEO
            this.currentReelIndex++;

            // Có thể thêm 1 chút delay nhỏ xíu ở đây nếu muốn hiệu ứng "pặc... pặc... pặc"
            // thay vì dừng quá liền mạch, nhưng logic cốt lõi vẫn là "chờ 1 xong mới triggers 2"
            if (this.stopDelay > 0) {
                this.scheduleOnce(() => {
                    this.triggerStopForCurrentReel();
                }, this.stopDelay);
            } else {
                this.triggerStopForCurrentReel();
            }
        };

        // Bắt đầu quy trình dừng cho reel này
        // (Nó sẽ tìm target symbol, phanh, và snap)
        reel.stopSpin();
    }

    /**
    * Lấy kết quả của tất cả reels
    */
    public getResult(): number[][] {
        return this.reels.map(reel => reel.getVisibleSymbols());
    }

}

