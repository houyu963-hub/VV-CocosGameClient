import { _decorator } from "cc";
import BaseClass from "db://assets/frame/ui/BaseClass";
import { INVALID_CHAIR } from "../../script/GameClient";
import WeaveItem from "./WeaveItem";

const { ccclass, property } = _decorator;

/**
 * 推到牌控制脚本
 */
@ccclass
export default class WeaveCtrl extends BaseClass {

    private _weaveItems: WeaveItem[] = [];
    // 获取所有推到牌组
    public get weaveItems() {
        if (this._weaveItems.length === 0) {
            for (let i in this.node.children) {
                this._weaveItems[i] = this.node.getChildByName('WeaveItem' + i).getComponent(WeaveItem);
            }
        }
        return this._weaveItems;
    }

    private _chair: number = INVALID_CHAIR;
    // 设置座位
    public set chair(value: number) {
        if (this._chair == INVALID_CHAIR) {
            this._chair = value;
            this.weaveItems.forEach(item => {
                item.meChairID = value;
            })
        }
    }

    // 获取当前已经显示的推到牌数量
    public get weaveCount(): number {
        return this.weaveItems.filter(item => item.node.active).length;
    }

    // 设置推到牌
    public setWeaveItems(weaves: Array<{
        weaveKind?: number,
        provider?: number,
        cards?: number[],
    }>) {
        if (!weaves) return;
        for (let i in this.weaveItems) {
            let item = weaves[i];
            this.weaveItems[i].node.active = !!item;
            if (item) {
                this.weaveItems[i].setWeave(item);
            }
        }
    }

    // 重置
    public resetView(): void {
        this.weaveItems.forEach(item => {
            item.node.active = false
        })
    }
}
