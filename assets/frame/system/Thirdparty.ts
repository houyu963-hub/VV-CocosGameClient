import { native, sys } from "cc";
import vv from "../Core";
import { Config } from "../config/Config";

// cocos调用安卓接口
export enum NativeEventId {
    CloseSplash = 0, // 关闭闪图
    Copy = 1,        // 复制
    ExitApp = 2,     // 退出
    WxLogin = 3,     // 微信登录
    WxShare = 4,     // 微信分享
}

export const native_package_url = 'com/cocos/game/AppActivity';

export default class Thirdparty {
    public static browser_params = null;

    public static initBrowserParam(): void {
        this.browser_params = this.getHrefParam();
        if (this.browser_params?.server) {
            Config.server_http_address = this.browser_params.server;
        }
    }

    // call thirdparty
    public static callThirdparty(id: NativeEventId, param?: any): void {
        let obj = { id: id, data: param ?? {} };
        let data = JSON.stringify(obj);
        vv.logger.log(`callThirdparty platform:${sys.platform},${data}`);
        switch (sys.platform) {
            case sys.Platform.ANDROID:
                native.reflection.callStaticMethod(native_package_url, 'callNative', '(Ljava/lang/String;)V', data);
                break;
            case sys.Platform.IOS:
                break;
        }
    }

    // 获取浏览器地址栏参数
    private static getHrefParam(): object {
        if (sys.isNative) return;
        let locUrl = window.location.href;
        let matchStr = '?';
        let elmId = locUrl.indexOf(matchStr);
        let ret = null;
        if (elmId > -1) {
            let args = locUrl.slice(elmId + matchStr.length);
            let datas = args.split('&');
            datas.forEach(v => {
                let xx3 = v.split('=');
                if (!ret) ret = {};
                ret[xx3[0]] = xx3[1];
            })
        }
        return ret;
    }

    // 复制功能
    public static copyStr(param?: any, toast: boolean = true): void {
        if (sys.os === sys.OS.ANDROID) {
            let obj = {
                id: NativeEventId.Copy,
                data: param ?? {}
            }
            let data = JSON.stringify(obj);
            native.reflection.callStaticMethod(native_package_url, 'callNative', '(Ljava/lang/String;)V', data);
        } else if (sys.os === sys.OS.WINDOWS) {
            let textarea = document.createElement('textarea');
            textarea.textContent = param;
            document.body.appendChild(textarea);
            textarea.readOnly = true;
            textarea.select();
            textarea.setSelectionRange(0, textarea.textContent.length);
            try {
                const flag = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (flag && toast) {
                    vv.utils.showToast('复制成功');
                }
            } catch (err) { }
        }
    }
}