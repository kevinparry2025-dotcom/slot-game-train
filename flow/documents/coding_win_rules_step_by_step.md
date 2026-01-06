# Hướng Dẫn Code: Slot Win Rules (Từng Bước)

Tài liệu này sẽ hướng dẫn bạn tự tay code tính năng **Tính Thắng Thua (Win Rules)** cho game. Chúng ta sẽ không copy-paste cả cục, mà sẽ đi từng bước nhỏ để bạn hiểu rõ mình đang viết cái gì.

Chúng ta sẽ tạo một file mới tên là `SlotRuleManager.ts` trong thư mục `assets/scripts/game/`.

---

## Bước 1: Chuẩn Bị "Nguyên Liệu" (Enum & Interface)

Trước khi nấu ăn, phải chuẩn bị nguyên liệu. Trong code, đó là định nghĩa các con số và kiểu dữ liệu.

Mở file `SlotRuleManager.ts` và viết đoạn này đầu tiên:

```typescript
import { _decorator } from 'cc';
const { ccclass } = _decorator;

// 1. Đặt tên cho các con số (Enum)
// Thay vì nhớ số 0 là gì, số 7 là gì, ta đặt tên cho nó dễ gọi.
export enum SymbolID {
    TEN = 0,    // Số 10 (Hình cùi bắp nhất)
    J = 1,
    Q = 2,
    K = 3,
    A = 4,
    ITEM_1 = 5, // Đồ vật 1
    ITEM_2 = 6, // Đồ vật 2
    PHARAOH = 7,// Vua Pharaoh (Xịn nhất)
    WILD = 8,   // WILD (Thay thế tất cả)
    SCATTER = 9 // SCATTER (Nổ hũ / Free spin)
}

// 2. Định nghĩa cái "Kết Quả" (Interface)
// Máy tính cần biết: Thắng bao nhiêu? Thắng dòng nào?
export interface WinResult {
    totalWin: number;       // Tổng tiền ăn được
    winningLines: any[];    // Danh sách các dòng thắng
    isFreeSpin: boolean;    // Có được quay miễn phí không?
}

@ccclass('SlotRuleManager')
export class SlotRuleManager {
    // Chúng ta sẽ viết tiếp code vào trong bụng class này...
}
```

---

## Bước 2: Lập "Bảng Lương" (Paytable)

Giờ ta phải quy định: 3 hình Pharaoh thì ăn bao nhiêu tiền? 5 hình thì ăn bao nhiêu?

Viết tiếp vào trong class `SlotRuleManager`:

```typescript
    // Bảng trả thưởng: [3 hình, 4 hình, 5 hình]
    // Ví dụ: PHARAOH: [50, 200, 1000] nghĩa là:
    // - 3 con = x50 lần cược
    // - 5 con = x1000 lần cược
    private static readonly PAYTABLE: Record<number, number[]> = {
        [SymbolID.TEN]:     [5, 15, 50],
        [SymbolID.J]:       [5, 15, 50],
        [SymbolID.Q]:       [10, 25, 100],
        [SymbolID.K]:       [10, 30, 150],
        [SymbolID.A]:       [15, 50, 200],
        [SymbolID.ITEM_1]:  [20, 80, 300],
        [SymbolID.ITEM_2]:  [30, 100, 500],
        [SymbolID.PHARAOH]: [50, 200, 1000],
    };
```

---

## Bước 3: Vẽ "Đường Kẻ Thắng" (Paylines)

Máy tính không có mắt để nhìn "đường chéo" hay "chữ V". Ta phải chỉ cho nó biết các ô nào nối với nhau bằng tọa độ `[Hàng cột 1, Hàng cột 2, ...]`.

*   Hàng 0 = Trên cùng
*   Hàng 1 = Giữa
*   Hàng 2 = Dưới cùng

Thêm đoạn này vào dưới Paytable:

```typescript
    // 20 Dòng kẻ tiêu chuẩn
    private static readonly PAYLINES: number[][] = [
        [1, 1, 1, 1, 1], // Dòng 1: Ngang giữa (Dễ trúng nhất)
        [0, 0, 0, 0, 0], // Dòng 2: Ngang trên
        [2, 2, 2, 2, 2], // Dòng 3: Ngang dưới
        [0, 1, 2, 1, 0], // Dòng 4: Chữ V
        [2, 1, 0, 1, 2], // Dòng 5: Chữ V ngược
        // ... (Bạn có thể thêm các dòng ziczac khác tùy ý)
    ];
```

---

## Bước 4: Viết Hàm "Trọng Tài" (Check Win) - PHẦN KHÓ NHẤT

Đây là bộ não của game. Nó sẽ quét từng dòng xem có trúng thưởng không.

Logic chạy như sau:
1.  Duyệt qua từng dòng kẻ (Line 1 -> Line 20).
2.  Lấy ra 5 hình trên dòng kẻ đó.
3.  So sánh từ trái sang phải:
    *   Giống nhau? -> Đếm tiếp (+1).
    *   Gặp **WILD**? -> Tính luôn là giống (+1).
    *   Khác nhau? -> **DỪNG LẠI NGAY** (Gãy chuỗi).
4.  Nếu đếm được >= 3 hình -> **THẮNG!** Tra bảng lương để tính tiền.

Code chi tiết (Copy hàm này vào class):

```typescript
    public static checkWin(resultMatrix: number[][], betAmount: number = 1): WinResult {
        // Tạo cái giỏ đựng kết quả
        const result: WinResult = { totalWin: 0, winningLines: [], isFreeSpin: false };

        // 1. DUYỆT QUA TỪNG DÒNG KẺ
        for (let lineIndex = 0; lineIndex < this.PAYLINES.length; lineIndex++) {
            const pattern = this.PAYLINES[lineIndex]; // Lấy mẫu dòng (vd: 1,1,1,1,1)
            
            // Lấy 5 con hình thực tế từ ma trận ra
            // Ma trận lưu kiểu: [Cột][Hàng]
            const items = [
                resultMatrix[0][pattern[0]], 
                resultMatrix[1][pattern[1]], 
                resultMatrix[2][pattern[2]],
                resultMatrix[3][pattern[3]],
                resultMatrix[4][pattern[4]]
            ];

            // 2. SO SÁNH (Check Logic)
            const firstItem = items[0]; // Lấy con đầu tàu làm chuẩn
            
            // Nếu con đầu là Scatter thì dòng này bỏ qua (Scatter tính riêng)
            if (firstItem === SymbolID.SCATTER) continue;

            let count = 1; // Mặc định là 1 (chính nó)
            let targetSymbol = firstItem; // Symbol chủ đạo để so sánh

            // Quét 4 con còn lại phía sau
            for (let i = 1; i < items.length; i++) {
                const current = items[i];

                // a. Nếu gặp WILD -> Chấp hết!
                if (current === SymbolID.WILD) {
                    count++;
                }
                // b. Nếu gặp đúng đồng bọn -> Ngon!
                else if (current === targetSymbol || targetSymbol === SymbolID.WILD) {
                    // Nếu target đang là Wild (do con đầu là Wild), thì giờ gán target thật
                    if (targetSymbol === SymbolID.WILD) targetSymbol = current;
                    count++;
                }
                // c. Nếu gặp người lạ -> Toang! Dừng cuộc chơi.
                else {
                    break; 
                }
            }

            // 3. TÍNH TIỀN
            if (count >= 3) {
                // Nếu 5 con đều Wild, coi như trúng Jackpot Pharaoh
                if (targetSymbol === SymbolID.WILD) targetSymbol = SymbolID.PHARAOH;

                // Lấy hệ số nhân: [3 hình, 4 hình, 5 hình]
                // count 3 -> lấy index 0
                const multiplier = this.PAYTABLE[targetSymbol][count - 3];
                
                if (multiplier) {
                    const money = multiplier * betAmount;
                    result.totalWin += money;
                    
                    // Ghi sổ: Dòng này thắng!
                    result.winningLines.push({ 
                        line: lineIndex + 1, 
                        symbol: targetSymbol, 
                        money: money 
                    });
                }
            }
        }

        return result; // Trả về kết quả cuối cùng
    }
```

---

## Bước 5: Áp Dụng Vào Game

Giờ "cỗ máy tính tiền" đã xong. Ta cần lắp nó vào máy đánh bạc (`PharaohSlotMachine.ts`).

Mở file `PharaohSlotMachine.ts`, tìm hàm **showResult()** và thêm dòng này vào:

```typescript
import { SlotRuleManager } from './SlotRuleManager'; // Nhớ import ở đầu file

// ...

private showResult() {
    // 1. Lấy kết quả hiện tại trên màn hình
    const currentMatrix = this.reelGroup.getResult();

    // 2. Nhờ "Trọng Tài" tính tiền hộ
    const winResult = SlotRuleManager.checkWin(currentMatrix, 100); // 100$ 1 ván

    // 3. Thông báo
    if (winResult.totalWin > 0) {
        console.log(`🎉 CHÚC MỪNG! BẠN THẮNG: $${winResult.totalWin}`);
        console.log('Chi tiết:', winResult.winningLines);
    } else {
        console.log('😢 Chúc bạn may mắn lần sau.');
    }

    this.setState(SlotState.RESULT);
    // ...
}
```

---

## Tổng Kết

1.  **SymbolID**: Định danh các hình ảnh.
2.  **Paytable**: Quy định giá tiền.
3.  **Paylines**: Quy định các đường kẻ thắng.
4.  **checkWin()**: Hàm logic cốt lõi để so sánh và tính toán.

Bạn cứ làm theo từng bước này, copy code vào đúng chỗ là game sẽ chạy ngon lành! Chúc bạn thành công! 🎰
