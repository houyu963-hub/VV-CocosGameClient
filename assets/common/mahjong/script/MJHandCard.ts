import { _decorator } from "cc";
import ActiveSprite from "db://assets/frame/component/ActiveSprite";
import MJCard from "./MJCard";

const { ccclass } = _decorator;

/**
 * 单个手牌 与MJCard不同的是有听牌提示箭头
 */
@ccclass
export default class MJHandCard extends MJCard {

    setTips(value: boolean, index: number) {
        if (this.$('_tips')) {
            this.$('_tips').active = value;
            this.$('_tips', ActiveSprite).index = index;
        }
    }

    getTips(): boolean {
        if (this.$('_tips')) {
            return this.$('_tips').active;
        }
        return false;
    }
}
