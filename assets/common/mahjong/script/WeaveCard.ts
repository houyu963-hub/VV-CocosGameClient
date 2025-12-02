import { _decorator, Enum } from "cc";
import MJCard from "./MJCard";

const { ccclass, property } = _decorator;

export enum ARROW { // 箭头方向 上左右
    NULL = 0,
    UP,
    LEFT,
    RIGHT,
}

/**
 * 单个推到牌[玩家吃碰杠的牌] 与MJCard不同的是有箭头
 */
@ccclass
export default class WeaveCard extends MJCard {
    private _dirRotation: number[] = [180, 0, 90, -90];

    @property _arrowDir: ARROW = ARROW.NULL;
    @property({ type: Enum(ARROW), tooltip: '箭头方向' })
    set arrowDir(value: ARROW) {
        this._arrowDir = value;
        if (this.arrow) {
            this.arrow.active = value != ARROW.NULL;
            this.arrow.angle = this._dirRotation[value];
        }
    }
    get arrowDir() {
        return this._arrowDir;
    }

    // 获取箭头节点
    private get arrow() {
        return this.$('_arrow');
    }
}
