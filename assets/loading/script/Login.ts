import { _decorator } from "cc";
import { ChannelConfig } from "../../frame/config/ChannelConfig";
import { Platform, Scene_name } from "../../frame/config/Define";
import vv from "../../frame/Core";
import Thirdparty, { NativeEventId } from "../../frame/system/Thirdparty";
import { SceneBase } from "../../frame/ui/SceneBase";
import SceneNavigator from "../../frame/ui/SceneNavigator";

const { ccclass, property } = _decorator;
@ccclass
export default class Login extends SceneBase {
    protected onLoad(): void {
        super.onLoad();
        vv.event.on(vv.eventType.onWxLoginSucc, this.onWxLoginSucc, this);
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private onWxLoginSucc(): void {
    }

    private _onBtLogin(): void {
        // TEST
        SceneNavigator.go(Scene_name.Hall);
        return;
        // TODO: 根据平台选择登录方式
        switch (ChannelConfig.platform) {
            case Platform.Android:
            case Platform.IOS:
                Thirdparty.callThirdparty(NativeEventId.WxLogin);
                break;
            case Platform.Web:
                Thirdparty.callThirdparty(NativeEventId.WxLogin);
                break;
            case Platform.Mini:
                // TODO 小游戏平台登陆
                break;
            default:
                break;
        }
    }

}