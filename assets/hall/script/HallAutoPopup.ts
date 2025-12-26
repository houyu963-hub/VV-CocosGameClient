import { Component, _decorator } from "cc";
import vv from "../../frame/Core";
import SceneNavigator from "../../frame/ui/SceneNavigator";

const { ccclass } = _decorator;
@ccclass
export default class HallAutoPopup extends Component {
    public static instance: HallAutoPopup = null;

    private _popupQueueFromLogin: Function[] = [];
    private _popupQueueFormGame: Function[] = [];

    private _starting = false;   // 是否已开始
    private _isFromGame = false; // 是否来自游戏

    protected onLoad(): void {
        HallAutoPopup.instance = this;
        this._isFromGame = !!SceneNavigator.param; // 来自游戏必带参数 登陆进来的不会带参数

        // vv.event.on(vv.eventType.hallShowNextPopup, this.showNextPopup, this); // 继续显示下一个弹窗

        // 系统相关
        // vv.event.on(vv.eventType.activityDataChange, this.onActivityDataChange, this); // 活动数据改变
    }

    protected onDestroy(): void {
        HallAutoPopup.instance = null;
        vv.event.removeAllByTarget(this);
        // vv.network.cancelRequest(vv.pb.Commands.GetGameListReq);
        this.unscheduleAllCallbacks();
    }

    protected start(): void {
        if (this._isFromGame) {
            this.pushQueueFromGame();
        } else {
            this.pushQueueFromLogin();
        }
    }

    // push 弹窗队列 {登陆}
    private pushQueueFromLogin(): void {
        [
            // 系统相关
            this.pushAnnouncePopup.bind(this),                    // 公告弹窗
        ].some(act => !act());
        this.startQueue();
    }

    // push 弹窗队列 {游戏返回}
    private pushQueueFromGame(): void {
        [
            // 系统相关
            this.pushAnnouncePopup.bind(this),                    // 公告弹窗
        ].some(act => !act());
        this.startQueue();
    }

    // 启动队列
    private startQueue(): void {
        if (this._starting) { return };
        let isFromGame = this._popupQueueFromLogin.length > 0;
        let queue: Function[];
        if (isFromGame) {
            queue = this._popupQueueFormGame;
        } else {
            queue = this._popupQueueFromLogin;
        }
        if (queue.length == 0) {
            this._starting = false;
            vv.event.emit(vv.eventType.blockInput, false);
            return;
        }
        vv.event.emit(vv.eventType.blockInput, true); // 锁屏 禁止点击
        this._starting = true;
        this.scheduleOnce(() => {
            let fn = queue.shift();
            vv.event.emit(vv.eventType.blockInput, false);
            fn?.();
        }, 0.1)
    }

    // ============收到服务推送的弹窗==============
    // 收到<公告>弹窗
    private onNotifyAnnounce(): void {
        if (this._starting) {
            this.pushAnnouncePopup();
        } else {
            this._starting = true;
            this.startQueue();
        }
    }

    // ============弹窗检测==============
    // 是否弹<公告>检测
    private pushAnnouncePopup(): boolean {
        this._popupQueueFromLogin.push(() => {
            // vv.ui.open(PopupName.Announce);
        })
        return true;
    }

}