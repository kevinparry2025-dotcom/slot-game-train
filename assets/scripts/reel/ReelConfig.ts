import { SpriteFrame } from "cc";

/**
 * Cấu hình cho từng loại game
 */
export interface ReelConfig {
    // Số lượng reels (cột)
    reelCount: number;

    // Số lượng symbols hiển thị trên mỗi reel
    visibleSymbolCount: number;

    // Tổng số symbols trong reel pool (để tạo infinite scroll)
    totalSymbolCount: number;

    // Chiều cao của mỗi symbol (px)
    symbolHeight: number;

    // Tốc độ quay tối đa (px/s)
    targetSpeed: number;

    // Tốc độ tăng tốc (px/s²)
    accelerationRate: number;

    // Tốc độ giảm tốc (px/s²)
    decelerationRate: number;

    // Thời gian delay giữa các reel khi dừng (s)
    stopDelay: number;

    // Sprite frames cho symbols
    symbolSpriteFrames?: SpriteFrame[];
}

/**
 * Cấu hình mặc định cho game Pharaoh
 */
export const PharaohReelConfig: ReelConfig = {
    reelCount: 5,
    visibleSymbolCount: 3,
    totalSymbolCount: 10,
    symbolHeight: 95,
    targetSpeed: 2000,
    accelerationRate: 1000,
    decelerationRate: 4000,
    stopDelay: 0.3,
};

/**
 * Cấu hình cho game Dragon
 */
export const DragonReelConfig: ReelConfig = {
    reelCount: 5,
    visibleSymbolCount: 3,
    totalSymbolCount: 10,
    symbolHeight: 90,
    targetSpeed: 1200,
    accelerationRate: 1500,
    decelerationRate: 5000,
    stopDelay: 0.25,
};

/**
 * Cấu hình cho game Fruits
 */
export const FruitsReelConfig: ReelConfig = {
    reelCount: 5,
    visibleSymbolCount: 3,
    totalSymbolCount: 10,
    symbolHeight: 120,
    targetSpeed: 800,
    accelerationRate: 800,
    decelerationRate: 3000,
    stopDelay: 0.35,
};
