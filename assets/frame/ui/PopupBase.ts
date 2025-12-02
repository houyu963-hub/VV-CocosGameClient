import { BlockInputEvents, Button, CCBoolean, Enum, EventHandler, Node, Tween, UIOpacity, UITransform, _decorator, tween, v3 } from "cc";
import ScreenFit from "db://assets/frame/adapter/ScreenFit";
import vv from "../Core";
import BaseClass from "./BaseClass";

const { ccclass, property } = _decorator;

// 状态
export enum PopupState {
    Showing,    // 正在展示
    Showed,     // 展示完毕
    Hideing,    // 正在隐藏
    Hided,      // 隐藏完毕
}

// 动画
export enum PopupOpenAni {
    None,
    Center,
    Left2Right,
    Right2Left,
    FadeIn,
}

/**
 * 弹窗基类
 */
@ccclass
export default class PopupBase<T> extends BaseClass {

    @property({ type: Node, tooltip: '背景遮罩' })
    public $blockInput: Node = null;

    @property({ type: Node, tooltip: '弹窗主体' })
    public $content: Node = null;

    @property({ type: Enum(PopupOpenAni), tooltip: '弹窗动画' })
    public $mainAni: PopupOpenAni = PopupOpenAni.Center;

    @property({ type: CCBoolean, tooltip: '是否需要关闭动画' })
    public $closeAni: boolean = true;

    @property({ tooltip: '点击背景遮罩关闭弹窗' })
    public $bgclose: boolean = true;

    /** 展示/隐藏动画的时长 */
    public animDuration: number = 0.3;

    /** 用于拦截点击的节点 */
    protected blocker: Node = null;

    /** 弹窗选项 */
    protected options: T;

    /** 弹窗状态 */
    public popupState: PopupState = PopupState.Hided;

    /**
     * 展示弹窗
     * @param options 弹窗选项
     * @param duration 动画时长
     */
    public open(options?: T, duration: number = this.animDuration) {
        return new Promise<void>(resolve => {
            // 弹窗显示中
            this.popupState = PopupState.Showing;
            // 储存选项
            this.options = options;
            // 初始化节点
            const background = this.$blockInput,
                main = this.$content;
            this.node.active = true;
            // 添加透明度组件
            let opacityCom = background.getComponent(UIOpacity);
            if (!opacityCom) {
                opacityCom = background.addComponent(UIOpacity);
            }
            Tween.stopAllByTarget(opacityCom);
            let uiOpacity = main.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = main.addComponent(UIOpacity);
            }
            Tween.stopAllByTarget(uiOpacity);
            uiOpacity.opacity = 255;
            // 添加按钮组件
            let btnCom = background.getComponent(Button);
            if (!btnCom) {
                btnCom = background.addComponent(Button);
            }
            // 添加全屏组件
            let firCom = background.getComponent(ScreenFit);
            if (!firCom) {
                background.addComponent(ScreenFit);
            }
            opacityCom.opacity = 0;
            // 点击背景关闭弹窗
            if (this.$bgclose) {
                // 判断是否已经绑定了关闭事件（以免重复绑定）
                if (!btnCom.clickEvents.some(v => { return v.handler === '_onBtClose' })) {
                    let eventHandler: EventHandler = new EventHandler();
                    eventHandler.target = this.node;
                    eventHandler.component = this._getComponentName(this);
                    eventHandler.handler = '_onBtClose';
                    background.getComponent(Button).clickEvents.push(eventHandler);
                }
            }
            // 播放背景遮罩动画
            const value = 255 * 0.75;
            if (this.$mainAni === PopupOpenAni.None) {
                opacityCom.opacity = value;
            } else {
                tween(opacityCom)
                    .delay(duration * 0.2)
                    .to(duration * 0.8, { opacity: value })
                    .start();
            }
            // 阻止点击穿透
            let block = main.getComponent(BlockInputEvents);
            if (!block) {
                main.addComponent(BlockInputEvents);
            }
            // 初始化
            this.init(this.options);
            // 更新样式
            this.updateDisplay(this.options);
            this.mainAni(duration, resolve);
        })
    }

    /**
     * 弹窗主动动画
     * @param duration 
     * @param resolve 
     */
    private mainAni(duration: number, resolve: (value: void | PromiseLike<void>) => void): void {
        let main = this.$content;
        switch (this.$mainAni) {
            case PopupOpenAni.None:
                main.setScale(v3(1, 1, 1));
                // 弹窗已完全展示
                this.popupState = PopupState.Showed;
                this.toShow();
                resolve();
                break;
            case PopupOpenAni.FadeIn:
                tween(main)
                    .to(0, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
                    .start();
                // 弹窗已完全展示
                let uiOpacity = main.getComponent(UIOpacity);
                uiOpacity.opacity = 0;
                tween(uiOpacity)
                    .to(duration, { opacity: 255 }, { easing: 'backOut' })
                    .call(() => {
                        // 弹窗已完全展示
                        this.popupState = PopupState.Showed;
                        this.toShow();
                        resolve();
                    })
                    .start();
                break;
            case PopupOpenAni.Center:
                main.setScale(v3(0.8, 0.8, 1));
                tween(main)
                    .to(duration, { scale: v3(1, 1, 1) }, { easing: 'backOut' })
                    .call(() => {
                        // 弹窗已完全展示
                        this.popupState = PopupState.Showed;
                        this.toShow();
                        resolve();
                    })
                    .start();
                break;
            case PopupOpenAni.Left2Right:
                main.setScale(v3(1, 1, 1));
                main.position = v3(-vv.memmory.screen_w);
                tween(main)
                    .to(duration, { position: v3(0, 0, 0) })
                    .call(() => {
                        // 弹窗已完全展示
                        this.popupState = PopupState.Showed;
                        this.toShow();
                        resolve();
                    }).start();
                break;
            case PopupOpenAni.Right2Left:
                main.setScale(v3(1, 1, 1));
                main.position = v3(vv.memmory.screen_w);
                tween(main)
                    .to(duration, { position: v3(0, 0, 0) })
                    .call(() => {
                        // 弹窗已完全展示
                        this.popupState = PopupState.Showed;
                        this.toShow();
                        resolve();
                    })
                    .start();
                break;
            default:
                break;
        }
    }

    /**
     * 关闭弹窗
     * @param suspended 是否被挂起
     * @param duration 动画时长
     */
    public close(suspended: boolean = false, duration: number = this.animDuration) {
        return new Promise<void>(resolve => {
            const node = this.node;
            if (!node || !node.isValid) resolve();
            this.popupState = PopupState.Hideing;
            // 播放背景遮罩动画
            if (this.$blockInput) {
                tween(this.$blockInput.getComponent(UIOpacity))
                    .delay(duration * 0.2)
                    .to(duration * 0.8, { opacity: 0 })
                    .start();
            }
            let func = () => {
                this.blocker && (this.blocker.active = false);
                this.popupState = PopupState.Hided;
                this.onHide && this.onHide(suspended);
                resolve();
                this.finishCallback?.(suspended);
            }
            // 播放弹窗主体动画
            if (this.$content && this.$closeAni && duration > 0) {
                // 拦截点击事件（避免误操作）
                let blocker = this.blocker;
                if (!blocker) {
                    blocker = new Node('blocker');
                    blocker.addComponent(BlockInputEvents);
                    blocker.addComponent(UITransform);
                    blocker.getComponent(UITransform).setContentSize(node.getComponent(UITransform).contentSize);
                    blocker.setParent(node);
                }
                blocker.active = true;
                this.blocker = blocker;
                // 动画开始
                let main = this.$content;
                switch (this.$mainAni) {
                    case PopupOpenAni.None:
                    case PopupOpenAni.FadeIn:
                    case PopupOpenAni.Center:
                        tween(this.$content.getComponent(UIOpacity))
                            .to(duration, { opacity: 0 })
                            .start();
                        tween(this.$content)
                            .to(duration, { scale: v3(0.8, 0.8, 1) }, { easing: 'backIn' })
                            .call(() => {
                                func();
                            })
                            .start();
                        break;
                    case PopupOpenAni.Right2Left:
                        tween(main)
                            .to(duration, { position: v3(vv.memmory.screen_w) })
                            .call(() => {
                                func();
                            })
                            .start();
                        break;
                    case PopupOpenAni.Left2Right:
                        tween(main)
                            .to(duration, { position: v3(-vv.memmory.screen_w) })
                            .call(() => {
                                func();
                            })
                            .start();
                        break;
                    default:
                        break;
                }
            } else {
                func();
            }
        })
    }

    /**
     * 延迟一帧
     */
    private toShow(): void {
        this.scheduleOnce(() => {
            this.onShow(this.options);
        })
    }

    /**
     * 初始化（派生类请重写此函数以实现自定义逻辑）
     */
    protected init(options: T): void { }

    /**
     * 更新样式（派生类请重写此函数以实现自定义样式）
     * @param options 弹窗选项
     */
    protected updateDisplay(options: T): void { }

    /**
     * 弹窗已完全展示（派生类请重写此函数以实现自定义逻辑）
     */
    protected onShow(options: T): void { }

    /**
     * 弹窗已完全隐藏（派生类请重写此函数以实现自定义逻辑）
     * @param suspended 是否被挂起
     */
    protected onHide(suspended: boolean) { }

    /**
     * 弹窗流程结束回调（注意：该回调为 PopupManager 专用，重写 hide 函数时记得调用该回调）
     */
    protected finishCallback: ((suspended: boolean) => void) = null;

    /**
     * 设置弹窗完成回调（该回调为 PopupManager 专用）
     * @param callback 回调
     */
    public setFinishCallback(callback: (suspended: boolean) => void) {
        this.finishCallback = callback;
    }

    /**
     * 点击关闭
     */
    protected _onBtClose(): void {
        this.close();
    }
}
