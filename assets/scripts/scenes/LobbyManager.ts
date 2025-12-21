import { _decorator, Component, Button, director, Sprite, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;
import { GameType } from '../utils/Game';
import { AssetLoader } from '../core/AssetLoader';
import { GameManager } from '../core/GameManager';

@ccclass('LobbyManager')
export class LobbyManager extends Component {

    @property(Sprite)
    fadeOverlay: Sprite = null!;

    @property(Button)
    fruitsButton: Button = null!;

    @property(Button)
    pharaohButton: Button = null!;

    @property(Button)
    dragonButton: Button = null!;

    @property(Button)
    settingsButton: Button = null!;

    start() {

        this.registerButtonEvents();
    }

    private registerButtonEvents() {
        if (this.fruitsButton) {
            this.fruitsButton.node.on(Button.EventType.CLICK, () => {
                this.onGameSelected(GameType.FRUITS);
            }, this);
        }

        if (this.pharaohButton) {
            this.pharaohButton.node.on(Button.EventType.CLICK, () => {
                this.onGameSelected(GameType.PHARAOH);
            }, this);
        }

        if (this.dragonButton) {
            this.dragonButton.node.on(Button.EventType.CLICK, () => {
                this.onGameSelected(GameType.DRAGON);
            }, this);
        }

        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, () => {
                this.onSettingsClicked();
            }, this);
        }
    }

    private async onGameSelected(gameType: GameType) {
        console.log(`🎮 Loading ${gameType} game...`);
        // Set current game
        GameManager.instance.setCurrentGame(gameType);
        // Set current game
        GameManager.instance.setCurrentGame(gameType);
        // Load bundle
        const bundleName = `game_${gameType}`;

        if (!AssetLoader.instance.isBundleLoaded(bundleName)) {
            console.log(`Loading bundle: ${bundleName}...`);
            await AssetLoader.instance.loadBundle(bundleName);
        }

        this.scheduleOnce(() => {
            console.log('Loading complete! Going to Lobby...');
            this.loadSceneWithFade('GameScene');
        }, 0.5);

    }

    private onSettingsClicked() {
        console.log('Settings clicked');
        alert('Settings popup (sẽ implement sau)');
    }

    private loadSceneWithFade(sceneName: string) {

        const uiOpacity = this.fadeOverlay.getComponent(UIOpacity);

        if (uiOpacity) {

            tween(uiOpacity)
                .to(0.5, { opacity: 255 }, { easing: 'sineOut' })
                .call(() => {

                    director.loadScene(sceneName);
                })
                .start();
        }
    }
}