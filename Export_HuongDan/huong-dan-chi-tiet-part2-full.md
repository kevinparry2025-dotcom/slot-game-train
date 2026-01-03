# Hướng Dẫn Part 2: All-in-One (Phiên Bản V14 - Hình Ảnh Minhh Họa Chi Tiết)

Đây là tài liệu hướng dẫn **TRỌN VẸN 100%**. Module 2.1 đã được cập nhật hình ảnh minh họa thực tế dễ hình dung nhất.

---

## 🛠 MODULE 1: Popup System (Core UI)

Mục tiêu: Tạo hệ thống quản lý popup "Mẹ", chuyên quản lý các popup "Con" và chặn click xuyên thấu.

### Bước 1: Code Core (Setup Script)

**1. File `assets/scripts/ui/PopupBase.ts`**:
```typescript
import { _decorator, Component, Node, Prefab, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PopupBase')
export class PopupBase extends Component {
    @property(Node) container: Node = null!;
    
    show() {
        this.node.active = true;
        this.container.setScale(Vec3.ZERO);
        tween(this.container).to(0.3, { scale: Vec3.ONE }, { easing: 'backOut' }).start();
    }
    
    hide() {
        tween(this.container).to(0.2, { scale: Vec3.ZERO }, { easing: 'backIn' })
            .call(() => { this.node.active = false; }).start();
    }
    
    onCloseClicked() { this.hide(); }
}
```

**2. File `assets/scripts/ui/PopupManager.ts`**:
```typescript
import { _decorator, Component, Node, Prefab, instantiate, director } from 'cc';
import { PopupBase } from './PopupBase';
const { ccclass, property } = _decorator;

@ccclass('PopupManager')
export class PopupManager extends Component {
    private static _instance: PopupManager = null;
    public static get instance() { return this._instance; }

    @property(Node) popupContainer: Node = null!;
    @property(Node) scrimNode: Node = null!;

    onLoad() {
        if (!PopupManager._instance) {
            PopupManager._instance = this;
            director.addPersistRootNode(this.node);
        } else { this.destroy(); }
    }

    show(prefab: Prefab): void {
        const node = instantiate(prefab);
        this.popupContainer.addChild(node);
        const popup = node.getComponent(PopupBase);
        this.scrimNode.active = true;
        popup.show();
    }

    hideAll() {
        this.popupContainer.destroyAllChildren();
        this.scrimNode.active = false;
    }
}
```

### Bước 2: Setup Editor (Hierarchy & Inspector)

**1. Cấu trúc Cây Thư Mục (Hierarchy)**
![Hierarchy](./images/cocos_hierarchy_popup_1767148612576.png)
*   Tạo Node `PopupManager`. Add script `PopupManager`.
*   Tạo Node con `Scrim` (Sprite đen, Opacity 150).
    *   Add Component `BlockInputEvents`.
    *   Add Component `Widget` (Top/Bottom/Left/Right = 0px).
*   Tạo Node con `PopupContainer` (Node rỗng).

**2. Gán Script (Inspector)**
![Inspector](./images/cocos_inspector_popup_1767148629432.png)
*   Kéo `Scrim` và `PopupContainer` vào ô tương ứng trong script `PopupManager`.

---

## 🎨 MODULE 2.1: UI/UX Design & Hình Ảnh Minh Họa

Dưới đây là hình ảnh thực tế để bạn dễ hình dung về giao diện Settings Popup và cấu trúc Slider.

**1. Giao Diện Settings Popup Hoàn Chỉnh:**
Hãy tạo giao diện trong Editor giống như hình này. Nền tối, chữ Vàng, Nút đỏ.

![Settings Popup Final Design](./images/cocos_settings_popup_design_1767282968518.png)

**2. Cấu Trúc Thanh Trượt (Slider):**
Để làm Slider đẹp, bạn cần tách lớp (Layer) như sơ đồ kỹ thuật dưới đây.
*   **Background**: Lớp dưới cùng (Màu xám).
*   **ProgressBar**: Lớp giữa (Màu xanh).
*   **Handle**: Cục nắm tròn ở trên cùng.

![Slider Structure Technical](./images/cocos_slider_structure_diagram_1767282990233.png)

---

## ⚙️ MODULE 2: Hướng Dẫn Kéo Thả Tạo Prefab (Settings Popup)

**Mục tiêu**: Làm theo sơ đồ trên để tạo Prefab.

### Bước 1: Tạo Bộ Khung Node (Trong Scene)
Làm trực tiếp trên **Hierarchy**:

1.  **Tạo Nút Gốc (Root)**:
    *   Chuột phải vào `Canvas` -> Create Empty Node.
    *   Đổi tên thành `SettingsPopup`.
    *   Add Script `SettingsPopup` (hoặc `PopupBase`).

2.  **Tạo Container & Nội Dung**:
    *   Trong `SettingsPopup`, tạo con `Container`. Add `BlockInputEvents`.
    *   Trong `Container`, tạo con `Background` (Sprite Sliced).
    *   Trong `Container`, tạo con `TitleLabel` (Label + Outline + Shadow).
    *   Trong `Container`, tạo con `CloseButton` (Button).
    *   Trong `Container`, tạo con `VolumeSlider` (Slider). 
        *   **Lưu ý**: Chỉnh sửa Slider con (Handle, Background, ProgressBar) giống hệt hình ảnh Module 2.1 ở trên.

### Bước 2: Liên Kết Script (Kéo Thả)
1.  Chọn `SettingsPopup` (Root).
2.  Kéo `Container` vào ô Container.
3.  Kéo `VolumeSlider` UI vào ô Volume Slider.

### Bước 3: Đóng Gói
1.  Kéo `SettingsPopup` xuống Assets -> Prefab.
2.  Xóa trên Scene.

---

## 🎮 MODULE 2.5: Code Logic Chi Tiết Cho Từng Popup

**1. Settings Popup (File: `SettingsPopup.ts`)**
```typescript
import { _decorator, Slider, sys } from 'cc';
import { PopupBase } from './PopupBase';
const { ccclass, property } = _decorator;

@ccclass('SettingsPopup')
export class SettingsPopup extends PopupBase {
    @property(Slider) volumeSlider: Slider = null!;

    start() {
        const savedVol = sys.localStorage.getItem('volume');
        if (savedVol) {
            this.volumeSlider.progress = parseFloat(savedVol);
        }
    }

    // Gán hàm này vào Event 'Slide' của Slider trong Editor
    onSliderChanged(slider: Slider) {
        sys.localStorage.setItem('volume', slider.progress.toString());
        // AudioManager.instance.setVolume(slider.progress);
    }
}
```

**2. Pause Popup (File: `PausePopup.ts`)**
```typescript
import { _decorator, director } from 'cc';
import { PopupBase } from './PopupBase';
import { GameManager } from '../game/GameManager';
const { ccclass } = _decorator;

@ccclass('PausePopup')
export class PausePopup extends PopupBase {
    onEnable() {
        GameManager.isPaused = true;
    }

    onResumeClicked() { // Gán vào nút Resume
        GameManager.isPaused = false;
        this.hide();
    }
    
    onQuitClicked() { // Gán vào nút Quit
        GameManager.isPaused = false;
        director.loadScene("LobbyScene");
    }
}
```

---

## 🏠 MODULE 3: Lobby & Scenes

Setup Lobby Scene như hình:
![Lobby Structure](./images/cocos_lobby_structure_1767149241080.png)

Code `Assets/scripts/scenes/LobbyManager.ts`:
```typescript
import { _decorator, Component, Prefab, director } from 'cc';
import { PopupManager } from '../ui/PopupManager';
const { ccclass, property } = _decorator;

@ccclass('LobbyManager')
export class LobbyManager extends Component {
    @property(Prefab) settingsPrefab: Prefab = null!; 
    
    onPlayClicked() {
        director.loadScene('LoadingScene');
    }
    
    onSettingsClicked() {
        PopupManager.instance.show(this.settingsPrefab);
    }
}
```

---

## ⏳ MODULE 4: Loading Screen

Setup Loading Scene như hình:
![Loading Structure](./images/cocos_loading_structure_1767149258076.png)

Code `Assets/scripts/scenes/LoadingManager.ts`:
```typescript
import { _decorator, Component, director, ProgressBar, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingManager')
export class LoadingManager extends Component {
    @property(ProgressBar) bar: ProgressBar = null!;
    @property(Label) lbl: Label = null!;

    start() {
        director.preloadScene('GameScene', (completed, total) => {
            const p = completed / total;
            this.bar.progress = p;
            this.lbl.string = Math.floor(p * 100) + '%';
        }, () => {
            director.loadScene('GameScene');
        });
    }
}
```

---

## 🍞 MODULE 5: Toast & Juice

Setup Toast Prefab:
![Toast Prefab](./images/cocos_toast_prefab_1767149277568.png)

Code `Assets/scripts/ui/ToastManager.ts`:
```typescript
import { _decorator, Component, Node, Label, Prefab, instantiate, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ToastManager')
export class ToastManager extends Component {
    public static instance: ToastManager;
    @property(Prefab) toastPrefab: Prefab = null!;
    @property(Node) container: Node = null!;

    onLoad() { ToastManager.instance = this; }

    show(msg: string) {
        const node = instantiate(this.toastPrefab);
        node.getComponentInChildren(Label).string = msg;
        this.container.addChild(node);
        node.setScale(Vec3.ZERO);
        
        tween(node).to(0.2, { scale: Vec3.ONE }, { easing: 'backOut' })
            .delay(1.5)
            .by(0.3, { position: new Vec3(0, 50, 0) }) 
            .call(() => node.destroy())
            .start();
    }
}
```

Code `Assets/scripts/ui/ButtonScale.ts` (Juice):
```typescript
import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass } = _decorator;

@ccclass('ButtonScale')
export class ButtonScale extends Component {
    start() {
        this.node.on(Node.EventType.TOUCH_START, () => {
            tween(this.node).to(0.1, { scale: new Vec3(0.9, 0.9, 1) }).start();
        });
        this.node.on(Node.EventType.TOUCH_END, () => {
            tween(this.node).to(0.1, { scale: Vec3.ONE }).start();
        });
    }
}
```

---

## 📜 MODULE 6: Paytable (ScrollView)

Setup ScrollView Structure chính xác như hình:
![Paytable Structure](./images/cocos_paytable_structure_1767149294027.png)

1.  Tạo **ScrollView**.
2.  Add component **Layout** vào Node `content`.
    *   Type: VERTICAL.
    *   Resize Mode: CONTAINER.
3.  Thêm các text/ảnh con vào `content`.
