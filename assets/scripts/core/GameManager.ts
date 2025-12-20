import { _decorator, Component, director, game, Node } from 'cc';
const { ccclass } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private static _instance: GameManager = null!;

    private currentGameType: string = '';


    private playerBalance: number = 1000;

    public static get instance(): GameManager {
        if (!this._instance) {

            const node = new Node('GameManager');
            this._instance = node.addComponent(GameManager);
            game.addPersistRootNode(node);
        }
        return this._instance;
    }

    onLoad() {

        if (GameManager._instance && GameManager._instance !== this) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;
        game.addPersistRootNode(this.node);
    }


    public setCurrentGame(gameType: string) {
        this.currentGameType = gameType;
        console.log(`GameManager: Current game set to ${gameType}`);
    }


    public getCurrentGame(): string {
        return this.currentGameType;
    }


    public getBalance(): number {
        return this.playerBalance;
    }

    public setBalance(amount: number) {
        this.playerBalance = amount;
    }
}