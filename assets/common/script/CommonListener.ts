import vv from "../../frame/Core";
import { Marquee } from "../../resources/pbjs";
import { CommonDefine } from "./CommonDefine";

/**
 * 登录成功服务器主动推送
 */
export default class CommonListener {
    // 系统相关
    public static marquees: Marquee.INotifyMarquee[] = null; // 跑马灯

    public static init(): void {
        vv.event.on(vv.eventType.gameHide, this.onHideGame, this); // 切后台
        vv.event.on('Marquee.NotifyMarquee', this.onNotifyMarquee, this); // 跑马灯
        //...
    }

    // 切后台
    private static onHideGame(): void {
        this.reset();
    }

    // 通知：跑马灯推送
    private static onNotifyMarquee(data: Marquee.INotifyMarquee): void {
        if (!this.marquees) this.marquees = [];
        this.marquees.push(data);
        vv.event.emit(CommonDefine.startMarQuee, data);
    }

    // 重置
    public static reset(): void {
        this.marquees && (this.marquees.length = 0);
    }

    // 清除
    public static clear(): void {
        this.marquees = null;
    }
}