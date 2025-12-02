import vv from "../Core";

/**
 * 安卓调用cocos接口
 */
export enum NATIVE2COCOS {
    Back,                 // Android系统触发返回按钮
    GameShow,             // 游戏进入前台
    GameHide,             // 游戏进入后台
    AppUpdate,            // app版本有更新
    NetworkChange,        // 网络状态改变

    WxLogin = 100,        // 微信登录
    WxShare = 101,        // 微信分享
}


export default class ThirdpartyListener {
    public msgHandler: { [key: number]: Function } = {};

    public init(): void {
        // 安卓
        this.msgHandler[NATIVE2COCOS.Back] = this.onBack;
        this.msgHandler[NATIVE2COCOS.GameShow] = this.onGameShow;
        this.msgHandler[NATIVE2COCOS.GameHide] = this.onGameHide;
        this.msgHandler[NATIVE2COCOS.AppUpdate] = this.onAppupdate;
        this.msgHandler[NATIVE2COCOS.NetworkChange] = this.onNetworkChange;

        this.msgHandler[NATIVE2COCOS.WxLogin] = this.onWxLogin;
        this.msgHandler[NATIVE2COCOS.WxShare] = this.onWxShare;

        vv.event.on(vv.eventType.onNative2cocos, this.onNative2cocos, this);
    }

    private onNative2cocos(json: string) {
        let obj: { id: number, data: object } = JSON.parse(json);
        if (this.msgHandler[obj.id]) {
            this.msgHandler[obj.id].bind(this)(obj.data);
        }
    }

    /**
     * Android系统返回
     */
    private onBack(): void {
        vv.event.emit(vv.eventType.onNativeBack);
    }

    /**
     * 进入游戏前台
     */
    private onGameShow(): void {
        vv.event.emit(vv.eventType.onNativeGameShow);
    }

    /**
     * 进入游戏后台
     */
    private onGameHide(): void {
        vv.event.emit(vv.eventType.onNativeGameHide);
    }

    /**
     * app版本有更新
     */
    private onAppupdate(): void {
        vv.event.emit(vv.eventType.onAppUpdate);
    }

    /**
     * 网络状态改变
     * @param data.networkType  0无可用网络 1WIFI 2移动数据
     */
    private onNetworkChange(data: { networkType: string }): void {
        vv.event.emit(vv.eventType.onNetworkChange, data);
    }

    /**
     * 微信登陆
     * @param data 
     */
    private onWxLogin(data: { code: number, msg: string }): void {
        if (data.code !== -1) {
            vv.event.emit(vv.eventType.onWxLoginSucc, data);
        }
    }

    private onWxShare(data: { code: number, msg: string }): void {
        if (data.code !== -1) {

        }
    }
}