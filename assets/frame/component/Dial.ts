import { _decorator, Component, Node, tween } from "cc";

const { ccclass, property, menu } = _decorator;
@ccclass('Dial')
@menu('Custom/Dial')
export default class Dial extends Component {
    @property({ tooltip: '目标旋转对象', type: Node }) targetNode: Node = null;
    @property({ tooltip: '扇区数量' }) cellNum: number = 6;
    @property({ tooltip: '加速转圈数' }) accAngle: number = 3;
    @property({ tooltip: '减速转圈数' }) decAngle: number = 3;
    @property({ tooltip: '加速度' }) acc: number = 1;
    @property({ tooltip: '最大旋转速度' }) maxSpeed: number = 30;
    @property({ tooltip: '顺时针旋转' }) clockwise: boolean = true;
    @property({ tooltip: '是否回弹' }) springback: boolean = true;
    // 是否在转动
    public isPlay: boolean = false;
    // 旋转结束回调
    private _onEndCallBack: Function;
    // 转动状态 1:加速  2:减速  
    private _wheelState: number = 0;
    // 当前速度 
    private _curSpeed: number = 2;
    // 当前旋转值 
    private _curRotation: number = 0;
    // 最近一格的角度 
    private _gearAngle = 360 / 6;
    // 最终旋转角度
    private _finalAngle: number;
    // 是不是在加速运动
    private _maxSpeedRun: boolean = true;
    // 减速转度数
    private _decAngle: number = 4 * 360;
    // 加速转度数
    private _accAngle: number = 4 * 360;
    // 顺时针旋转
    private _clockwise: number = -1;

    protected onDisable(): void {
        if (this.isPlay) {
            this.isPlay = false;
            this._onEndCallBack?.();
        }
        this._onEndCallBack = null;
    }

    /**
     * 开始转动
     * @param finalAngle 角度
     * @param endCallBack 结束回调
     */
    public startRun(finalAngle: number, endCallBack: () => unknown): void {
        if (this.isPlay) return;
        this.isPlay = true;
        this._decAngle = this.decAngle * 360;
        this._accAngle = this.accAngle * 360;
        this._gearAngle = 360 / this.cellNum;
        this._onEndCallBack = endCallBack;
        this._finalAngle = finalAngle + this._accAngle;
        if (this.springback) {
            this._finalAngle += this._gearAngle * this._clockwise;
        }
        this._wheelState = 1;
        this._curSpeed = 2;
        this._curRotation %= 360;
        this.targetNode.angle = this._curRotation;
        this._clockwise = this.clockwise ? -1 : 1;
        this._maxSpeedRun = true;
    }

    /**
     * 停止转动 立即应用结果
     */
    public stopRun(): void {
        if (!this.isPlay) return;
        this.isPlay = false;
        this._wheelState = 0;
        this.targetNode.angle = this._finalAngle;
        this._curRotation = this._finalAngle;
        this._onEndCallBack?.();
        this._onEndCallBack = null;
    }

    protected update(dt: number): void {
        if (this.isPlay) {
            if (this._wheelState === 1) {
                this._curRotation = this.targetNode.angle + this._curSpeed * this._clockwise;
                this.targetNode.angle = this._curRotation;
                if (this._curSpeed <= this.maxSpeed) {
                    this._curSpeed += this.acc;
                }
                else {
                    if (this._maxSpeedRun) {
                        //console.log(".....最大速度旋转2圈")
                        this._finalAngle += 360 * 1 * this._clockwise;
                        this._maxSpeedRun = false;
                    }

                    if (this._clockwise) {
                        if (this._curRotation >= this._finalAngle) {
                            return
                        }
                    } else if (this._curRotation <= this._finalAngle) {
                        return;
                    }
                    // log('....开始减速');
                    // 设置目标角度
                    this.maxSpeed = this._curSpeed;
                    this.targetNode.angle = this._finalAngle;
                    this._wheelState = 2;
                }
            }
            else if (this._wheelState === 2) {
                // log('......减速');
                let curRo = this.targetNode.angle; // 应该等于finalAngle
                let hadRo = (curRo - this._finalAngle) * this._clockwise;
                this._curSpeed = this.maxSpeed * ((this._decAngle - hadRo) / this._decAngle) + 0.2;
                this.targetNode.angle = curRo + (this._curSpeed * this._clockwise);

                if ((this._decAngle - hadRo) <= 0) {
                    // log('....中止');
                    this._wheelState = 0;
                    this.targetNode.angle = this._finalAngle;
                    this._curRotation = this._finalAngle;
                    if (this.springback) {
                        // 倒转一个齿轮
                        tween(this.targetNode)
                            .delay(0.1)
                            .by(0.5, { angle: -this._gearAngle })
                            .call(() => {
                                this.isPlay = false;
                                this._onEndCallBack?.();
                                this._onEndCallBack = null;
                            })
                            .start()
                    }
                    else {
                        this.isPlay = false;
                        this._onEndCallBack?.();
                        this._onEndCallBack = null;
                    }
                }
            }
        }
    }

}
