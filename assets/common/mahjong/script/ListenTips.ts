import { _decorator, Label, UITransform, Widget } from "cc";
import List from "db://assets/frame/component/List";
import BaseClass from "db://assets/frame/ui/BaseClass";
import MJCard from "./MJCard";

const { ccclass } = _decorator;

/**
 * 听牌提示脚本(可以胡哪些牌)
 */
@ccclass
export default class ListenTips extends BaseClass {

    // 显示可以胡哪些牌
    public setView(data: { card: number, multiple: number, count: number }[]): void {
        let cnt = 0; // 不同牌的总张数
        for (let key in data) {
            cnt += data[key].count;
        }
        this.setList(this.$('_layout', List), data.slice(0, 6));
        this.$('_labTotal', Label).string = cnt + '';

        let isShow2 = data.length > 6;
        this.$('_layout2').active = isShow2; // 大于6张牌时显示第二个列表
        if (isShow2) {
            this.setList(this.$('_layout2', List), data.slice(6));
        }
        this.$('_listenBg', UITransform).setContentSize(760, isShow2 ? 390 : 230);
        this.$('_labTotal').parent.getComponent(Widget).updateAlignment();
    }

    private setList(list: List, data: { card: number, multiple: number, count: number }[]): void {
        list.setList(data, (js, res) => {
            js.$('_MJCard', MJCard).card = res.card;
            let m = res.multiple ? res.multiple : 0;
            js.$('_labMultiple', Label).string = Math.pow(2, m) + '倍';
            js.$('_labCnt', Label).string = res.count + '张';
        })
    }
}
