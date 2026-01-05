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
import { ReelConfig, FruitsReelConfig } from "./ReelConfig";
const { ccclass, property } = _decorator;

@ccclass("Reel")
export class Reel extends Component {

  @property(Prefab)
  symbolPrefab: Prefab = null!;

  @property([SpriteFrame])
  symbolSpriteFrames: SpriteFrame[] = []; // Kéo 5 hình symbols vào


  private symbols: Node[] = [];
  private config: ReelConfig = FruitsReelConfig; // Cấu hình mặc định
  private symbolHeight: number = 120; // Chiều cao mỗi symbol
  private symbolCount: number = 10; // Số symbols hiển thị
  private isSpinning: boolean = false;
  private isStopping: boolean = false;
  private spinSpeed: number = 0;
  private targetSpeed: number = 1000;
  private accelerationRate: number = 1000; // Tốc độ tăng tốc (px/s²)
  private decelerationRate: number = 4000; // Tốc độ giảm tốc (px/s²)
  private stopSpinTimer: number | null = null; // Timer để tự động dừng sau 3s
  private targetSymbolId: number | null = null; // Symbol ID mục tiêu để dừng lại


  /**
   * Khởi tạo Reel với configuration
   */
  public init(config?: ReelConfig) {
    if (config) {
      this.config = config;

      // Áp dụng config vào các thuộc tính
      this.symbolHeight = config.symbolHeight;
      this.symbolCount = config.totalSymbolCount;
      this.targetSpeed = config.targetSpeed;
      this.accelerationRate = config.accelerationRate;
      this.decelerationRate = config.decelerationRate;

      // Nếu config có symbolSpriteFrames thì override
      if (config.symbolSpriteFrames && config.symbolSpriteFrames.length > 0) {
        this.symbolSpriteFrames = config.symbolSpriteFrames;
      }
    }

    this.initSymbols();
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


  /**
  * Bắt đầu quay reel
  */
  public startSpin() {
    this.isSpinning = true;
    this.spinSpeed = 0;  // Bắt đầu từ vận tốc 0


    // Hủy timer cũ nếu có
    if (this.stopSpinTimer !== null) {
      clearTimeout(this.stopSpinTimer);
    }
  }

  /**
   * Set symbol ID mục tiêu (từ Result Matrix)
   * Target symbol sẽ tự nhiên xuất hiện qua infinite scroll
   */
  public setTargetSymbol(symbolId: number) {
    this.targetSymbolId = symbolId;
    console.log(`🎯 Reel target set to symbol ID: ${symbolId}`);
  }

  /**
   * Dừng quay tại symbol cụ thể (Result Matrix)
   */
  public stopAtSymbol(symbolId: number) {
    this.setTargetSymbol(symbolId);
    this.stopSpin();
  }


  /**
   * Dừng quay với bounce effect
   */
  public stopSpin() {
    this.isStopping = true;
    // Không set isSpinning = false ngay, để logic update xử lý việc "bắt" target
  }

  // Callback khi reel dừng hẳn
  public onStop?: () => void;

  /**
   * Căn chỉnh symbols về grid gần nhất (small snap only)
   * Mỗi symbol chỉ di chuyển tối đa ±60px
   */
  private alignSymbols() {
    // console.log(`🎯 Aligning symbols to nearest grid...`);

    let completedCount = 0;
    const totalSymbols = this.symbols.length;

    this.symbols.forEach((symbol, index) => {
      const currentY = symbol.position.y;
      const nearestGridY = Math.round(currentY / this.symbolHeight) * this.symbolHeight;
      // const distance = Math.abs(nearestGridY - currentY);

      // console.log(`Symbol #${index}: Y=${currentY.toFixed(2)} → ${nearestGridY} (Δ=${distance.toFixed(2)}px)`);

      tween(symbol)
        .to(0.2, { position: new Vec3(0, nearestGridY, 0) })
        .call(() => {
          completedCount++;
          // Khi tất cả symbol đã snap xong -> Trigger callback
          if (completedCount === totalSymbols) {
            if (this.onStop) {
              this.onStop();
            }
          }
        })
        .start();
    });

    // Reset target sau khi đã dừng
    this.targetSymbolId = null;
  }

  /**
   * Tìm Node của target symbol trong reel
   */
  private findTargetSymbol(): Node | null {
    if (this.targetSymbolId === null) return null;

    for (const symbolNode of this.symbols) {
      const symbolComponent = symbolNode.getComponent(Symbol)!;
      if (symbolComponent.getSymbolId() === this.targetSymbolId) {
        return symbolNode;
      }
    }

    return null;
  }

  /**
   * Kiểm tra xem target symbol đã được đặt vào reel chưa
   */
  private isTargetSymbolPlaced(): boolean {
    return this.findTargetSymbol() !== null;
  }


  /**
   * Update mỗi frame
   */
  update(dt: number) {
    if (!this.isSpinning) return;

    // --- PHASE 1: ACCELERATION & CONSTANT SPEED ---
    if (!this.isStopping) {
      this.spinSpeed += this.accelerationRate * dt;
      if (this.spinSpeed > this.targetSpeed) {
        this.spinSpeed = this.targetSpeed;
      }
    }
    // --- PHASE 2: SEEKING TARGET & BRAKING ---
    else {
      // Logic "Smart Braking":
      // Chỉ bắt đầu giảm tốc khi Target Symbol đã xuất hiện và ở vị trí thích hợp để dừng đúng lúc.

      let readyToBrake = false;

      if (this.targetSymbolId !== null) {
        const targetNode = this.findTargetSymbol();

        if (targetNode) {
          const targetY = targetNode.position.y;
          // Tính toán vị trí Y của target:
          // Target đang từ trên đi xuống.
          // Chúng ta muốn dừng tại Y=0.
          // Cần một quãng đường để giảm tốc từ targetSpeed về 0.
          // Công thức: v² - u² = 2as  =>  s = v² / (2a)
          // s = quãng đường phanh cần thiết.
          // v = vận tốc hiện tại (spinSpeed).
          // a = gia tốc hãm (decelerationRate).

          const brakingDistance = (this.spinSpeed * this.spinSpeed) / (2 * this.decelerationRate);

          // Strict Window:
          // Chúng ta muốn dừng xoay quanh Y=0.
          // Do tích phân Euler (dt) có thể gây sai số, chúng ta nên aim dừng ở [0, -30] (hơi trôi qua 1 chút)
          // thay vì [30, 0] (dừng non).
          // Stopping Point = currentY - brakingDistance
          // Want: -30 <= Stopping Point <= 10
          // => -30 <= currentY - brakingDistance <= 10
          // => brakingDistance - 30 <= currentY <= brakingDistance + 10

          const lowerBound = brakingDistance - 30; // Chấp nhận dừng quá vạch 30px
          const upperBound = brakingDistance + 10; // Chấp nhận dừng non 10px

          if (targetY >= lowerBound && targetY <= upperBound) {
            readyToBrake = true;
            // console.log(`🛑 BRAKING NOW! Target Y=${targetY.toFixed(0)}, ReqDist=${brakingDistance.toFixed(0)}`);
          }
          // Nếu targetY < lowerBound: Đã lỡ cơ hội phanh (target trôi quá sâu). Kệ nó, chờ recycle vòng sau.
          // Nếu targetY > upperBound: Chưa tới lúc phanh.
        } else {
          // Target chưa xuất hiện -> Tiếp tục quay max speed
        }
      } else {
        // Không có target cụ thể -> Dừng ngay lập tức (cứ phanh bừa)
        readyToBrake = true;
      }

      if (readyToBrake) {
        this.spinSpeed -= this.decelerationRate * dt;

        // --- PHASE 3: STOPPING ---
        if (this.spinSpeed <= 50) { // Ngưỡng dừng hẳn
          this.spinSpeed = 0;
          this.isSpinning = false;
          this.isStopping = false;
          this.alignSymbols();
          console.log('✅ Reel stopped completely.');
          return;
        }
      } else {
        // Nếu chưa đến lúc phanh, hãy đảm bảo vẫn giữ tốc độ target
        if (this.spinSpeed < this.targetSpeed) {
          this.spinSpeed += this.accelerationRate * dt;
        }
      }
    }

    // --- MOVEMENT & RENDERING logic ---

    // Tính opacity/blur
    const blurAmount = Math.min(this.spinSpeed / this.targetSpeed, 1);
    const opacity = 255 * (1 - blurAmount * 0.25);

    this.symbols.forEach(symbol => {
      // 1. Di chuyển
      const pos = symbol.position;
      symbol.setPosition(pos.x, pos.y - this.spinSpeed * dt, pos.z);

      // 2. Visual effects
      const symbolComponent = symbol.getComponent(Symbol)!;
      symbolComponent.setOpacity(opacity);
      symbolComponent.createMotionBlur(blurAmount);

      // 3. Infinite Scroll (Recycle)
      // Logic cũ: if (pos.y < -135 && !this.isStopping)
      // FIX MỚI: Vẫn cho phép recycle khi isStopping, MIỄN LÀ readyToBrake chưa kích hoạt!
      // (Thực tế logic recycle độc lập với braking state, nó chỉ dựa vào vị trí)

      const thresholdY = -this.symbolHeight - 15; // ~ -135

      if (pos.y < thresholdY) {
        // Chỉ recycle nếu đang quay nhanh hoặc target chưa bị trôi qua quá xa
        // (Thực tế chỉ cần check y < threshold là đủ để đưa lên trên đầu)

        symbol.setPosition(
          pos.x,
          pos.y + this.symbolHeight * this.symbolCount,
          pos.z
        );

        // DATA INJECTION logic
        let symbolIdToSet: number;

        // Ưu tiên inject target nếu đang cần tìm nó
        if (this.targetSymbolId !== null && this.isStopping && !this.isTargetSymbolPlaced()) {
          symbolIdToSet = this.targetSymbolId;
          console.log(`🎯 Start Stopping... Injecting Target ID: ${this.targetSymbolId}`);
        } else {
          // Random bình thường
          symbolIdToSet = Math.floor(Math.random() * this.symbolSpriteFrames.length);
        }

        symbolComponent.setSymbol(symbolIdToSet, this.symbolSpriteFrames[symbolIdToSet]);
      }
    });
  }


  public getVisibleSymbols(): number[] {
    // Lấy 3 symbols GẦN TRUNG TÂM NHẤT theo vị trí Y
    // Row 1 (trên):   Y ≈ 120
    // Row 2 (giữa):   Y ≈ 0    ← TARGET ROW  
    // Row 3 (dưới):   Y ≈ -120

    const targetYPositions = [120, 0, -120]; // Từ trên xuống
    const result: number[] = [];

    targetYPositions.forEach(targetY => {
      let closestSymbol: Node | null = null;
      let minDistance = Infinity;

      // Tìm symbol gần targetY nhất
      this.symbols.forEach(symbolNode => {
        const distance = Math.abs(symbolNode.position.y - targetY);
        if (distance < minDistance) {
          minDistance = distance;
          closestSymbol = symbolNode;
        }
      });

      if (closestSymbol) {
        const symbolComponent = closestSymbol.getComponent(Symbol)!;
        result.push(symbolComponent.getSymbolId());
      }
    });

    return result;
  }
}
