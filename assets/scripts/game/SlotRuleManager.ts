import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * =================================================================
 * 🎓 SLOT RULE MANAGER (QUẢN LÝ LUẬT CHƠI)
 * =================================================================
 * Class này chịu trách nhiệm tính toán thắng thua cho game.
 * Được viết theo phong cách "dễ hiểu nhất" cho người mới bắt đầu.
 */

// 1. ĐỊNH NGHĨA CÁC BIỂU TƯỢNG (SYMBOLS)
// Dùng Enum để không phải nhớ số 0, 1, 2... là cái gì.
export enum SymbolID {
    TEN = 0,    // Số 10
    J = 1,      // Chữ J
    Q = 2,      // Chữ Q
    K = 3,      // Chữ K
    A = 4,      // Chữ A
    ITEM_1 = 5, // Vật phẩm 1 (vd: Mắt Horus)
    ITEM_2 = 6, // Vật phẩm 2 (vd: Scarab)
    PHARAOH = 7,// Pharaoh (Giá trị cao nhất)
    WILD = 8,   // WILD (Thay thế mọi hình trừ Scatter)
    SCATTER = 9 // SCATTER (Kích hoạt Free Spin)
}

// 2. CẤU TRÚC KẾT QUẢ THẮNG (WIN RESULT)
// Để biết thắng bao nhiêu tiền, thắng dòng nào.
export interface WinLine {
    lineIndex: number;      // Thắng ở dòng kẻ số mấy (0-19)
    symbolId: number;       // Hình nào thắng (vd: Pharaoh)
    count: number;          // Số lượng liên tiếp (3, 4, hay 5 hình)
    winAmount: number;      // Tiền thắng của dòng này
}

export interface WinResult {
    totalWin: number;       // Tổng tiền thắng tất cả các dòng
    winningLines: WinLine[];// Danh sách các dòng thắng
    isFreeSpin: boolean;    // Có trúng Free Spin không?
}

@ccclass('SlotRuleManager')
export class SlotRuleManager {

    /**
     * =================================================================
     * 3. BẢNG TRẢ THƯỞNG (PAYTABLE)
     * =================================================================
     * Quy định: [3 hình, 4 hình, 5 hình] ăn bao nhiêu lần tiền cược?
     * Ví dụ: SymbolID.PHARAOH: [50, 200, 1000]
     * - 3 hình Pharaoh = x50
     * - 4 hình Pharaoh = x200
     * - 5 hình Pharaoh = x1000
     */
    private static readonly PAYTABLE: Record<number, number[]> = {
        [SymbolID.TEN]: [5, 15, 50],
        [SymbolID.J]: [5, 15, 50],
        [SymbolID.Q]: [10, 25, 100],
        [SymbolID.K]: [10, 30, 150],
        [SymbolID.A]: [15, 50, 200],
        [SymbolID.ITEM_1]: [20, 80, 300],
        [SymbolID.ITEM_2]: [30, 100, 500],
        [SymbolID.PHARAOH]: [50, 200, 1000],
        // WILD & SCATTER không có paytable dòng thông thường
    };

    /**
     * =================================================================
     * 4. CÁC DÒNG THẮNG (PAYLINES)
     * =================================================================
     * Grid 5x3 có các tọa độ dòng (Row) như sau:
     * 0: Hàng Trên
     * 1: Hàng Giữa
     * 2: Hàng Dưới
     * 
     * Ví dụ: Dòng 1 (Ngang giữa) = [1, 1, 1, 1, 1]
     */
    private static readonly PAYLINES: number[][] = [
        [1, 1, 1, 1, 1], // Line 1: Ngang giữa
        [0, 0, 0, 0, 0], // Line 2: Ngang trên
        [2, 2, 2, 2, 2], // Line 3: Ngang dưới
        [0, 1, 2, 1, 0], // Line 4: Chữ V
        [2, 1, 0, 1, 2], // Line 5: Chữ V ngược
        [0, 0, 1, 0, 0], // Line 6
        [2, 2, 1, 2, 2], // Line 7
        [1, 2, 2, 2, 1], // Line 8
        [1, 0, 0, 0, 1], // Line 9
        [1, 0, 1, 0, 1], // Line 10 (Snake 1)
        [1, 2, 1, 2, 1], // Line 11 (Snake 2)
        [0, 1, 0, 1, 0], // Line 12
        [2, 1, 2, 1, 2], // Line 13
        [1, 1, 0, 1, 1], // Line 14
        [1, 1, 2, 1, 1], // Line 15
        [0, 1, 1, 1, 0], // Line 16
        [2, 1, 1, 1, 2], // Line 17
        [0, 1, 2, 2, 2], // Line 18
        [2, 1, 0, 0, 0], // Line 19
        [0, 2, 0, 2, 0]  // Line 20
    ];

    /**
     * =================================================================
     * HÀM KIỂM TRA THẮNG (HÀM CHÍNH)
     * =================================================================
     * @param resultMatrix Ma trận kết quả [Cột][Hàng] (5x3)
     * @param betPerLine Số tiền cược cho mỗi dòng (vd: $1)
     */
    public static checkWin(resultMatrix: number[][], betPerLine: number = 1): WinResult {
        // Khởi tạo kết quả rỗng
        const result: WinResult = {
            totalWin: 0,
            winningLines: [],
            isFreeSpin: false
        };

        // BƯỚC 1: KIỂM TRA TỪNG DÒNG (Loop qua 20 dòng)
        for (let lineIndex = 0; lineIndex < this.PAYLINES.length; lineIndex++) {
            const currentPayline = this.PAYLINES[lineIndex]; // Lấy mẫu dòng (vd: [1,1,1,1,1])

            // Lấy 5 symbol thực tế trên màn hình dựa theo mẫu dòng
            // resultMatrix là mảng [Col][Row]
            const lineSymbols = [
                resultMatrix[0][currentPayline[0]], // Cột 1, Hàng theo mẫu
                resultMatrix[1][currentPayline[1]], // Cột 2, Hàng theo mẫu
                resultMatrix[2][currentPayline[2]],
                resultMatrix[3][currentPayline[3]],
                resultMatrix[4][currentPayline[4]]
            ];

            // BƯỚC 2: PHÂN TÍCH DÒNG NÀY CÓ THẮNG KHÔNG?
            // Luật: Phải bắt đầu từ ký tự đầu tiên
            const firstSymbol = lineSymbols[0];

            // Nếu ký tự đầu là Scatter, dòng này bỏ (Scatter tính riêng)
            if (firstSymbol === SymbolID.SCATTER) continue;

            // Bắt đầu đếm chuỗi liên tiếp (Mặc định là 1 vì có ký tự đầu)
            let matchCount = 1;
            // Xác định symbol chủ đạo của dòng (để xử lý Wild)
            let targetSymbol = firstSymbol;

            // Nếu ký tự đầu là WILD, symbol chủ đạo sẽ là ký tự khác Wild tiếp theo
            if (firstSymbol === SymbolID.WILD) {
                // Tạm thời chưa biết target là gì, cứ đếm tiếp
            }

            // Duyệt từ ký tự thứ 2 trở đi
            for (let i = 1; i < lineSymbols.length; i++) {
                const currentSymbol = lineSymbols[i];

                // Logic WILD:
                // 1. Nếu là Wild -> Luôn tính là khớp (match)
                if (currentSymbol === SymbolID.WILD) {
                    matchCount++;
                }
                // 2. Nếu không phải Wild:
                else {
                    // Nếu chưa xác định target (do đầu dòng toàn Wild), giờ xác định luôn
                    if (targetSymbol === SymbolID.WILD) {
                        targetSymbol = currentSymbol;
                        matchCount++;
                    }
                    // Nếu đã có target, kiểm tra xem có trùng k
                    else if (currentSymbol === targetSymbol) {
                        matchCount++;
                    }
                    // 3. Nếu gãy chuỗi (Khác symbol) -> DỪNG NGAY (Left to Right rule)
                    else {
                        break;
                    }
                }
            }

            // BƯỚC 3: TÍNH TIỀN THƯỞNG
            // Chỉ tính nếu chuỗi >= 3
            if (matchCount >= 3) {
                // Nếu cả dòng toàn Wild (5 Wild), target vẫn là Wild -> Xử lý đặc biệt nếu cần
                // Ở đây ta coi 5 Wild = Jackpot của Pharaoh luôn cho đơn giản
                if (targetSymbol === SymbolID.WILD) targetSymbol = SymbolID.PHARAOH;

                // Lấy bảng giá của symbol đó
                const payouts = this.PAYTABLE[targetSymbol];
                if (payouts) {
                    // matchCount 3 -> index 0
                    // matchCount 4 -> index 1
                    // matchCount 5 -> index 2
                    const multiplier = payouts[matchCount - 3];

                    if (multiplier > 0) {
                        const winMoney = multiplier * betPerLine;

                        // Lưu vào kết quả
                        result.totalWin += winMoney;
                        result.winningLines.push({
                            lineIndex: lineIndex + 1, // Đánh số từ 1 cho đẹp
                            symbolId: targetSymbol,
                            count: matchCount,
                            winAmount: winMoney
                        });
                    }
                }
            }
        }

        // BƯỚC 4: KIỂM TRA SCATTER (FREE SPIN)
        // Scatter tính riêng, không quan tâm dòng kẻ
        let scatterCount = 0;
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 3; row++) {
                if (resultMatrix[col][row] === SymbolID.SCATTER) {
                    scatterCount++;
                }
            }
        }

        if (scatterCount >= 3) {
            result.isFreeSpin = true;
            console.log(`✨ FREE SPIN TRIGGERED! (${scatterCount} Scatters found)`);
        }

        return result;
    }
}
