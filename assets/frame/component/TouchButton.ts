import { Component, EventHandler, Node, Tween, _decorator, math, tween, v3 } from "cc";

/**
 * 长按按钮
 */
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/TouchButton')
export default class TouchButton extends Component {
    @property({ tooltip: '触发长按的时间' }) timeAuto: number = 2;
    @property({ tooltip: '点击回调函数', type: EventHandler }) normalCallback: EventHandler = new EventHandler();
    @property({ tooltip: '长按回调函数', type: EventHandler }) longTimeCallback: EventHandler = new EventHandler();
    @property({ tooltip: '触摸结束', type: EventHandler }) touchEnd: EventHandler = new EventHandler();
    // 是否触发了长按
    private isTrigger: boolean = false
    private SCALE: Readonly<math.Vec3> = v3(0, 0, 0);

    protected onLoad(): void {
        this.SCALE = this.node.getScale();
    }

    protected onEnable(): void {
        this.addEvt();
    }

    protected onDisable(): void {
        this.closeEvt();
        Tween.stopAllByTarget(this.node);
        this.node.setScale(this.SCALE);
    }

    private addEvt(): void {
        this.closeEvt();
        this.node.on(Node.EventType.TOUCH_START, this.onBeginTapped, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onEndTapped, this);
        this.node.on(Node.EventType.TOUCH_END, this.onEndTapped, this);
    }

    private closeEvt(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onBeginTapped, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onEndTapped, this);
        this.node.off(Node.EventType.TOUCH_END, this.onEndTapped, this);
    }

    /**
     * 开始触摸
     */
    public onBeginTapped(): void {
        this.startTimer();
        Tween.stopAllByTarget(this.node);
        this.node.setScale(this.SCALE);
        tween(this.node).to(0.1, { scale: v3(this.SCALE.x * 0.9, this.SCALE.y * 0.9, 1) }).start();
    }

    /**
     * 触摸结束
     */
    public onEndTapped(): void {
        this.stopTimer();
        tween(this.node).to(0.1, { scale: this.SCALE }).start();
        if (!this.isTrigger) {
            this.toNormalCallback();
        } else {
            this.isTrigger = false;
        }
        if (this.touchEnd) {
            this.touchEnd.emit([this.touchEnd.customEventData]);
        }
    }

    /**
     * 开始计时
     */
    protected startTimer(): void {
        this.stopTimer();
        this.scheduleOnce(this.toLongTimeCallback, this.timeAuto);
    }

    /**
     * 停止计时
     */
    protected stopTimer(): void {
        this.unschedule(this.toLongTimeCallback);
    }

    /**
     * 点击回调
     */
    private toNormalCallback(): void {
        if (this.normalCallback) {
            this.normalCallback.emit([this.node]);
        }
    }

    /**
     * 长按回调
     */
    private toLongTimeCallback(): void {
        this.isTrigger = true
        if (this.longTimeCallback) {
            this.longTimeCallback.emit([this.node]);
        }
    }

}
