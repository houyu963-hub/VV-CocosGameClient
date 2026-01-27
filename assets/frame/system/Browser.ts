import { sys } from "cc";
import { ChannelConfig } from "../config/ChannelConfig";

export default class Browser {
    private static _browser_params = null;

    // 获取浏览器参数
    public static get browser_params() {
        return Browser._browser_params;
    }

    // 初始化
    public static initialize(): void {
        this._browser_params = this.getHrefParam();
        if (this.browser_params?.server) {
            ChannelConfig.serverUrl = this.browser_params.server;
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
}