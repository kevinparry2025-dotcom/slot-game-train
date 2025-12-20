import { _decorator, Component, Sprite, Label, director, UIOpacity, tween } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('LoadingManager')
export class LoadingManager extends Component {

    @property(Sprite)
    fadeOverlay: Sprite = null!;

    @property(Sprite)
    progressBarFill: Sprite = null!;

    @property(Label)
    loadingText: Label = null!;

    private currentProgress: number = 0;
    private targetProgress: number = 0;

    start() {

        this.startLoading();
    }

    update(deltaTime: number) {
        // Smooth progress animation
        if (this.currentProgress < this.targetProgress) {
            this.currentProgress += deltaTime * 0.5;

            if (this.currentProgress > this.targetProgress) {
                this.currentProgress = this.targetProgress;
            }

            this.updateProgressBar(this.currentProgress);
        }
    }

    private startLoading() {
        console.log('Loading started...');

        this.simulateLoading();
    }


    private simulateLoading() {
        let progress = 0;

        const interval = setInterval(() => {
            progress += 10;
            this.targetProgress = progress / 100;

            if (progress == 100) {
                clearInterval(interval);

                this.scheduleOnce(() => {
                    console.log('Loading complete! Going to Lobby...');
                    this.loadSceneWithFade('LobbyScene');
                }, 0.5);
            }
        }, 200);
    }

    /**
     * Update progress bar UI
     */
    private updateProgressBar(progress: number) {
        // Update fill amount (0 -> 1)
        if (this.progressBarFill) {
            this.progressBarFill.fillRange = progress;
        }

        // Update text
        if (this.loadingText) {
            const percent = Math.floor(progress * 100);
            this.loadingText.string = `Loading... ${percent}%`;
        }
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