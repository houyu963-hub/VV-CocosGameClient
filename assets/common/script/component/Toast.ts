import { Label, Tween, _decorator, tween, v3 } from "cc";
import PopupBase from 'db://assets/frame/ui/PopupBase';

const { ccclass } = _decorator;
@ccclass
export class Toast extends PopupBase<string | { msg: string, delay: number }> {

    protected init(options: string | { msg: string, delay: number }): void {
        let str: string = '',
            delay: number = 0;
        if (typeof (options) === 'object') {
            str = options.msg;
            delay = options.delay ?? 2;
        } else {
            str = options;
            delay = 2;
        }
        this.$('_text', Label).string = str;
        let node = this.$('_effect');
        Tween.stopAllByTarget(node);
        node.scale = v3(1, 0, 1);
        tween(node)
            .to(0.2, { scale: v3(1, 1, 1) })
            .start()
        this.scheduleOnce(() => {
            this.close();
        }, delay)
    }
}