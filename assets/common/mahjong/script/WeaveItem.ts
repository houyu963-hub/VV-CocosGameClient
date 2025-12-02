import { _decorator, Component } from "cc";
import vv from "db://assets/frame/Core";
import WeaveCard, { ARROW } from "./WeaveCard";

enum WIK {
    STACK_TYPE_INVALID = 0,     // 无效的碰杠类型
    STACK_TYPE_AN_GANG = 1,     // 暗杠：手中有4张相同的牌，自摸后亮出
    STACK_TYPE_BA_GANG = 2,     // 巴杠：碰牌后自摸到第4张相同的牌
    STACK_TYPE_DIAN_GANG = 3,   // 点杠：其他玩家打出第4张相同的牌
    STACK_TYPE_PENG = 4,        // 碰：手中有2张相同的牌，其他玩家打出第3张
}

const CARD_CNT = 4;
const { ccclass, property } = _decorator;

/**
 * 一组推到牌[玩家吃碰杠的牌]
 */
@ccclass
export default class WeaveItem extends Component {

    public meChairID: number = -1; // 当前玩家位置号
    private _arrowShow: number[] = [ARROW.NULL, ARROW.RIGHT, ARROW.UP, ARROW.LEFT]; // 提供牌的人的位置减去当前玩家位置, 差值为索引, 用来显示箭头方向

    private _cards: WeaveCard[] = [];
    get cards() {
        if (this._cards.length == 0) {
            this._cards = this.node.getComponentsInChildren(WeaveCard);
            this._cards.sort((a, b) => {
                return parseInt(a.node.name.slice(6)) - parseInt(b.node.name.slice(6));
            })
        }
        return this._cards;
    }

    public setWeave(weaveItem: {
        weaveKind?: number,
        provider?: number,
        cards?: number[],
    }): void {
        if (weaveItem.cards.length < 3) { // 不能少于3张
            console.warn('WeaveItem setCards error ', weaveItem.cards);
            return;
        }
        this.cards[3].node.active = !!weaveItem.cards[3];
        for (let i in weaveItem.cards) {
            this.cards[i].card = (weaveItem.weaveKind === WIK.STACK_TYPE_AN_GANG && parseInt(i) < 3) ? 0 : weaveItem.cards[i];
        }

        // 显示箭头
        if (weaveItem.provider >= 0) {
            let centerIdx = this._getCenterIdx(weaveItem.weaveKind);
            let arrDir = this._arrowShow[(weaveItem.provider + vv.memmory.gameClient.maxPlayerCnt - this.meChairID) % vv.memmory.gameClient.maxPlayerCnt];
            if (this.meChairID == -1) arrDir = ARROW.NULL;
            for (let i = 0; i < CARD_CNT; i++) {
                if (i == centerIdx) {
                    if (arrDir && arrDir != ARROW.NULL) {
                        this.cards[i].arrowDir = arrDir;
                    }
                } else {
                    this.cards[i].isGray = false;
                    this.cards[i].arrowDir = ARROW.NULL;
                }
            }
        }
    }

    // 获取中心牌的索引
    private _getCenterIdx(weaveKind: number) {
        if (weaveKind == WIK.STACK_TYPE_PENG) {
            return 1;
        } else if (weaveKind == WIK.STACK_TYPE_AN_GANG || weaveKind == WIK.STACK_TYPE_BA_GANG || weaveKind == WIK.STACK_TYPE_DIAN_GANG) {
            return 3;
        }
        return -1;
    }

}
