
import { _decorator, EventTouch, instantiate, Node, sp, tween, Tween, UITransform, v3, Vec2, Vec3 } from "cc";
import vv from "db://assets/frame/Core";
import BaseClass from "db://assets/frame/ui/BaseClass";
import { INVALID_CHAIR, MYSELF_VIEW_ID } from "../../script/GameClient";
import DiscardCtrl from "./DiscardCtrl";
import MahjongCtrl from "./MahjongCtrl";
import MJCard, { ColorType, Status } from "./MJCard";
import MJHandCard from "./MJHandCard";
import MJSound from "./MJSound";
import { Action, IPlayerOptions } from "./Operate";
import WeaveCtrl from "./WeaveCtrl";

const { ccclass } = _decorator;

/**
 * 手牌控制脚本
 */
@ccclass
export default class HandCtrl extends BaseClass {
    private _viewID: number = INVALID_CHAIR;

    private _allflower: number[] = [];  // 字牌
    private _startPos: Vec3;            // 触摸开始 目标节点位置
    private _startTouch: Vec2;          // 触摸开始 触点位置 世界坐标
    private _outCardPos: Vec3;          // 出牌位置
    private _curCardPos: Vec3;          // 当前牌位置
    private _thisPos: Vec3;             // 当前节点位置
    private _cardsPos: Vec3[] = [];     // 所有手牌位置
    private _cardsIndex: number[] = []; // 所有手牌index

    // 推到牌控制脚本
    private _weaveCtrl: WeaveCtrl = null;
    public set weaveCtrl(value: WeaveCtrl) {
        this._weaveCtrl = value;
    }

    // 弃牌控制脚本
    private _discardCtrl: DiscardCtrl = null;
    public set discardCtrl(value: DiscardCtrl) {
        this._discardCtrl = value;
    }

    // 游戏控制脚本
    private _mahjong: MahjongCtrl = null;
    public get mahjong(): MahjongCtrl {
        return this._mahjong;
    }
    public set mahjong(value: MahjongCtrl) {
        this._mahjong = value;
    }

    // 设置座位
    private _chair: number = INVALID_CHAIR;
    set chair(value: number) {
        if (this._chair == INVALID_CHAIR) {
            this._chair = value;
        }
    }

    // 换三张阶段
    private _exchangeState: boolean = false;
    public get exchangePhase(): boolean {
        return this._exchangeState;
    }
    public set exchangePhase(value: boolean) {
        this._exchangeState = value;
    }

    // 选杠牌中
    private _selectGangState: boolean = false;
    public get selectGangState(): boolean {
        return this._selectGangState;
    }
    public set selectGangState(value: boolean) {
        this._selectGangState = value;
    }

    // 定缺颜色 0万 1条 2筒
    private _dingqueColor: ColorType;
    public get dingqueColor(): ColorType {
        return this._dingqueColor;
    }
    public set dingqueColor(value: ColorType) {
        this._dingqueColor = value;
    }

    // 是否可以出牌
    private _isCanOutCard: boolean = false;
    public set isCanOutCard(value: boolean) {
        this._isCanOutCard = value;
    }
    public get isCanOutCard(): boolean {
        return this._isCanOutCard && !this.mahjong.getOperateBtnState();
    }

    // 打出的那张牌
    private _outMj: MJCard;
    public get outMj(): MJCard {
        return this._outMj;
    }
    public set outMj(value: MJCard) {
        this._outMj = value;
    }

    // 获取所有手牌 不含当前牌
    private _cards: MJCard[] = [];
    get cards(): MJCard[] {
        if (this._cards.length == 0) {
            this._cards = MahjongCtrl.getMJCard(this.$('_Cards')) as MJCard[];
        }
        return this._cards;
    }

    // 获取所有手牌 含当前牌
    get allCards(): MJCard[] {
        return this.cards.concat(this.current);
    }

    // 获取当前牌
    get current(): MJCard {
        return this.node.getChildByName('CurCard').getComponent(MJCard);
    }

    // 获取显示胡牌的那张牌
    get huCard(): MJCard {
        let huCard = this.node.getChildByName('HuCard')?.getComponent(MJCard);
        if (this._viewID === 2) { // 上家
            return huCard ? huCard : this.current;
        }
        return this.current;
    }

    // 设置打出的那张牌
    private _outCard: MJCard;
    set outCard(value: MJCard) {
        this._outCard = value;
        this._outCardPos = value.node.getPosition();
    }
    get outCard(): MJCard {
        return this._outCard;
    }

    // 听牌
    private _tingCards: { card: number; multiple: number; count: number; }[];
    public get tingCards(): { card: number; multiple: number; count: number; }[] {
        return this._tingCards ?? [];
    }
    public set tingCards(value: { card: number; multiple: number; count: number; }[]) {
        this._tingCards = value;
    }

    // 获取手牌
    get cardData() {
        let cards: number[] = [];
        let nodes: Node[] = [];
        this.cards.forEach(js => {
            if (js.node.active) {
                cards.push(js.card);
                nodes.push(js.node);
            }
        })
        return {
            handNode: nodes,
            handCard: cards,
            currentCard: this.current.node.active ? this.current.card : 0,
            isAction: !this.isCanOutCard
        }
    }

    // 获取手牌数量
    get cardCnt(): number {
        return this.allCards.reduce((start, cur) => start + (cur.node.active ? 1 : 0), 0)
    }

    // 获取当前圆锥
    get curSign(): Node {
        return this.node.parent.parent.getChildByName('CurrentSign');
    }

    protected onLoad(): void { // 记录手牌位置
        this._curCardPos = this.current.node.getPosition();
        this._thisPos = this.node.getPosition();
        this.allCards.forEach(card => {
            this._cardsPos.push(card.node.getPosition());
            this._cardsIndex.push(card.index);
        })
    }

    // 注册事件
    public registerEvent(view: number, register = true): void {
        this._viewID = view;
        this.allCards.forEach(card => card.node.active = false);
        this.node.active = true;
        if (view == MYSELF_VIEW_ID && register) {
            this.registerClick();
        }
    }

    // 注册麻将点击事件
    private registerClick(): void {
        this.allCards.forEach(card => {
            card.node.on(Node.EventType.TOUCH_START, this.touchStart, this);
            card.node.on(Node.EventType.TOUCH_MOVE, this.touchMove, this);
            card.node.on(Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
            card.node.on(Node.EventType.TOUCH_END, this.touchEnd, this);
        })
    }

    // 触摸开始
    private touchStart(event: EventTouch): void {
        let node = event.target as Node;
        this._startPos = node.getPosition();
        this._startTouch = event.getUILocation();
    }

    // 触摸移动
    private touchMove(event: EventTouch): void {
        if (!this.isCanOutCard) return;
        let node = event.target as Node;
        // 获取触摸点在节点父节点坐标系中的位置
        const currentPos = node.parent.getComponent(UITransform)
            .convertToNodeSpaceAR(v3(event.getUILocation().x, event.getUILocation().y));
        const startPos = node.parent.getComponent(UITransform)
            .convertToNodeSpaceAR(v3(this._startTouch.x, this._startTouch.y));
        // 计算偏移量并更新节点位置
        const dx = currentPos.x - startPos.x;
        const dy = currentPos.y - startPos.y;
        node.setPosition(
            this._startPos.x + dx,
            this._startPos.y + dy,
            this._startPos.z
        );
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            let mj = node.getComponent(MJCard);
            mj._shoot = false;
        }
    }

    // 触摸结束
    private touchEnd(event: EventTouch): void {
        const currentPos = event.getUILocation(); // 获取当前触摸位置
        let node = event.target as Node;
        let offset = currentPos.subtract(this._startTouch);
        let mj = node.getComponent(MJCard);
        if (this.exchangePhase) { // 是否处于换三张阶段
            this.checkChangeThree(mj);
            return;
        }
        if (this.selectGangState) { // 是否处于选杠牌中
            if (mj.shoot) { // 请求杠操作
                this.sendGang(mj);
            } else { // 提起杠牌
                node.setPosition(this._startPos);
                this.allCards.forEach(card => {
                    card.shoot = mj.card == card.card;
                })
            }
            return;
        }
        this.mahjong.hideTingCardsView();
        if (!this.isCanOutCard && mj.shoot) {
            node.setPosition(this._startPos);
            mj.shoot = false;
            this.mahjong.showSameCard(-1);
        } else if (this.isCanOutCard && (offset.y > 150 || mj.shoot)) {
            // 触摸操作触发出牌 检测能否出牌
            if (mj._magicCard && mj.card == mj._magicCard) { // 功能牌不能打出只能胡
                node.setPosition(this._startPos);
                return;
            }
            if (mj._magicCard && this._allflower.includes(mj.card)) { // 功能牌是花牌不能打出只能胡
                node.setPosition(this._startPos);
                return;
            }
            this.sendOutCard(mj);
        } else {
            // 未触发出牌 恢复牌位置
            node.setPosition(this._startPos);
            this.allCards.forEach(card => {
                card.shoot = false;
            })
            if (mj.status === Status.Stand) {
                mj.shoot = true;
            }
            MJSound.playEffect(MJSound.soundList.dianjipai, false, false);
            if (!this.isCanOutCard) {
                this.mahjong.showSameCard(mj.card);
            }
            if ((<MJHandCard>mj).getTips()) { // 点击听牌
                this.mahjong.showTingCardsView(mj.data);
            } else {
                this.mahjong.hideTingCardsView();
            }
        }
    }

    // 请求杠操作
    private sendGang(mj: MJCard): void {
        let card = mj.card;
        let options: IPlayerOptions = {
            Action: Action.ACTION_GANG,
            TargetCard: card,
            Cards: [card, card, card, card]
        }
        let _proxy = vv.memmory.gameClient._proxy;
        if (_proxy && _proxy.reqPlayerAction) {
            _proxy.reqPlayerAction(options, (success: boolean) => {
                // do nothing
            })
        }
    }

    // 发送出牌
    private sendOutCard(mj: MJCard): void {
        let card = mj.card;
        this.isCanOutCard = false;
        this.tingCards = mj.data;
        this.mahjong.hideTingCardsView();
        let param = {
            CardID: card,
        }
        let _proxy = vv.memmory.gameClient._proxy;
        if (_proxy && _proxy.reqPutCard) {
            _proxy.reqPutCard(param, (success: boolean) => {
                if (success) {
                    this._outMj = mj;
                } else {
                    this.isCanOutCard = true;
                    mj.node.setPosition(this._startPos);
                    mj.shoot = false;
                }
            })
        }
        this.mahjong.showSameCard(-1);
    }

    // 校验换三张
    private checkChangeThree(mj: MJCard): void {
        // 该牌已经弹起 直接放下了
        if (mj.shoot) {
            mj.shoot = false;
            mj.isGray = false;
            this.allCards.forEach(card => card.isGray = false);
            return;
        }
        // 一张都没有弹起
        let shoots = this.allCards.filter(card => card.shoot);
        let shootColor: number;
        if (shoots.length === 0) {
            mj.shoot = true;
            return;
        }
        shootColor = shoots[0].flowerColor;
        // 如果当前点击的牌的花色和已经选的牌的花色不一样就清空已经选的牌
        if (mj.flowerColor !== shootColor) {
            this.allCards.forEach(card => {
                card.shoot = false;
                card.isGray = false;
            })
            mj.shoot = true;
            return;
        }
        // 已经选了三张牌
        if (shoots.length === 3) {
            return;
        }
        // 不足三张
        if (shoots.length < 3) {
            this.allCards.forEach(card => card.isGray = false);
            mj.shoot = true;
            if (shoots.length === 2) {
                this.allCards.forEach(card => {
                    if (card.flowerColor === shootColor && !card.shoot) {
                        card.isGray = true;
                    }
                })
            }
            return;
        }
        mj.shoot = false;
    }

    // 赋值功能牌
    public set setCardMagic(cardData: number) {
        this.allCards.forEach((card, index) => {
            card.magicCard = cardData;
        })
    }

    // 设置自己手牌 cardData:服务器手牌 current:当前牌
    public setCards(cardData: number[], current?: number): void {
        this.node.active = true;
        for (let i = 0; i < this.cards.length; i++) {
            if (cardData[i]) {
                this.cards[i].card = cardData[i];
                this.cards[i].node.active = true;
            } else {
                this.cards[i].node.active = false;
            }
        }
        if (current) {
            this.current.card = current;
        }
        this.allCards.forEach((card, index) => {
            card.shoot = false;
            card.node.setPosition(this._cardsPos[index]);
            card.index = this._cardsIndex[index];
            card.isSelect = false;
            card.isGray = this.dingqueColor === card.flowerColor;
            (<MJHandCard>card).setTips?.(false, 0);
        })
        this.current.node.active = !!current;
    }

    // 设置其他人手牌 cardCnt:手牌数量 current:当前牌
    public setOtherCard(cardCnt: number, current: number): void {
        this.node.active = true;
        for (let i in this.cards) {
            this.cards[i].node.active = parseInt(i) < cardCnt; this.cards[i].node.parent.parent.active;
        }
        this.current.node.active = !!current;
    }

    // 设置手牌位置
    public setHandPosition(): void {
        if (this._viewID !== MYSELF_VIEW_ID) return; // 非自己的手牌不处理
        let weaveLen = this._weaveCtrl.weaveCount;
        if (weaveLen <= 0) return;
        let targetPos = v3(-100 * (weaveLen - 1), this.node.getPosition().y);
        this.node.setPosition(targetPos);
    }

    // 发牌动画
    public dealTiles(cards: number[], viewID: number, bankViewID: number): void {
        if (viewID !== this._viewID) return;
        this.node.active = true;

        let copyCards = vv.utils.randArray([...cards]);
        let handCards: MJCard[] = [];
        if (viewID === bankViewID) {
            handCards = this.cards.slice().reverse().concat(this.current);
        } else {
            handCards = this.cards.slice().reverse();
        }
        if (viewID === MYSELF_VIEW_ID) { // 自己发牌
            this.$('_dealTiles').active = true;
            let titiles = this.$('_dealTiles').children;
            titiles.forEach((tile, index) => {
                let delay = Math.floor(index / 4) * 0.5;
                if (index >= 13) {
                    delay += 0.8;
                }
                if (handCards[index]) {
                    this.scheduleOnce(() => {
                        MJSound.playEffect(MJSound.soundList.mapai, false, false);
                        tile.active = true;
                        let ske = tile.getComponent(sp.Skeleton);
                        ske.setAnimation(0, 'shoupaizhengli_1', false);
                        ske.setCompleteListener(() => {
                            ske.setCompleteListener(null);
                            ske.setAnimation(0, 'shoupaizhengli_2', false);
                            handCards[index].node.active = true;
                            handCards[index].card = copyCards[index];
                        })

                    }, delay);
                }
            })
            // 发牌完毕 整理手牌
            this.scheduleOnce(() => {
                this.allCards.forEach(card => { card.node.active = false });
                let boo: boolean = false;
                titiles.forEach((tile, index) => {
                    if (tile.active) {
                        let ske = tile.getComponent(sp.Skeleton);
                        ske.setAnimation(0, 'shoupaizhengli_1', false);
                        ske.setCompleteListener(() => {
                            ske.setCompleteListener(null);
                            ske.setAnimation(0, 'shoupaizhengli_2', false);
                            if (!boo) {
                                boo = true;
                                let current = cards.length === 14 ? cards.pop() : null;
                                this.setCards(cards, current);
                                this.node.active = true;
                            }
                        })
                    }
                })
            }, 3);
        } else { // 其他人发牌
            handCards.forEach((card, index) => {
                let delay = Math.floor(index / 4) * 0.5;
                if (index >= 13) {
                    delay += 0.8;
                }
                this.scheduleOnce(() => {
                    card.node.active = true;
                }, delay);
            })
        }
    }

    // 重置
    public resetView(): void {
        this.unscheduleAllCallbacks();
        Tween.stopAllByTarget(this.current.node);
        this.current.status = Status.Stand;
        this.current.node.setPosition(v3(this.current.node.getPosition().x, 0, 0));
        this.allCards.forEach((card, index) => {
            card.node.active = false;
            card.shoot = false;
            card.data = null;
            if (this._cardsPos[index]) card.node.setPosition(this._cardsPos[index]);
            card.card = 0;
            (<MJHandCard>card).setTips?.(false, 0);
        })
        if (this._thisPos) this.node.setPosition(this._thisPos);
        if (this.node.getChildByName('outCard')) this.outCard.node.active = false;
        if (this.$('_dealTiles')) this.$('_dealTiles').children.forEach(tile => tile.active = false);
        this.exchangePhase = false;
        this.huCard.node.active = false;
        this.dingqueColor = null;
        this.outMj = null;
        this.selectGangState = false;
        this.tingCards.length = 0;
    }

    // 重置出的那张牌
    public resetOutCard(): void {
        Tween.stopAllByTarget(this.outCard.node);
        this.outCard.status = Status.Stand;
        this.outCard.node.scale = v3(1, 1, 1);
        this.outCard.node.angle = 0;
        this.outCard.node.active = false;
        this.outCard.node.setPosition(this._outCardPos);
    }

    // 显示出牌提示 打哪张牌可以听牌 maxCountCard: 胡牌数最多的牌 maxMultipleCard: 倍数最大的牌
    public showListenCard(cards: { [out: number]: { card: number, multiple: number, count: number }[] }, maxCountCard: number[], maxMultipleCard: number[]): void {
        let moreNum = this.allCards.filter(v => { return !!cards[v.card] && v.node.active })?.length; // 有多个可以听
        for (let card of this.allCards) {
            let data = cards[card.card];
            let index: number = 0;
            let isCanHu = card.node.active && !!data;
            if (moreNum > 1) {
                if (card.flowerColor !== this.dingqueColor) { // 非定缺的牌
                    if (maxCountCard.includes(card.card)) {
                        index = 1;
                    } else if (maxMultipleCard.includes(card.card)) {
                        index = 2;
                    }
                }
            }
            (<MJHandCard>card).setTips(isCanHu, index);
            card.data = isCanHu ? data : null;
        }
    }

    // 清除出牌提示
    public clearListenCard(): void {
        for (let card of this.allCards) {
            (<MJHandCard>card).setTips(false, 0);
            card.data = null;
        }
    }

    // 出牌动画 outCardNode: 出牌的那张牌node card: 出的那张牌 handCards: 出牌后的手牌 fallCallBack: 出牌落下后的回调 callback: 出牌完成回调
    public playOutCard(outCardNode: Node, card: number, handCards: number[], fallCallBack?: () => void, callback?: () => void): void {
        if (!outCardNode) {
            console.trace('数据异常,没有找到出的那张牌');
            return;
        }
        outCardNode.active = false;
        let viewID = this._viewID;

        const fixed = [0.65, 0.6, 0.55, 0.6]; // 做动画那张牌原本缩放值
        let tableNextCard = this._discardCtrl.getNextCard();
        let s = tableNextCard.node.getScale().x * tableNextCard.node.parent.getScale().x * tableNextCard.node.parent.parent.getScale().x;
        let scale = fixed[viewID].mul(s);

        let angle = 90 * viewID;
        angle = angle > 180 ? angle - 360 : angle;

        let effect = this.outCard.node;
        Tween.stopAllByTarget(effect);
        let startPos: Vec3;
        if (viewID === MYSELF_VIEW_ID) { // 自己出牌从手牌位置打出
            startPos = vv.utils.convertLocation(outCardNode, effect.parent);
        } else { // 其他玩家出牌从当前牌位置打出
            startPos = vv.utils.convertLocation(this.current.node, effect.parent);
        }
        effect.getComponent(MJCard).card = card;
        effect.active = true;
        effect.setPosition(startPos);
        effect.scale = v3(fixed[viewID] * 0.6, fixed[viewID] * 0.6, 1);
        effect.angle = 0;
        let dropPos = vv.utils.convertLocation(tableNextCard.node, effect.parent);
        if (viewID === 1 || viewID === 3) {
            dropPos.y += 15; // 1 3 玩家出牌落下位置偏移
            dropPos.x += (viewID === 3 ? -10 : 10);
        }
        tween(effect)
            .to(0.1, { position: this._outCardPos, scale: v3(fixed[viewID], fixed[viewID], 1) }) // 移动中间显示
            .delay(0.5)
            .to(0.2, { position: dropPos, angle: angle, scale: v3(scale, scale, 1) }) // 落下
            .call(() => {
                effect.active = false;
                MJSound.playEffect(MJSound.soundList.chupai);
                fallCallBack?.();
            })
            .start();

        // 自己出牌后有当前牌时插入当前牌
        if (viewID === MYSELF_VIEW_ID && this.current.node.active) {
            let localOutIndex = parseInt(outCardNode.name.slice(6)); // 出牌的那张牌位置
            let localInterIndex = [...handCards].reverse().lastIndexOf(this.current.card);
            if (localInterIndex === -1) {
                console.trace(`数据异常,当前牌值在手牌中没有发现,${this.current.card},${handCards}`);
            }
            this.scheduleOnce(() => { // 等出牌动画差不多了 1s后插入当前牌
                // 腾出空位
                this.readyEmptySite(localOutIndex, localInterIndex, () => {
                    if (localInterIndex === 0) {
                        callback?.(); // 边张不用插牌动画
                    }
                });
                if (localInterIndex !== 0) { // 不是边张 开始插入
                    this.insertCurrentCard(localInterIndex, () => {
                        // 插入完成
                        MJSound.playEffect(MJSound.soundList.chapaimoca);
                        callback?.();
                    })
                }
            }, 0.2)
        } else {
            callback?.();
        }
    }

    // 插入当前牌 localInterIndex:本地插入位置 callback:插入后的回调
    private insertCurrentCard(localInterIndex: number, callback?: () => void): void {
        if (!this.current.node.active) return;
        this.current.node.active = false;
        let current = instantiate(this.current.node); // 克隆一个当前节点
        current.active = true;
        let target = this.cards[localInterIndex].node;
        target.parent.addChild(current);
        let local = vv.utils.convertLocation(this.current.node, target.parent);
        current.setPosition(local);

        let distance = local.x - target.getPosition().x;
        let speed = 4000; // x像素/s
        let costTime = distance / speed;

        let targetPos = this._cardsPos[localInterIndex];
        Tween.stopAllByTarget(current);
        tween(current)
            .to(0.1, { position: v3(current.getPosition().x - 50, current.getPosition().y + 200), angle: -15 })
            .delay(0.1)
            .to(costTime, { position: v3(targetPos.x, targetPos.y + 200) })
            .call(() => {
                let card = current.getComponent(MJCard);
                card.index = this.cards[localInterIndex].index;
                card.node.setSiblingIndex(target.getSiblingIndex());
            })
            .to(0.2, { angle: 0 })
            .to(0.2, { position: targetPos })
            .call(() => {
                current.destroy();
                callback?.();
            })
            .start();
    }

    // 腾出空位待当前牌插入 localOutIndex: 本地出牌位置 localInterIndex: 本地插入位置
    private readyEmptySite(localOutIndex: number, localInterIndex: number, callback?: () => void): void {
        if (localInterIndex === localOutIndex) {
            callback?.();
            return;
        }
        let moveCards: MJCard[];
        let moveTween = () => {
            for (let i = 0; i < moveCards.length; i++) {
                let card = moveCards[i];
                let currIndex = parseInt(card.node.name.slice(6));
                let targetIndex = localInterIndex < localOutIndex ? (currIndex + 1) : (currIndex - 1);
                let targetPos = this._cardsPos[targetIndex];
                tween(card.node)
                    .to(0.1, { position: targetPos })
                    .call(() => {
                        if (i === moveCards.length - 1) {
                            callback?.();
                        }
                    })
                    .start();
            }
        }
        if (localInterIndex < localOutIndex) {
            moveCards = this.cards.filter(v => {
                let index = parseInt(v.node.name.slice(6));
                return index >= localInterIndex && index < localOutIndex;
            });
        } else {
            moveCards = this.cards.filter(v => {
                let index = parseInt(v.node.name.slice(6));
                return index > localOutIndex && index <= localInterIndex;
            });
        }
        moveTween();
    }
}