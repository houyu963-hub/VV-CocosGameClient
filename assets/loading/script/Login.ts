import { _decorator, EditBox, EventTouch, sys } from "cc";
import { Config, } from "../../frame/config/Config";
import { ChannelType, LoginPlatform, Platform, Scene_name } from "../../frame/config/Define";
import vv from "../../frame/Core";
import Thirdparty, { NativeEventId } from "../../frame/system/Thirdparty";
import { SceneBase } from "../../frame/ui/SceneBase";
import SceneNavigator from "../../frame/ui/SceneNavigator";
import LoginHander from "./LoginHander";

const { ccclass, property } = _decorator;
@ccclass
export default class Login extends SceneBase {
    protected onLoad(): void {
        super.onLoad();
        vv.event.on(vv.eventType.onWxLoginSucc, this.onWxLoginSucc, this);

        // 自定义登录
        let isDev = Config.channel_type == ChannelType.Dev
        this.$('_custom_login').active = isDev
        this.$('_edtAccount', EditBox).node.active = isDev
        if (isDev) {
            this.$('_edtAccount', EditBox).string = sys.localStorage.getItem(LoginHander.KeyCustomAccount) || '';
        }

        this.$('_btLogin').active = true
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private onWxLoginSucc(): void {
    }

    private _onBtLogin(): void {
        if (Config.platform == Platform.Mini) {
            LoginHander.instance.toWechatLogin()
        }
        else {
            Thirdparty.callThirdparty(NativeEventId.WxLogin);
        }
    }

    private _onBtLoginCustom(evt: EventTouch): void {
        let account = this.$('_edtAccount', EditBox).string.trim()
        if (account.length == 0) {
            return
        }
        LoginHander.instance.login({ login_platform: LoginPlatform.Dev, account: account, ticket: '' }).then((res) => {
            if (res) {
                SceneNavigator.go(Scene_name.Hall);
                sys.localStorage.setItem(LoginHander.KeyCustomAccount, account);
            } else {
                SceneNavigator.go(Scene_name.Login);
            }
        })
    }
}