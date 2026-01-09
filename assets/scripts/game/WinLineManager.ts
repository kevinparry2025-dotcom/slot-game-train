import { _decorator, Component, Node, tween, UIOpacity } from 'cc';
import { WinLine } from './SlotRuleManager';
const { ccclass, property } = _decorator;

@ccclass('WinLineManager')
export class WinLineManager extends Component {

    @property([Node])
    lineNodes: Node[] = [];

    /**
     * HƯỚNG DẪN MAPPING (Theo SlotRuleManager):
     * Index 0: Line 1 (Ngang Giữa)
     * Index 1: Line 2 (Ngang Trên)
     * Index 2: Line 3 (Ngang Dưới)
     * Index 3: Line 4 (Chữ V)
     * Index 4: Line 5 (Chữ V ngược)
     * Index 5: Line 6 (M-shape?)
     * ... và cứ tiếp tục như vậy.
     * Kéo các node tương ứng vào mảng lineNodes theo đúng thứ tự.
     * Nếu chưa có visual cho line nào thì để trống hoặc null ở index đó.
     */

    onLoad() {
        // Ẩn tất cả khi bắt đầu
        this.reset();
    }

    public reset() {
        this.lineNodes.forEach(node => {
            if (node) node.active = false;
        });
        this.unscheduleAllCallbacks();
        // Stop all tweens on lines if any?
    }

    /**
     * Hiển thị các line thắng
     * @param winningLines Danh sách các line thắng từ SlotRuleManager
     */
    public showWinningLines(winningLines: WinLine[]) {
        if (!winningLines || winningLines.length === 0) return;

        // Cách 1: Hiển thị tất cả cùng lúc (Đơn giản)
        // this.showAllLines(winningLines);

        // Cách 2: Hiển thị từng line một (Tuần tự) -> Đẹp hơn
        if (winningLines.length === 1) {
            this.showLine(winningLines[0].lineIndex - 1); // lineIndex trong rule là 1-based
        } else {
            this.playWinLineAnimation(winningLines);
        }
    }

    private showAllLines(winningLines: WinLine[]) {
        winningLines.forEach(win => {
            // Rule trả về index từ 1..20, nhưng mảng của ta là 0..19
            const index = win.lineIndex - 1;
            this.showLine(index);
        });
    }

    private showLine(index: number) {
        if (index >= 0 && index < this.lineNodes.length) {
            const lineNode = this.lineNodes[index];
            if (lineNode) {
                lineNode.active = true;

                // Hiệu ứng nhấp nháy (Blink)
                const opacity = lineNode.getComponent(UIOpacity) || lineNode.addComponent(UIOpacity);
                opacity.opacity = 0;
                tween(opacity)
                    .to(0.2, { opacity: 255 })
                    .delay(1.5)
                    .to(0.2, { opacity: 0 })
                    .union()
                    .repeatForever()
                    .start();
            }
        }
    }

    private playWinLineAnimation(winningLines: WinLine[]) {
        let currentIndex = 0;

        const showNext = () => {
            // Ẩn line trước đó
            const prevIndex = (currentIndex - 1 + winningLines.length) % winningLines.length;
            const prevWin = winningLines[prevIndex];
            const prevNodeIndex = prevWin.lineIndex - 1;
            this.hideLine(prevNodeIndex);

            // Hiện line hiện tại
            const currentWin = winningLines[currentIndex];
            const currentNodeIndex = currentWin.lineIndex - 1;

            // Chỉ hiện line (không cần blink phức tạp vì chuyển nhanh)
            if (currentNodeIndex >= 0 && currentNodeIndex < this.lineNodes.length) {
                const node = this.lineNodes[currentNodeIndex];
                if (node) {
                    node.active = true;
                    // Fade in nhẹ
                    const opacity = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
                    opacity.opacity = 255;
                }
            }

            // Setup next
            currentIndex = (currentIndex + 1) % winningLines.length;
        };

        // Chạy ngay cái đầu tiên
        showNext();

        // Loop mỗi 2 giây
        this.schedule(showNext, 2.0);
    }

    private hideLine(index: number) {
        if (index >= 0 && index < this.lineNodes.length) {
            const lineNode = this.lineNodes[index];
            if (lineNode) {
                lineNode.active = false;
                // Stop tweens if needed
                // Tween.stopAllByTarget(lineNode); // Cần import Tween
            }
        }
    }
}
