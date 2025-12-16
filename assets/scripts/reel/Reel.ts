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

  @property(Node)
  btnSpin: Node = null!; // Nút spin bình thường

  @property(Node)
  btnSpinDisable: Node = null!; // Nút spin bị disable

  private symbols: Node[] = [];
  private symbolHeight: number = 120; // Chiều cao mỗi symbol
  private symbolCount: number = 10; // Số symbols hiển thị
  private isSpinning: boolean = false;
  private isStopping: boolean = false;
  private spinSpeed: number = 0;
  private targetSpeed: number = 1000;
  private decelerationRate: number = 4000; // Tốc độ giảm tốc (px/s²)
  private stopSpinTimer: number | null = null; // Timer để tự động dừng sau 3s

  onLoad(): void {
    this.initSymbols();
    this.init();
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
      symbolComponent.setSymbol(randomId, this.symbolSpriteFrames[randomId]);

      this.symbols.push(symbolNode);

    }
  }
  init() {
    this.btnSpin.active = true;
    this.btnSpinDisable.active = false;
  }

  /**
  * Bắt đầu quay reel
  */
  public startSpin() {
    this.isSpinning = true;
    this.spinSpeed = 0;  // Bắt đầu từ vận tốc 0

    // Toggle buttons: Ẩn btn-spin, hiện btn-spin-disable
    if (this.btnSpin) {
      this.btnSpin.active = false;
    }
    if (this.btnSpinDisable) {
      this.btnSpinDisable.active = true;
    }

    // Hủy timer cũ nếu có
    if (this.stopSpinTimer !== null) {
      clearTimeout(this.stopSpinTimer);
    }

    // Tự động dừng sau 3 giây
    this.stopSpinTimer = setTimeout(() => {
      this.stopSpin();
      this.stopSpinTimer = null;
    }, 6000) as unknown as number; // 3000ms = 3s
  }

  /**
   * Dừng quay với bounce effect
   */
  public stopSpin() {
    // Hủy timer tự động nếu có
    if (this.stopSpinTimer !== null) {
      clearTimeout(this.stopSpinTimer);
      this.stopSpinTimer = null;
    }

    this.isSpinning = false;
    this.isStopping = true;
  }

  /**
   * Căn chỉnh symbols về vị trí chuẩn (grid-aligned)
   */
  /**
   * Căn chỉnh symbols về vị trí grid chuẩn khi reel dừng
   * 
   * Ý TƯỞNG:
   * - Mỗi symbol phải dừng tại vị trí chia hết cho 120 (grid)
   * - Vd: 0, 120, 240, 360, -120, -240, v.v.
   * - Tìm grid GẦN NHẤT với vị trí hiện tại
   * 
   * CÔNG THỨC:
   * nearestGrid = Math.round(currentY / 120) * 120
   * 
   * VÍ DỤ:
   * - Nếu symbol ở Y=739.84:
   *   739.84 / 120 = 6.165 → round = 6 → 6 * 120 = 720 ✅
   * 
   * - Nếu symbol ở Y=-100.15:
   *   -100.15 / 120 = -0.835 → round = -1 → -1 * 120 = -120 ✅
   */
  private alignSymbols() {
    this.symbols.forEach((symbol, index) => {
      // Bước 1: Lấy vị trí hiện tại (số lẻ, vd: 739.8438...)
      const currentY = symbol.position.y;

      // Bước 2: Tính vị trí grid gần nhất
      // - Chia cho 120: Chuyển thành "số ô grid" (vd: 6.165)
      // - Math.round: Làm tròn về số nguyên gần nhất (vd: 6)
      // - Nhân 120: Chuyển lại thành pixel (vd: 720)
      const nearestGridY = Math.round(currentY / this.symbolHeight) * this.symbolHeight;

      // Debug: Xem symbol di chuyển từ đâu đến đâu
      console.log(`Symbol #${index}: ${currentY.toFixed(2)} → ${nearestGridY}`);

      // Bước 3: Di chuyển symbol đến vị trí grid (smooth animation 0.2s)
      tween(symbol)
        .to(0.2, { position: new Vec3(0, nearestGridY, 0) })
        .start();
    });
  }

  /**
   * Update mỗi frame
   */
  update(dt: number) {
    // Tăng tốc khi đang quay
    if (this.isSpinning) {
      this.spinSpeed += 1000 * dt;  // Tăng tốc 1000 px/s²
      if (this.spinSpeed > this.targetSpeed) {
        this.spinSpeed = this.targetSpeed;
      }
    }

    // Giảm tốc khi đang dừng
    if (this.isStopping) {
      this.spinSpeed -= this.decelerationRate * dt;
      if (this.spinSpeed <= 0) {
        this.spinSpeed = 0;
        this.isStopping = false;
        this.alignSymbols();  // Căn chỉnh vị trí
        console.log('Reel stopped!');

        // Toggle buttons: Hiện btn-spin, ẩn btn-spin-disable
        if (this.btnSpin) {
          this.btnSpin.active = true;
        }
        if (this.btnSpinDisable) {
          this.btnSpinDisable.active = false;
        }
      }
    }

    // Di chuyển symbols xuống
    if (this.spinSpeed > 0) {
      this.symbols.forEach(symbol => {
        const pos = symbol.position;
        console.log("symbol", symbol);
        symbol.setPosition(pos.x, pos.y - this.spinSpeed * dt, pos.z);

        // Infinite scroll: khi symbol đi xuống dưới, đưa lên trên
        if (pos.y < -135) {
          symbol.setPosition(
            pos.x,
            pos.y + this.symbolHeight * this.symbolCount,
            pos.z
          );

          // Đổi hình ảnh random khi recycle
          const randomId = Math.floor(Math.random() * this.symbolSpriteFrames.length);
          const symbolComponent = symbol.getComponent(Symbol)!;
          symbolComponent.setSymbol(randomId, this.symbolSpriteFrames[randomId]);
        }
      });
    }
  }
}
