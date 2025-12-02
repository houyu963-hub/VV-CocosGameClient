import { _decorator, Label, Node, Tween, tween, UIOpacity } from "cc";
import ActiveSprite from "db://assets/frame/component/ActiveSprite";
import Timer from "db://assets/frame/component/Timer";
import vv from "db://assets/frame/Core";
import BaseClass from "db://assets/frame/ui/BaseClass";

const { ccclass, property } = _decorator;

@ccclass
export default class Direction extends BaseClass {
    @property({ type: Node, }) nodeDir: Node[] = [];

    dirAngle: number[] = [90, 0, -90, -180];

    // 设置座位 固定方向盘
    public setChair(chair: number) {
        this.$('_dir', ActiveSprite).index = chair - 1;
        this.nodeDir.forEach(node => node.getComponent(ActiveSprite).index = chair - 1);
    }

    // 显示骰子动画
    public showDiceAntion(dice1: number, dice2: number): void {
        if (!this.$('_dice1') || !this.$('_dice2')) return;
        this.$('_dice1').active = true;
        this.$('_dice2').active = true;
        // todo 播放spine动画显示点数
    }

    // 设置当前方向盘方向
    public setCurrent(viewID: number) {
        this.current = viewID;
    }

    // 获取剩余牌数
    private get cardCnt() {
        return parseInt(this.$('_leftCnt', Label).string);
    }

    // 设置剩余牌数
    private set cardCnt(value: number) {
        this.$('_leftCnt', Label).string = value + '';
    }

    // 设置倒计时 value: 截止时间戳ms
    public set time(data: { operation_time: number, shortTime?: number, shortTimeCallback?: (num: number) => void }) {
        this.$('_time').active = data.operation_time > 0;
        let etime = data.operation_time - vv.utils.getServerTime();
        if (etime > 0) {
            this.$('_time', Timer).startTimer(Math.round(etime.div(1000)), () => {
                this.$('_time', Label).string = '00';
            }, (current: string) => {
                let num = Number(current);
                this.$('_time', Label).string = vv.utils.padNumberWithZeros(2, num);
                if (num <= data.shortTime) {
                    data.shortTimeCallback?.(num);
                }
            })
        }
    }

    // 获取当前操作的玩家viewID
    public get current() {
        for (let i = 0; i < this.nodeDir.length; i++) {
            if (this.nodeDir[i].active) return i;
        }
    }

    // 设置当前操作的玩家
    private set current(value: number) {
        for (let i = 0; i < this.nodeDir.length; i++) {
            this.nodeDir[i].active = value === i;
            Tween.stopAllByTarget(this.nodeDir[i]);
            // 闪烁
            let opacity = this.nodeDir[i].getComponent(UIOpacity);
            if (!opacity) {
                opacity = this.nodeDir[i].addComponent(UIOpacity);
            }
            opacity.opacity = 255;
            if (value == i) {
                tween(opacity)
                    .to(1, { opacity: 0 })
                    .to(1, { opacity: 255 })
                    .union()
                    .repeatForever()
                    .start();
            }
        }
    }

    // 隐藏骰子动画
    private hideDiceAntion(): void {
        if (this.$('_dice1') && this.$('_dice2').active) {
            this.$('_dice1').active = false;
            this.$('_dice2').active = false;
        }
    }

    // 更新剩余牌数
    private onUpdateLeftCnt(data: { left: number }): void {
        this.hideDiceAntion();
        this.cardCnt = data.left;
    }

    // 重置
    public resetView(): void {
        this.setCurrent(-1);
        this.$('_time', Timer).stopTimer();
        this.$('_time', Label).string = '00';
    }
}