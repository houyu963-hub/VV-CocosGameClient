import { Component, Enum, Label, _decorator } from "cc";
import vv from "../Core";

export enum TIMERTYPE {
    NUMBER, // 数字模式
    CLOCK,  // 时钟模式
}

const { ccclass, menu, property, requireComponent } = _decorator;
@ccclass
@requireComponent(Label)
@menu('Custom/Timer')
export default class Timer extends Component {
    @property({ type: Enum(TIMERTYPE) }) type = TIMERTYPE.NUMBER;

    private _finishCb: Function = null;
    private _timeCb: Function = null;
    private _time: number = 0;
    private _timeformat: number = 0;
    private _hideSeconds: boolean;

    private _lab: Label = null;

    protected onDisable(): void {
        this.stopTimer();
    }

    /**
     * @param time 总的倒计时(s)
     * @param finishCb 完成回调
     * @param timeCb 每一秒回调
     * @param timeformat 时间格式 0:HH:mm:ss 1:DD:HH:mm:ss 2:1d 2h 3m 4s
     * @param dhmsTag 不显示秒
     */
    public startTimer(time: number, finishCb?: Function, timeCb?: Function, timeformat: number = 0, hideSeconds: boolean = false, tag?: string): void {
        this._timeformat = timeformat;
        this._hideSeconds = hideSeconds;
        this.stopTimer();
        this._time = time;
        this._lab = this.node.getComponent(Label);
        if (this.type === TIMERTYPE.NUMBER) {
            this._lab.string = time.toString();
        } else {
            if (timeformat) {
                this._lab.string = vv.utils.leftTimestamp2DDHHmmss(time, null, timeformat === 2, hideSeconds);
            } else {
                this._lab.string = vv.utils.leftTimestamp2HHmmss(time, tag);
            }
        }
        this._finishCb = finishCb;
        this._timeCb = timeCb;
        this._timeCb?.(this._lab.string);
        this.schedule(this.call, 1);
    }

    public stopTimer(): void {
        this.unschedule(this.call);
    }

    private call(): void {
        this._time--;
        if (this._time <= 0) {
            this.stopTimer();
            this._time = 0;
            this._timeformat = 0;
            this._hideSeconds = false;
            this._lab.string = '0';
            let cb = this._finishCb;
            this._finishCb = null;
            cb?.();
            this._timeCb = null;
        } else {
            if (this.type === TIMERTYPE.NUMBER) {
                this._lab.string = this._time.toString();
            } else {
                if (this._timeformat) {
                    this._lab.string = vv.utils.leftTimestamp2DDHHmmss(this._time, null, this._timeformat === 2, this._hideSeconds);
                } else {
                    this._lab.string = vv.utils.leftTimestamp2HHmmss(this._time);
                }
            }
        }
        this._timeCb?.(this._lab.string);
    }
}