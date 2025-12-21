import {
    _decorator, Component, Node, Sprite, SpriteFrame,
    Prefab, instantiate, director
} from 'cc';
import { GameManager } from '../core/GameManager';
import { AssetLoader } from '../core/AssetLoader';
const { ccclass, property } = _decorator;
@ccclass('GameSceneManager')
export class GameSceneManager extends Component {
    @property(Node)
    gameContainer: Node = null!;
    @property(Sprite)
    backgroundSprite: Sprite = null!;
    private currentGameUI: Node | null = null;
    async start() {
        console.log('🎮 GameScene started');
        const gameType = GameManager.instance.getCurrentGame();
        if (!gameType) {
            console.error('❌ No game type!');
            director.loadScene('LobbyScene');
            return;
        }
        try {
            await this.loadGame(gameType);
            console.log(`✅ ${gameType} loaded!`);
        } catch (error) {
            console.error(`❌ Failed:`, error);
            director.loadScene('LobbyScene');
        }
    }
    /**
     * Load game: background + prefab
     */
    private async loadGame(gameType: string) {
        const bundleName = `game_${gameType}`;
        // Ensure bundle loaded
        if (!AssetLoader.instance.isBundleLoaded(bundleName)) {
            await AssetLoader.instance.loadBundle(bundleName);
        }
        // 1. Load background
        await this.loadBackground(bundleName, gameType);
        // 2. Load & spawn prefab
        await this.loadAndSpawnPrefab(bundleName, gameType);
    }
    /**
     * Load background image
     */
    private async loadBackground(bundleName: string, gameType: string) {
        const bgPath = `textures/backgrounds/bg-${gameType}/spriteFrame`;

        const bg = await AssetLoader.instance.loadAsset<SpriteFrame>(
            bundleName,
            bgPath,
            SpriteFrame
        );
        this.backgroundSprite.spriteFrame = bg;
        console.log('✅ Background loaded');
    }
    /**
     * Load prefab và spawn
     */
    private async loadAndSpawnPrefab(bundleName: string, gameType: string) {
        // Clear old
        this.clearGameUI();
        // Prefab name map
        const prefabMap: { [key: string]: string } = {
            'fruits': 'FruitsGameUI',
            'pharaoh': 'PharaohGameUI',
            'dragon': 'DragonGameUI'
        };
        const prefabName = prefabMap[gameType];
        const prefabPath = `prefabs/${prefabName}`;

        // Load prefab
        const prefab = await AssetLoader.instance.loadAsset<Prefab>(
            bundleName,
            prefabPath,
            Prefab
        );
        // Spawn
        const gameUI = instantiate(prefab);
        this.gameContainer.addChild(gameUI);
        this.currentGameUI = gameUI;
        console.log('✅ Prefab spawned');
        // Init SlotMachine
        // this.initSlotMachine(gameUI);
    }
    /**
     * Initialize SlotMachine component
     */
    // private initSlotMachine(gameUI: Node) {
    //     const slotMachine = gameUI.getComponent('SlotMachine');
    //     if (slotMachine && typeof slotMachine.init === 'function') {
    //         slotMachine.init();
    //         console.log('✅ SlotMachine initialized');
    //     } else {
    //         console.warn('⚠️ SlotMachine not found');
    //     }
    // }
    /**
     * Clear current UI
     */
    private clearGameUI() {
        if (this.currentGameUI) {
            this.currentGameUI.destroy();
            this.currentGameUI = null;
        }
    }
    /**
     * Back to lobby
     */
    public backToLobby() {
        this.clearGameUI();
        const currentGame = GameManager.instance.getCurrentGame();
        if (currentGame) {
            AssetLoader.instance.releaseBundle(`game_${currentGame}`);
        }
        director.loadScene('LobbyScene');
    }
}