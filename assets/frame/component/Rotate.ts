import { CCBoolean, CCInteger, Component, Tween, _decorator, tween } from "cc";

export enum ROTATETYPE {
    LEFT,
    RIGHT,
}

const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/Rotate')
export default class Rotate extends Component {
    @property({ type: CCBoolean, tooltip: '启动时加载' }) load: boolean = false;
    @property({ type: CCInteger, tooltip: '速度' }) speed: number = 2;

    protected onEnable(): void {
        if (this.load) {
            this.startRotate();
        }
    }

    protected onDisable(): void {
        this.stopRotate();
    }

    /**
     * @param speed 速度
     * @param type 显示类型
     */
    public startRotate(speed: number = this.speed, type = ROTATETYPE.LEFT): void {
        this.stopRotate();
        this.speed = speed;
        const angle = this.node.angle;
        let rAngle: number;
        if (type === ROTATETYPE.LEFT) {
            rAngle = angle - 360;
        } else {
            rAngle = angle + 360;
        }
        tween(this.node)
            .to(this.speed, { angle: rAngle })
            .set({ angle: angle })
            .union()
            .repeatForever()
            .start()
    }

    public stopRotate(): void {
        if (this.node) {
            Tween.stopAllByTarget(this.node);
        }
    }

}