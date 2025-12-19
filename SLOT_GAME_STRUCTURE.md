# 🎰 Hướng Dẫn Xây Dựng Slot Game với Cocos Creator 3.x

## 📋 Tổng Quan

Tài liệu này hướng dẫn bạn xây dựng một slot game hoàn chỉnh từ đầu, được chia thành 4 phần chính:

1. **Part 1**: Core Reel Mechanic - Cơ chế quay cơ bản
2. **Part 2**: Menus, Popups & Scene Flow - Giao diện và luồng chuyển cảnh
3. **Part 3**: Audio, Particles & Polish - Âm thanh và hiệu ứng đặc biệt
4. **Part 4**: Architecture & Optimization - Kiến trúc và tối ưu hóa

---

## 🏗️ Cấu Trúc Thư Mục Chuẩn

```
slot-game-train/
│
├── assets/
│   ├── scenes/                      # Các scene
│   │   ├── GameScene.scene          # Scene chính (chơi game)
│   │   ├── LobbyScene.scene         # Scene lobby (menu chính)
│   │   └── LoadingScene.scene       # Scene loading
│   │
│   ├── scripts/                     # Code TypeScript
│   │   ├── core/                    # Core systems
│   │   │   ├── GameManager.ts       # Quản lý game global
│   │   │   ├── AudioManager.ts      # Quản lý âm thanh
│   │   │   └── DataManager.ts       # Quản lý dữ liệu/local storage
│   │   │
│   │   ├── reel/                    # Reel mechanics
│   │   │   ├── ReelController.ts    # Điều khiển cuộn quay
│   │   │   ├── ReelGroup.ts         # Nhóm các reel
│   │   │   ├── Reel.ts              # Một reel đơn
│   │   │   ├── SymbolContainer.ts   # Container chứa symbols
│   │   │   └── Symbol.ts            # Symbol đơn lẻ
│   │   │
│   │   ├── ui/                      # UI components
│   │   │   ├── PopupManager.ts      # Quản lý popup (stack system)
│   │   │   ├── PopupBase.ts         # Base class cho popup
│   │   │   ├── SettingsPopup.ts     # Popup cài đặt
│   │   │   ├── WinPopup.ts          # Popup thắng
│   │   │   └── BlockInputEvents.ts  # Component chặn input
│   │   │
│   │   ├── game/                    # Game logic
│   │   │   ├── SlotMachine.ts       # State machine cho slot
│   │   │   ├── BetController.ts     # Quản lý đặt cược
│   │   │   ├── WinCalculator.ts     # Tính toán thắng
│   │   │   └── ResultMatrix.ts      # Ma trận kết quả
│   │   │
│   │   ├── effects/                 # Visual effects
│   │   │   ├── ParticleManager.ts   # Quản lý particles
│   │   │   ├── WinLineDrawer.ts     # Vẽ đường thắng
│   │   │   └── SymbolAnimator.ts    # Animation cho symbols
│   │   │
│   │   └── utils/                   # Utilities
│   │       ├── StateManager.ts      # Base state machine
│   │       ├── ObjectPool.ts        # Object pooling
│   │       └── Constants.ts         # Hằng số
│   │
│   ├── prefabs/                     # Prefabs
│   │   ├── ui/
│   │   │   ├── SettingsPopup.prefab
│   │   │   ├── WinPopup.prefab
│   │   │   └── ToastMessage.prefab
│   │   │
│   │   ├── symbols/                 # Symbol prefabs
│   │   │   ├── Cherry.prefab
│   │   │   ├── Wild.prefab
│   │   │   └── Scatter.prefab
│   │   │
│   │   └── effects/
│   │       ├── CoinExplosion.prefab
│   │       └── WinLine.prefab
│   │
│   ├── resources/                   # Resources (load động)
│   │   └── bundles/
│   │       ├── Slot_Pharaoh/        # Bundle cho slot Pharaoh
│   │       │   ├── textures/
│   │       │   ├── sounds/
│   │       │   └── prefabs/
│   │       └── Slot_Fruit/          # Bundle cho slot Fruit
│   │
│   ├── textures/                    # Hình ảnh
│   │   ├── symbols/                 # Symbols
│   │   ├── ui/                      # UI elements
│   │   └── backgrounds/             # Background images
│   │
│   ├── audio/                       # Âm thanh
│   │   ├── bgm/                     # Background music
│   │   ├── sfx/                     # Sound effects
│   │   └── voice/                   # Voice overs
│   │
│   └── animations/                  # Spine animations
│       ├── characters/
│       └── symbols/
│
├── build/                           # Build output
└── settings/                        # Project settings
```

---

## 🎯 PART 1: Core Reel Mechanic

### 🔑 Khái Niệm Chính

#### 1. **Hierarchy Strategy** (Chiến lược phân cấp)

```
Machine (SlotMachine.ts)
  └── ReelGroup (ReelGroup.ts)
        └── Reel (Reel.ts) x 3 hoặc 5
              └── SymbolContainer (SymbolContainer.ts)
                    └── Symbol (Symbol.ts) x nhiều
```

> [!IMPORTANT]
> **Mask Component**: Quan trọng! Sử dụng Mask component để ẩn symbols khi chúng cuộn ra ngoài màn hình.

#### 2. **Infinite Scroll Logic** (Cuộn vô hạn)

**Nguyên lý**: Làm sao để 5 symbols trông như một cuộn dài vô tận?

```typescript
// Pseudo-code
if (symbol.position.y < -100) {  // Nếu symbol đi xuống dưới threshold
    symbol.position.y += 500;     // Di chuyển lên trên
    symbol.texture = getNewTexture(); // Đổi texture
}
```

**Code thực tế**:
```typescript
node.position.y -= speed * dt;
```

#### 3. **State Machine** (Máy trạng thái)

Slot game là một **State Machine** nghiêm ngặt:

```
IDLE → SPINNING_ACCEL → SPINNING_CONST → STOPPING → RESULT
```

> [!NOTE]
> State machine giúp kiểm soát chặt chẽ tốc độ reel và tránh lỗi logic.

#### 4. **Easing & Bounce** (Hiệu ứng giật)

Reel không nên dừng ngay lập tức - cần có "mechanical feel" (cảm giác cơ khí):

```typescript
tween(node)
    .to(duration, { position: targetPos }, { easing: 'backOut' })
    .start();
```

> [!TIP]
> Hệ thống Tween là 50% của lập trình slot! Học thuộc các easing functions.

#### 5. **Symbol Configuration** (Cấu hình symbols)

**Data-driven design**: Tạo file config JSON hoặc class TypeScript:

```typescript
const SYMBOL_CONFIG = [
    { id: 0, name: "Cherry", spriteFrame: "cherry_frame" },
    { id: 1, name: "7", spriteFrame: "seven_frame" },
    { id: 2, name: "Wild", spriteFrame: "wild_frame" }
];
```

Map ID → SpriteFrames để dễ quản lý.

#### 6. **Result Matrix** (Ma trận kết quả)

**Tách biệt View và Data**:

- Server/Logic gửi: `[1, 3, 4]` (kết quả đích)
- Reel quay **vô thời hạn** cho đến khi nhận mảng này
- Sau đó dừng tại đúng symbols

```typescript
const targetResult = [1, 3, 4]; // Từ server
reels.forEach((reel, index) => {
    reel.stopAtSymbol(targetResult[index]);
});
```

#### 7. **Motion Blur** (Làm mờ chuyển động)

Khi reel quay nhanh:
- Swap sprite "Symbol" sắc nét → sprite "Symbol_Blurred"
- Swap lại khi giảm tốc

> [!TIP]
> Hiệu ứng này làm cho game trở nên mượt mà và chuyên nghiệp (60fps feel).

---

## 🎨 PART 2: Menus, Popups & Scene Flow

### 🔑 Khái Niệm Chính

#### 1. **UI Architecture** (Stack System)

**Vấn đề**: Không nên bật/tắt tất cả popups với `active = true/false`.

**Giải pháp**: Sử dụng `PopupManager` với **Stack of Popups**.

```typescript
class PopupManager {
    private stack: PopupBase[] = [];
    
    show(popupPrefab: Prefab) {
        // 1. Load prefab
        // 2. Play "Open" animation
        // 3. Push to stack
        // 4. Darken background
    }
    
    hide() {
        // Pop from stack
    }
}
```

#### 2. **BlockInputEvents** (Chặn input)

**Vấn đề**: Khi popup Settings mở, user vẫn click được nút "Spin" phía sau.

**Giải pháp**: Component `BlockInputEvents`:
- Tạo Scrim (background bán trong suốt đen)
- Đảm bảo Scrim luôn ở **phía sau** popup topmost
- Nhưng **phía trước** game

```
Z-order: Game → Scrim → Popup
```

#### 3. **Main Menu (Lobby Scene)**

**Scene Management**:

```typescript
// LobbyScene components:
// - "Play" button → transitions to GameScene
// - "Quit" button
// - PersistRootNode → node tồn tại qua scene transitions
```

**Use Case**: Background music không bị cắt khi đổi scene.

#### 4. **Scene Transitions** (Loading Screens)

**Async Loading**:

```typescript
director.preloadScene('GameScene', (progress) => {
    // Update progress bar: 0% → 100%
});
```

> [!NOTE]
> Games thường "freeze" main thread khi initialize. Transition scene che giấu điều này.

#### 5. **Pause Logic** (TimeScale)

**Cách 1 (SAI)**: `director.pause()` → Dừng MỌI THỨ, kể cả animation của Pause Menu!

**Cách 2 (ĐÚNG)**: Global flag

```typescript
class GameManager {
    isPaused: boolean = false;
}

// Trong reel update loop:
if (GameManager.isPaused) return;
```

#### 6. **Paytable** (ScrollViews)

Slot games có màn hình "How to Play" khổng lồ.

**Components cần dùng**:
- `ScrollView`
- `Mask`
- `Layout` (auto-arrange)

**Challenge**: Tạo Paytable động dựa trên bet amount:
- "5x Cherries pays $50" → Nếu bet tăng gấp đôi → "$100"

```typescript
updatePaytable(betAmount: number) {
    this.cherryWin.string = `${betAmount * 10}`;
}
```

#### 7. **Toast Messages**

Non-blocking feedback (như Android Toasts):
- "Not enough coins!"
- "Connected to Server"

**Implementation**: Object pool of Labels với tween:
- Fade in
- Float up
- Fade out

#### 8. **Tweening UI**

UI phải sống động:

```typescript
// Button Press
tween(button)
    .to(0.1, { scale: new Vec3(0.9, 0.9, 1) }, { easing: 'backOut' })
    .to(0.1, { scale: new Vec3(1, 1, 1) })
    .start();

// Popup Open
tween(popup)
    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
    .start();
```

#### 9. **Settings & Local Storage**

Lưu preferences:

```typescript
sys.localStorage.setItem('musicVolume', '0.5');
sys.localStorage.setItem('sfxEnabled', 'true');
```

Connect UI Slider → `AudioManager`.

---

## 🎵 PART 3: Audio, Particles & Polish

### 🔑 Khái Niệm Chính

#### 1. **AudioManager (Layers)**

Slot audio phức tạp - cần **parallel tracks**:

```typescript
class AudioManager {
    playBGM(clip: AudioClip, loop: boolean) { }
    playSFX(clip: AudioClip) { }
    playVoice(clip: AudioClip) { }
}
```

**Channels**:
- **BGM**: Background music (loop)
- **SFX**: Spin button, Reel Stop, Win jingle
- **Voice**: "Big Win!"

> [!IMPORTANT]
> "Reel Stop" sound phải trigger CHÍNH XÁC khi reel bounce tween kết thúc.

#### 2. **Audio Dynamics** (Pitch & Urgency)

**Anticipation** (Tạo hồi hộp):

Nếu player đang chờ symbol Scatter thứ 3:
- Loop "tension" sound
- Tăng tốc reel cuối
- Pitch lên cao

```typescript
if (scatterCount === 2) {
    audioManager.playSFX('tension_loop');
    lastReel.speedMultiplier = 1.5;
}
```

#### 3. **Particle Systems**

**Built-in Cocos Particle Editor**:

Tạo hiệu ứng "Coin Explosion" khi thắng:
- Manipulate: `Gravity`, `EmissionRate`, `LifeTime`
- Trigger chỉ khi Win state

```typescript
if (isWin) {
    this.coinParticle.resetSystem();
}
```

#### 4. **Spine/DragonBones Animations**

Slots hiện đại không dùng sprites tĩnh cho symbols giá trị cao:

**Skeletal Animation**:

```typescript
this.characterSpine.setAnimation(0, 'win_loop', true);
```

> [!NOTE]
> Dừng animation khi reel đang quay để tiết kiệm CPU!

```typescript
if (reelSpeed > threshold) {
    spine.paused = true;
}
```

#### 5. **Line Logic & Visual Connectors**

**Showing Win Lines**:

Sử dụng `Graphics` API (Cocos drawing) hoặc prefab borders:

```typescript
const graphics = this.getComponent(Graphics);
graphics.moveTo(symbolA.x, symbolA.y);
graphics.lineTo(symbolB.x, symbolB.y);
graphics.stroke();
```

Alternatively: Instantiate prefab borders quanh winning symbols.

#### 6. **Win Rollup** (Number Ticking)

**Psychological reward**:

Đếm từ 0 → Won Amount với animation:

```typescript
let currentScore = 0;
const targetScore = 1000;

tween({ value: 0 })
    .to(2, { value: targetScore }, {
        onUpdate: (obj) => {
            this.scoreLabel.string = Math.floor(obj.value).toString();
        }
    })
    .start();
```

Hook "ticking" sound.

#### 7. **User Interaction & Auto-Spin**

**Mini State Machine trong UI**:

```
IDLE → PRESSED → AUTO_MODE
```

**Auto-Spin logic**:
- Button "Hold to Auto-Spin"
- Requires state: `isIdle`, `isPressed`, `isAutoMode`

```typescript
onButtonPress() {
    this.state = 'PRESSED';
}

update(dt) {
    if (this.state === 'AUTO_MODE' && slotMachine.state === 'IDLE') {
        slotMachine.startSpin();
    }
}
```

---

## ⚙️ PART 4: Architecture, Bundles & Optimization

### 🔑 Khái Niệm Chính

#### 1. **Asset Bundles** (Critical!)

**Scenario**: Casino app có 50 slot games khác nhau

**Problem**: Không thể load tất cả assets lúc khởi động!

**Solution**: Move assets vào Bundle:

```
resources/bundles/Slot_Pharaoh/
    ├── textures/
    ├── sounds/
    └── prefabs/
```

**Code**:

```typescript
assetManager.loadBundle('Slot_Pharaoh', (err, bundle) => {
    bundle.load('textures/symbol_anubis', SpriteFrame, (err, spriteFrame) => {
        // Use sprite
    });
});
```

Chỉ load bundle khi user chọn game từ lobby!

#### 2. **Texture Atlases & Batching**

**Problem**: 5 reels x 3 rows = 15 symbols. Nếu mỗi symbol là ảnh riêng → 15 draw calls!

**Solution**: Use Auto Atlas

**Task**: Pack tất cả symbols vào một sheet. Ensure `DrawCall` trong profiler giảm về ~1.

> [!TIP]
> Cocos Creator tự động batch nếu bạn dùng cùng Texture Atlas và Material.

#### 3. **Object Pooling**

**Context**: Particle effects (coins) và symbols scroll off-screen

**Task**: Đừng `destroy()` symbol khi nó cuộn ra ngoài → **recycle** nó!

```typescript
class CoinPool {
    private pool: Node[] = [];
    
    get(): Node {
        return this.pool.pop() || instantiate(this.coinPrefab);
    }
    
    recycle(node: Node) {
        this.pool.push(node);
    }
}
```

#### 4. **Server Integration**

**Concept**: Client là "Puppet" (con rối)

**Flow**:
1. Button Click → Send Request: `{ bet: 500 }`
2. Wait for Response: `{ result: [1, 1, 1], winAmount: 500 }`
3. Start Visual Spin → Stop at Result

> [!CAUTION]
> **ĐỪNG** bắt đầu quay cho đến khi bạn biết kết quả! (Hoặc dùng "dummy spin" trong khi chờ)

**Mock Response**:

```typescript
mockServerResponse(): { result: number[], winAmount: number } {
    return {
        result: [1, 1, 1],
        winAmount: 500
    };
}
```

#### 5. **Network Latency Handling**

**Task**: Server mất 5 giây để trả lời?

**Implementation**: Tạo "Infinite Spin" state:
- Reels quay animation liên tục
- Khi data về → transition to "Stop Sequence"

```typescript
if (!this.hasResult) {
    // Keep spinning infinitely
} else {
    this.transitionToStop();
}
```

#### 6. **Mobile Optimization**

**Battery & Heat**:

```typescript
game.frameRate = 30; // or 60
```

**Logic**:
- Nếu user idle 10 giây → drop về 30 FPS
- Wake up về 60 FPS on touch

#### 7. **Shaders for "Big Win"**

**Task**: Làm winning symbols phát sáng/flash

```glsl
// UV sliding effect
uniform vec2 offset;
```

Apply custom "Shine" shader (UV sliding effect) chỉ khi win.

#### 8. **Platform Deployment**

**Task**: 
- Handle Device Orientation (Force Landscape)
- Handle Safe Areas (iPhone notch)

```typescript
// Đảm bảo home bar không overlap nút Spin
```

#### 9. **Final Architecture Checklist**

> [!IMPORTANT]
> Trước khi release:

- ✅ Assets unload khi quay về lobby?
- ✅ Logic (Math) tách biệt khỏi View (Nodes)?
- ✅ Memory usage ổn định sau 100 auto-spins?
- ✅ Data transfer cho lần load đầu tiên (web) bao nhiêu?

---

## 🎓 Lộ Trình Học Tập Cho Người Mới

### Week 1-2: Foundations
- [ ] Học Cocos Creator UI cơ bản
- [ ] Tạo project đầu tiên
- [ ] Implement Part 1: Core Reel (3 reels đơn giản)

### Week 3: UI & Flow
- [ ] Implement Part 2: PopupManager
- [ ] Tạo Settings popup
- [ ] Scene transitions

### Week 4: Polish
- [ ] Implement Part 3: AudioManager
- [ ] Add particle effects
- [ ] Win animations

### Week 5-6: Production Ready
- [ ] Implement Part 4: Asset Bundles
- [ ] Object pooling
- [ ] Performance optimization
- [ ] Mock server integration

---

## 📚 Tài Liệu Tham Khảo

### Cocos Creator Docs
- [Tween System](https://docs.cocos.com/creator/3.x/manual/en/tween/)
- [Asset Bundle](https://docs.cocos.com/creator/3.x/manual/en/asset/bundle.html)
- [Audio System](https://docs.cocos.com/creator/3.x/manual/en/audio-system/)
- [Particle System](https://docs.cocos.com/creator/3.x/manual/en/particle-system/)

### Best Practices
- Luôn sử dụng Object Pooling cho objects tái sử dụng
- Tách biệt Data và View
- Implement State Machine cho game logic
- Use Asset Bundles cho scalability

---

## ⚠️ Common Pitfalls (Lỗi Thường Gặp)

> [!WARNING]
> **Đừng**:
> - Dùng `director.pause()` cho Pause Menu
> - Load tất cả assets vào memory cùng lúc
> - Bắt đầu spin trước khi có kết quả từ server
> - Quên implement Object Pooling
> - Hardcode symbol values thay vì dùng config

> [!TIP]
> **Nên**:
> - Dùng global flag `isPaused`
> - Load assets theo bundles
> - Implement "infinite spin" state
> - Recycle nodes thay vì destroy
> - Data-driven design với JSON/TypeScript config

---

## 🎯 Checklist Hoàn Thành

### Part 1: Core Reel ✓
- [ ] Hierarchy: Machine → ReelGroup → Reel → Symbol
- [ ] Infinite scroll logic
- [ ] State machine (IDLE → SPIN → STOP → RESULT)
- [ ] Tween với easing 'backOut'
- [ ] Symbol configuration (JSON/Class)
- [ ] Result matrix từ server
- [ ] Motion blur khi quay nhanh

### Part 2: UI & Flow ✓
- [ ] PopupManager (Stack system)
- [ ] BlockInputEvents component
- [ ] LobbyScene & GameScene
- [ ] Loading screen với progress bar
- [ ] Pause logic (global flag)
- [ ] ScrollView cho Paytable
- [ ] Toast messages
- [ ] Tween UI animations
- [ ] Settings & LocalStorage

### Part 3: Audio & Effects ✓
- [ ] AudioManager (BGM, SFX, Voice channels)
- [ ] Audio dynamics (pitch, urgency)
- [ ] Particle systems (coin explosion)
- [ ] Spine/DragonBones animations
- [ ] Win line drawing (Graphics API)
- [ ] Win rollup (number ticking)
- [ ] Auto-spin state machine

### Part 4: Production ✓
- [ ] Asset Bundles setup
- [ ] Texture Atlases (reduce draw calls)
- [ ] Object Pooling
- [ ] Server integration (mock)
- [ ] Network latency handling
- [ ] Mobile optimization (frame rate)
- [ ] Shaders cho "Big Win"
- [ ] Platform deployment (orientation, safe areas)

---

> [!NOTE]
> **Ghi chú cuối cùng**: Slot game development là sự kết hợp giữa **Math**, **Animation**, và **State Management**. Hãy từng bước xây dựng từ core mechanic đơn giản, sau đó thêm polish và optimization.

**Good luck! 🍀**

