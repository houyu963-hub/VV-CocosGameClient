import { _decorator, Node, tween, Tween, v3, Widget } from "cc";
import vv from "db://assets/frame/Core";
import BaseClass from "db://assets/frame/ui/BaseClass";
import MJCard, { DIR } from "./MJCard";

const { ccclass } = _decorator;

/**
 * 弃牌控制脚本
 */
@ccclass
export default class DiscardCtrl extends BaseClass {

    private _chair: number = -1; // 座位号
    public set chair(value: number) {
        this._chair = value;
    }

    // 重置view
    public resetView(): void {
        this.cards.forEach(card => {
            card.isSelect = false;
            card.node.active = false;
        })
        Tween.stopAllByTarget(this._curSign);
    }

    private _curSign: Node = null;
    // 设置弃牌指示器节点
    public set curSign(value: Node) {
        this._curSign = value;
    }

    private _cards: MJCard[] = [];
    // 获取弃牌 所有
    get cards() {
        if (this._cards.length == 0) {
            this._cards = this.node.getComponentsInChildren(MJCard);
            this._cards.sort((a, b) => {
                return parseInt(a.node.name.slice(6)) - parseInt(b.node.name.slice(6));
            })
        }
        return this._cards;
    }

    // 获取弃牌
    get cardData(): number[] {
        let cards = [];
        this.cards.forEach(js => {
            if (js.node.active) cards.push(js.card);
        })
        return cards;
    }

    // 设置弃牌
    public setCards(cardData: number[]): void {
        for (let i in this.cards) {
            if (cardData[i]) {
                this.cards[i].card = cardData[i];
            }
            this.cards[i].node.active = !!cardData[i];
        }
    }

    // 获取当前弃牌
    public getCurCard(): MJCard {
        let cur: MJCard = this.cards[0];
        for (let card of this.cards) {
            if (!card.node.active) return cur;
            else cur = card;
        }
    }

    // 获取下一个弃牌
    public getNextCard(): MJCard {
        for (let card of this.cards) {
            if (!card.node.active) return card;
        }
        return null;
    }

    // 设置当前圆锥位置
    public setCurrent(): void {
        this.setSignPos(this.getCurCard());
    }

    // 设置圆锥位置
    public setSignPos(tableCard: MJCard): void {
        let widget = this.getComponent(Widget);
        if (widget) widget.updateAlignment();
        let node = tableCard.node;
        let pos = vv.utils.convertLocation(node.getChildByName('_flower'), this._curSign.parent);
        let y = tableCard.direction == DIR.Down ? 20 : 20;
        pos.y += y;
        this._curSign.setPosition(pos);
        this._curSign.active = true;

        Tween.stopAllByTarget(this._curSign);
        tween(this._curSign)
            .by(0.5, { position: v3(0, 8) })
            .by(0.5, { position: v3(0, - 8) })
            .union()
            .repeatForever()
            .start();
    }

}
