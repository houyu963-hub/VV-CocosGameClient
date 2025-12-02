
import { _decorator, instantiate, macro, Node, Prefab, sp, Tween, tween, UITransform, v3, Vec3 } from "cc";
import vv from "db://assets/frame/Core";
import BaseClass from "db://assets/frame/ui/BaseClass";
import { MYSELF_VIEW_ID } from "../../script/GameClient";
import Direction from "./Direction";
import DiscardCtrl from "./DiscardCtrl";
import HandCtrl from "./HandCtrl";
import ListenTips from "./ListenTips";
import MJCard, { Status } from "./MJCard";
import Operate, { Action, IPlayerOptions } from "./Operate";
import { StateDingque } from "./StateDingque";
import { StateExchange } from "./StateExchange";
import WeaveCtrl from "./WeaveCtrl";

const { ccclass, property } = _decorator;

interface IGameClient {
    model: any;
    chair2View(chairID: number): number;
    view2Chair(viewID: number): number;
    get maxPlayerCnt(): number;
    get maxCardCnt(): number;
    init(): void;
}

enum EzIndex {
    weave,      // 推到牌
    direction,  // 方位指示盘
    discard,    // 弃牌
    hand,       // 手牌
    handShow,   // 手牌明牌
    sign,       // 弃牌指示器
    operate,    // 操作按钮
    tips,       // 听牌提示
    exchange,   // 换牌节点
    dingque,    // 定缺节点
    ani,        // 动画节点
    out,        // 出牌节点
}

export enum OperateType {
    ACTION_PENG = 3,
    ACTION_GANG = 4,
    ACTION_HU = 6,
    ACTION_ZI_MO = 15,
}

@ccclass
export default class MahjongCtrl extends BaseClass {
    @property({ type: Prefab, tooltip: '推到牌组预制体[玩家吃碰杠的牌]' }) private weave: Prefab = null;
    @property({ type: Prefab, tooltip: '方位指示盘预制体' }) private direction: Prefab = null;
    @property({ type: Prefab, tooltip: '弃牌预制体' }) private discard: Prefab = null;
    @property({ type: Prefab, tooltip: '手牌明牌预制体' }) private handShow: Prefab = null;
    @property({ type: Prefab, tooltip: '手牌预制体' }) private hand: Prefab = null;
    @property({ type: Node, tooltip: '弃牌指示器' }) private curSign: Node = null;
    @property({ type: Prefab, tooltip: '操作按钮预制体' }) private operate: Prefab = null;
    @property({ type: Prefab, tooltip: '听牌提示预制体' }) private listenTips: Prefab = null;
    @property({ type: Prefab, tooltip: '换牌预制体' }) private exchange: Prefab = null;
    @property({ type: Prefab, tooltip: '定缺预制体' }) private dingque: Prefab = null;

    private _weaveCtrl: WeaveCtrl[];         // 推到牌脚本
    private _dirCtrl: Direction = null;      // 方位指示盘预脚本
    private _discardCtrl: DiscardCtrl[];     // 弃牌脚本
    private _handShowCtrl: HandCtrl[];       // 手牌明牌脚本
    private _handCtrl: HandCtrl[];           // 手牌脚本
    private _operateCtrl: Operate = null;    // 操作按钮脚本
    private _listenTips: ListenTips = null;  // 听牌提示脚本
    private _exchange: StateExchange = null; // 换牌脚本
    private _dingque: StateDingque = null;   // 定缺脚本

    private _outCardPosition: Vec3[] = [];   // 出牌位置
    private _gameClient: IGameClient;        // 主游戏脚本

    private _multi_touch = true;
    private _init: boolean = false;

    protected onLoad(): void {
        this._gameClient = vv.memmory.gameClient;

        // 实例化推到牌预制体
        let weaveNode = instantiate(this.weave);
        weaveNode.parent = this.node;
        this._weaveCtrl = weaveNode.getComponentsInChildren(WeaveCtrl);

        // 实例化手牌明牌预制体
        let directionNode = instantiate(this.direction);
        directionNode.parent = this.node;
        this._dirCtrl = directionNode.getComponent(Direction);

        // 实例化弃牌预制体
        let discardNode = instantiate(this.discard);
        discardNode.parent = this.node;
        this._discardCtrl = discardNode.getComponentsInChildren(DiscardCtrl);
        this._discardCtrl.forEach(js => js.curSign = this.curSign);  // 设置弃牌指示器节点

        // 实例化手牌预制体
        let handNode = instantiate(this.hand);
        handNode.parent = this.node;
        this._handCtrl = [];
        for (let child of handNode.getChildByName('hand').children) {
            let i = parseInt(child.name.slice(-1));
            this._handCtrl[i] = child.getComponent(HandCtrl);
            this._handCtrl[i].mahjong = this;
            this._handCtrl[i].outCard = this.outCard[i];
            this._handCtrl[i].registerEvent(i);
            this._handCtrl[i].node.active = false;
        }

        // 实例化明牌预制体
        let handShowNode = instantiate(this.handShow);
        handShowNode.parent = this.node;
        this._handShowCtrl = [];
        for (let child of handShowNode.getChildByName('hand').children) {
            let i = parseInt(child.name.slice(-1));
            this._handShowCtrl[i] = child.getComponent(HandCtrl);
            this._handShowCtrl[i].mahjong = this;
            this._handShowCtrl[i].outCard = this.outCard[i];
            this._handShowCtrl[i].registerEvent(i, false);
            this._handShowCtrl[i].node.active = false;
        }

        // 实例化操作按钮预制体
        let operateNode = instantiate(this.operate);
        operateNode.parent = this.node;
        operateNode.active = false;
        this._operateCtrl = operateNode.getComponent(Operate);

        // 实例化听牌提示预制体
        let listenTipsNode = instantiate(this.listenTips);
        listenTipsNode.parent = this.node;
        listenTipsNode.active = false;
        this._listenTips = listenTipsNode.getComponent(ListenTips);

        // 实例化换牌预制体
        let exchangeNode = instantiate(this.exchange);
        exchangeNode.parent = this.node;
        exchangeNode.active = false;
        this._exchange = exchangeNode.getComponent(StateExchange);
        this._exchange.handCtrl = this._handCtrl[MYSELF_VIEW_ID];

        // 实例化听牌提示预制体
        let dingqueNode = instantiate(this.dingque);
        dingqueNode.parent = this.node;
        dingqueNode.active = false;
        this._dingque = dingqueNode.getComponent(StateDingque);

        // 设置层级
        weaveNode.setSiblingIndex(EzIndex.weave);
        directionNode.setSiblingIndex(EzIndex.direction);
        discardNode.setSiblingIndex(EzIndex.discard);
        handNode.setSiblingIndex(EzIndex.hand);
        handShowNode.setSiblingIndex(EzIndex.handShow);
        operateNode.setSiblingIndex(EzIndex.operate);
        listenTipsNode.setSiblingIndex(EzIndex.tips);
        exchangeNode.setSiblingIndex(EzIndex.exchange);
        dingqueNode.setSiblingIndex(EzIndex.dingque);

        this.curSign.setSiblingIndex(EzIndex.sign);
        this.$('_out').setSiblingIndex(EzIndex.out);
        this.$('_opts').setSiblingIndex(EzIndex.ani);
        this.$('_specialAni').setSiblingIndex(EzIndex.ani);

        // 记录做出牌动画的牌位置
        for (let index = 0; index < this.$('_out').children.length; index++) {
            const element = this.$('_out').children[index];
            this._outCardPosition[index] = element.getPosition();
        }

        this._multi_touch = macro.ENABLE_MULTI_TOUCH;
        macro.ENABLE_MULTI_TOUCH = false; // 关闭多点触摸
        this._init = true;
    }

    protected onDestroy(): void {
        // 清空引用，避免内存泄漏
        this._weaveCtrl = null;
        this._dirCtrl = null;
        this._discardCtrl = null;
        this._handShowCtrl = null;
        this._handCtrl = null;
        this._operateCtrl = null;
        this._listenTips = null;
        this._exchange = null;
        this._dingque = null;

        this._outCardPosition = null;
        this._gameClient = null;

        macro.ENABLE_MULTI_TOUCH = this._multi_touch;
        this._init = null;
    }

    private _actionAni: sp.Skeleton[] = [];
    // 获取spine动画 吃碰杠听胡自摸
    private get actionAni(): sp.Skeleton[] {
        if (this._actionAni.length === 0) {
            for (let i in this.$('_opts').children) {
                this._actionAni[i] = this.$('_opts').children[i].getComponent(sp.Skeleton);
                this._actionAni[i].setCompleteListener(() => {
                    this._actionAni[i].node.active = false;
                })
            }
        }
        return this._actionAni;
    }

    private _specialActionAni: sp.Skeleton[] = [];
    // 获取spine动画 杠上花、杠上炮、海底捞、呼叫转移、一炮多响
    private get specialActionAni(): sp.Skeleton[] {
        if (this._specialActionAni.length === 0) {
            for (let i in this.$('_specialAni').children) {
                this._specialActionAni[i] = this.$('_specialAni').children[i].getComponent(sp.Skeleton);
                this._specialActionAni[i].setCompleteListener(() => {
                    this._specialActionAni[i].node.active = false;
                })
            }
        }
        return this._specialActionAni;
    }

    private _outCard: MJCard[] = [];
    // 获取所有玩家当前正打出的那张牌
    private get outCard() {
        if (this._outCard.length == 0) {
            for (let i in this.$('_out').children) {
                this._outCard[i] = this.$('_out').children[i].getComponent(MJCard);
            }
        }
        return this._outCard;
    }

    /****************************** 外部接口 start ******************************/

    // 进入换牌阶段 recommendedCards:推荐的换牌 resTimestamp:剩余时间s
    public enterExchangeState(recommendedCards: number[], resTimestamp: number): void {
        this._exchange.node.active = true;
        this._exchange.enterExchangeState(resTimestamp);
        this._exchange.showOtherExchange(true);
        this._handCtrl[MYSELF_VIEW_ID].exchangePhase = true;
        this.shootCard(recommendedCards, -1, true); // 显示推荐换牌
    }

    // 退出换牌阶段
    public exitExchangeState(): void {
        this._exchange.node.active = false;
        this._handCtrl[MYSELF_VIEW_ID].exchangePhase = false;
    }

    // 更新换牌进度 progress:换牌进度 已换牌的viewID exchangeDirectio:换牌方向 isFinished:是否已经换牌完成
    public updateExchangeProgress(viewIDs: number[], isFinished: Boolean, exchangeDirection?: number, callback?: () => void): void {
        this._exchange.updateExchangeProgress(viewIDs);
        if (isFinished) { // 换牌完成 开始播放换牌动画
            this._exchange.palyAni(exchangeDirection, () => {
                this._exchange.node.active = false;
                callback?.();
            });
        }
    }

    // 进入定缺阶段 recommendedDingqueSuit:推荐定缺 1万 2条 3筒 
    public enterDingQueState(recommendedDingqueSuit: number): void {
        this.exitExchangeState();
        this._dingque.node.active = true;
        this._dingque.showOperateBtn(true, recommendedDingqueSuit);
        this._dingque.showOtherDingque(true);
    }

    // 退出定缺阶段
    public exitDingQueState(): void {
        this._dingque.node.active = false;
    }

    // 更新定缺进度 viewID:刚完成定缺的玩家ID 
    public updateDingQueProgress(viewID: number): void {
        this._dingque.updateDingQueProgress(viewID);
    }

    // 定缺完成 suits:已定缺玩家定的花色 posArray:显示缺的位置世界坐标 callback:回调
    public updateDingQueComplete(suits: { [viewID: number]: number }, posArray: Vec3[], callback: () => void): void {
        let localPos: Vec3[] = [];
        posArray.forEach(pos => {
            let local = this._dingque.$('_dingqueResult').getComponent(UITransform).convertToNodeSpaceAR(pos);
            localPos.push(local); // 将世界坐标转换为本地坐标
        })
        this._dingque.showDingqueResult(suits, localPos, () => {  //  显示定缺结果
            this._dingque.node.active = false;
            callback?.();
        });
    }

    // 设置定缺的颜色
    public setDingqueColor(suits: { [viewID: number]: number }): void {
        for (const key in suits) {
            this._handCtrl[key].dingqueColor = suits[key] - 1;
        }
    }

    // 玩家摸牌 显示当前牌动画
    public playerDrawCard(viewID: number, card: number): void {
        // 玩家摸牌后 立即回调
        if (this._outCallbackMap) {
            let callback = this._outCallbackMap[viewID];
            callback?.fallCallBack?.();
            callback?.outCallBack?.();
            delete this._outCallbackMap[viewID];
        }
        let currentCard = this.getCurrentCard(viewID);
        Tween.stopAllByTarget(currentCard.node);
        const position = currentCard.node.getPosition();
        currentCard.node.active = true;
        currentCard.node.setPosition(position.x, position.y + 40);
        currentCard.card = card;
        currentCard.status = Status.Stand;
        currentCard.isGray = currentCard.flowerColor === this._handCtrl[viewID].dingqueColor; // 当前牌是否为定缺
        tween(currentCard.node)
            .to(0.1, { position: v3(position.x, position.y) })
            .start()
    }

    // 设置是否可以出牌
    public setCanOutCard(state: boolean): void {
        this._handCtrl[MYSELF_VIEW_ID].isCanOutCard = state;
    }

    // 获取能否出牌
    public getCanOutCard(): boolean {
        return this._handCtrl[MYSELF_VIEW_ID].isCanOutCard;
    }

    // 设置选杠牌中
    public selectGangState(state: boolean): void {
        this._handCtrl[MYSELF_VIEW_ID].selectGangState = state;
        this.hideOperateOptions();
        this.hideTingCardsView();
        this.clearListenCard();
    }

    // 获取操作按钮的状态
    public getOperateBtnState(): boolean {
        return this._operateCtrl.node.active;
    }

    // 显示听牌面板
    public showTingCardsView(data: { card: number, multiple: number, count: number }[]): void {
        this._listenTips.node.active = true;
        this._listenTips.setView(data);
    }

    // 隐藏听牌面板
    public hideTingCardsView(): void {
        this._listenTips.node.active = false;
    }

    // 获取听牌面板状态
    public getTingCardsViewState(): boolean {
        return this._listenTips.node.active;
    }

    // 获取听哪些牌
    public getTingCards(): { card: number; multiple: number; count: number; }[] {
        return this._handCtrl[MYSELF_VIEW_ID].tingCards;
    }

    // 提起指定牌 shootTime:提起的时间s <0:一直提起 isGrayOther:是否将其他牌变灰
    public shootCard(data: number[], shootTime: number = 0.2, isGrayOther?: boolean): void {
        const all = this._handCtrl[MYSELF_VIEW_ID].allCards;
        all.forEach(card => {
            card.shoot = false; // 先全部取消弹起
            card.isGray = isGrayOther;
        })
        if (!data || data.length === 0) {
            return;
        }
        let copyData = [...data];
        // 按顺序选中三张
        for (let i = 0; i < all.length; i++) {
            if (copyData.includes(all[i].card)) {
                all[i].shoot = true;
                all[i].isGray = false;
                // 防止重复选同一张
                copyData.splice(copyData.indexOf(all[i].card), 1);
                // 插入手牌中
                if (shootTime > 0) {
                    this.scheduleOnce(() => {
                        let node = all[i].node;
                        Tween.stopAllByTarget(node);
                        tween(node)
                            .to(0.2, { position: v3(node.getPosition().x, 0) })
                            .call(() => {
                                all[i].shoot = false;
                            })
                            .start();
                    }, shootTime);
                }
            }
        }
    }

    // 获取手牌当前牌
    public getCurrentCard(viewID: number): MJCard {
        return this._handCtrl[viewID].current;
    }

    // 设置胡牌的那张牌
    public setHuCard(viewID: number, card: number): void {
        this.getCurrentCard(viewID).node.active = false;
        let huCard = this._handCtrl[viewID].huCard;
        huCard.node.active = true;
        huCard.card = card;
        huCard.isGray = false;
        huCard.status = Status.Lie;
    }

    // 更新手牌
    public updateHandCards(data: { [viewID: number]: { handCards: number[], current: number } }): void {
        for (const viewID in data) {
            const da = data[viewID];
            let handCards = da.handCards.reverse(); // 倒序：服务器手牌是从左至右 客户端是从右至左
            if (da.current) {
                let index = handCards.indexOf(da.current);
                if (index !== -1) {
                    handCards.splice(index, 1);
                }
            }
            let handCtrl = this._handCtrl[viewID];
            if (Number(viewID) === MYSELF_VIEW_ID) {
                handCtrl.setCards(handCards, da.current);
            } else {
                handCtrl.setOtherCard(data[viewID].handCards.length, da.current);
            }
        }
    }

    // 更新摊开牌
    public updateShowCards(data: { [viewID: number]: { handCards: number[], current: number } }): void {
        for (const viewID in data) {
            const da = data[viewID];
            let handCards = da.handCards.reverse();
            let index = handCards.indexOf(da.current);
            if (index !== -1) {
                handCards.splice(index, 1);
            }
            this._handShowCtrl[viewID].setCards(handCards, da.current);
            this._handShowCtrl[viewID].current.status = Status.Lie;
            this._handCtrl[viewID].node.active = false;
            if (parseInt(viewID) === MYSELF_VIEW_ID) {
                this._handShowCtrl[MYSELF_VIEW_ID].setHandPosition();
            }
        }
    }

    // 更新弃牌
    public updateDiscard(data: { [viewID: number]: number[] }): void {
        for (const viewID in data) {
            this._discardCtrl[viewID].setCards(data[viewID]);
        }
    }

    // 获取当前弃牌
    public getCurDiscard(viewID: number): MJCard {
        return this._discardCtrl[viewID].getCurCard();
    }

    // 更新碰杠牌
    public updateWeave(data: {
        [viewID: number]: Array<{
            weaveKind?: number,
            provider?: number,
            cards?: number[],
        }>
    }): void {
        for (const viewID in data) {
            this._weaveCtrl[viewID].setWeaveItems(data[viewID]);
        }
    }

    // 显示弃牌指针
    public showDiscardPointer(viewID: number): void {
        if (viewID === -1) {
            this.curSign.active = false;
        } else {
            this._discardCtrl[viewID].setCurrent();
        }
    }

    // 恢复弃牌指针
    public recoverDiscardPointer(viewID: number): void {
        let ctrl = this._discardCtrl[viewID];
        ctrl.setCurrent();
    }

    // 玩家出牌 viewID:玩家视图ID outCard:出的牌 handCards:手牌 played_cards:已经出过的牌
    public playCard(data: { viewID: number, outCard: number, handCards: number[], handCardCount: number, played_cards: number[] }): void {
        let viewID = data.viewID;
        let ctr = this._handCtrl[viewID];
        let outMj: Node;
        let handCards: number[];
        if (viewID === MYSELF_VIEW_ID) {
            outMj = this._handCtrl[MYSELF_VIEW_ID].outMj?.node;
            this._handCtrl[MYSELF_VIEW_ID].outMj = null; // 自己出的牌置空
            if (!outMj) { // 服务器打的牌
                let index = ctr.cardData.handCard.findIndex(v => { return v === data.outCard });
                if (index !== -1) { // 打的非当前牌
                    outMj = ctr.cards[index].node;
                } else {
                    let current = this.getCurrentCard(viewID); // 当前牌
                    if (data.outCard === current.card) {
                        outMj = current.node;
                    } else {
                        console.trace(`数据异常:${data}`);
                    }
                }
            }
            handCards = data.handCards;
        } else {
            outMj = this.getCurrentCard(viewID).node;
            handCards = new Array(data.handCardCount).fill(0);
        }
        // 出牌动画
        this._outCallbackMap ?? (this._outCallbackMap = {});
        this._outCallbackMap[viewID] = {
            fallCallBack: () => {
                this.updateDiscard({ [viewID]: data.played_cards });
                this.showDiscardPointer(viewID);
                this._outCallbackMap[viewID].fallCallBack = null;
            }, outCallBack: () => {
                this.updateHandCards({ [viewID]: { handCards: handCards, current: null } });
                this._outCallbackMap[viewID].outCallBack = null;
            }
        }
        ctr.playOutCard(outMj, data.outCard, handCards, () => {
            if (this._outCallbackMap) {
                this._outCallbackMap[viewID]?.fallCallBack?.();
            }
        }, () => {
            if (this._outCallbackMap) {
                this._outCallbackMap[viewID]?.outCallBack?.();
            }
        })
    }

    // 出牌后动画回调
    private _outCallbackMap: { [viewID: number]: { fallCallBack: () => void, outCallBack: () => void } };

    // 显示操作选项（告诉玩家可以做哪些操作）optedCallback:操作请求已发送回调
    public showOperateOptions(data: IPlayerOptions[], optedCallback: (action: Action) => void): void {
        this._operateCtrl.node.active = true;
        this._operateCtrl.showOperateOptions(
            data,
            (cards: number[]) => { // 杠回调
                this._handCtrl[MYSELF_VIEW_ID].allCards.forEach(card => {
                    card.isGray = !cards.includes(card.card);
                })
                this._handCtrl[MYSELF_VIEW_ID].allCards.forEach(card => {
                    card.shoot = cards[0] === card.card; // 默认提起第一个杠
                })
                this.selectGangState(true);
            },
            (action: Action) => { // 操作请求已发送回调
                if (action !== Action.ACTION_CANCEL) {
                    this.setCanOutCard(false);
                }
                optedCallback?.(action);
            }
        )
    }

    // 隐藏操作选项
    public hideOperateOptions(): void {
        this._operateCtrl.node.active = false;;
    }

    // 播放spine 吃碰杠听胡
    public showOperate(viewID: number, action_type: OperateType): void {
        this._handCtrl.forEach(js => {
            js.outCard.node.active = false;
        });
        let skeName: string;
        if (action_type === OperateType.ACTION_PENG) {
            skeName = 'zi_peng';
        } else if (action_type === OperateType.ACTION_GANG) {
            skeName = 'zi_gang';
        } else if (action_type === OperateType.ACTION_HU) {
            skeName = 'zi_hu';
        } else if (action_type === OperateType.ACTION_ZI_MO) {
            skeName = 'zi_zimo';
        }
        this.actionAni[viewID].node.active = true;
        this.actionAni[viewID].setAnimation(0, skeName, false);
    }

    // 播放spine 抢杠胡、杠上花、杠上炮、海底捞、呼叫转移、一炮多响
    public playSpecialPaiXingSpine(viewID: number, name: string): void {
        this.specialActionAni[viewID].node.active = true;
        this.specialActionAni[viewID].setAnimation(0, name, false);
    }

    // 设置各个组件上的座位号
    public setChair(chairID: number): void {
        let viewID = this._gameClient.chair2View(chairID);
        this._handCtrl[viewID].chair = chairID;
        this._handCtrl[viewID].weaveCtrl = this._weaveCtrl[viewID];
        this._handCtrl[viewID].discardCtrl = this._discardCtrl[viewID];
        this._handShowCtrl[viewID].chair = chairID;
        this._handShowCtrl[viewID].weaveCtrl = this._weaveCtrl[viewID];
        this._handShowCtrl[viewID].discardCtrl = this._discardCtrl[viewID];
        this._weaveCtrl[viewID].chair = chairID;
        this._discardCtrl[viewID].chair = chairID;
    }

    // 设置座位 固定方向盘
    public setDirCtrlChair(chairID: number): void {
        this._dirCtrl.setChair(chairID);
    }

    // 设置当前方向盘方向 viewID：存在时改变方向 operation_time:操作时间
    public setDirCurrent(viewID: number, data?: { operation_time: number, shortTime?: number, shortTimeCallback?: (num: number) => void }): void {
        if (viewID >= 0) {
            this._dirCtrl.setCurrent(viewID);
        }
        if (data?.operation_time > 0) {
            this._dirCtrl.time = data;
        }
    }

    // 获取当前操作的玩家viewID
    public getDirCurrent(): number {
        return this._dirCtrl.current;
    }

    // 重置方向盘
    public resetDirCtrl(): void {
        this._dirCtrl.resetView();
    }

    // 发牌
    public dealTiles(hand_cards_ids: number[], bankChairID: number): void {
        let bankViewID = this._gameClient.chair2View(bankChairID);
        const len = this._handCtrl.length;
        for (let n = 0; n < len; n++) {
            const i = (bankViewID + n) % len;
            this._handCtrl[i].resetView();
            this.scheduleOnce(() => {
                this._handCtrl[i].dealTiles(hand_cards_ids, i, bankViewID);
            }, 0.2 * n);
        }
    }

    // 设置弃牌
    public setDiscard(data: { [viewID: number]: number[] }): void {
        for (const key in data) {
            this._handCtrl[key].resetOutCard();
            this._discardCtrl[key].setCards(data[key]);
        }
    }

    // 设置碰杠牌
    public setWeave(data: {
        [viewID: number]: {
            weaveKind: number,
            provider: number,
            cards: number[],
        }[]
    }) {
        for (const viewID in data) {
            this._weaveCtrl[viewID].setWeaveItems(data[viewID]);
        }
    }

    // 设置手牌位置
    public setHandPosition(): void {
        this._handCtrl[MYSELF_VIEW_ID].setHandPosition();
    }

    // 获取节点下所有的牌
    public static getMJCard(node: Node): MJCard[] {
        let cards = node.getComponentsInChildren(MJCard);
        cards.sort((a, b) => {
            return parseInt(a.node.name.slice(6)) - parseInt(b.node.name.slice(6));
        })
        return cards;
    }

    // 显示出牌提示 打哪张牌可以听牌
    public showListenCard(cards: { [out: number]: { card: number, multiple: number, count: number }[] }): void {
        // 计算胡牌数最多的牌和倍数最大的牌（支持多张并列）
        let maxCountCards: number[] = [];      // 胡牌数最多的牌
        let maxMultipleCards: number[] = [];   // 倍数最大的牌
        let maxCount = 0;                      // 最多的胡牌数
        let maxMultiple = 0;                   // 最大的倍数

        // 记录第一张牌的胡牌信息
        let firstHuInfo: { card: number, multiple: number, count: number }[] | null = null;
        let allSame = true; // 标记是否所有胡牌信息相同
        let allMultiplesSame = true; // 标记是否所有倍数相同
        let allMaxMultiplesSame = true; // 标记是否所有最大倍数相同

        let totalCounts: number[] = []; // 存储每张牌的总张数
        let maxMultiples: number[] = []; // 存储每张牌的最大倍数

        for (let outCardId in cards) {
            const huList = cards[outCardId];
            // 计算该出牌的总胡牌数和最大倍数
            let totalCount = 0;
            let maxCardMultiple = 0;
            huList.forEach(item => {
                totalCount += item.count;
                if (item.multiple > maxCardMultiple) {
                    maxCardMultiple = item.multiple;
                }
            });
            // 记录总张数
            totalCounts.push(totalCount);
            // 记录最大倍数
            maxMultiples.push(maxCardMultiple);

            // 如果是第一张牌，记录其胡牌信息
            if (firstHuInfo === null) {
                firstHuInfo = huList.map(item => ({ ...item }));
            } else {
                // 比较当前牌的胡牌信息与第一张牌的胡牌信息
                if (huList.length !== firstHuInfo.length ||
                    !huList.every((item, index) => item.card === firstHuInfo[index].card &&
                        item.multiple === firstHuInfo[index].multiple &&
                        item.count === firstHuInfo[index].count)) {
                    allSame = false; // 如果有不同，标记为不相同
                }
                // 检查倍数是否相同
                if (huList.some((item, index) => !!firstHuInfo[index] && item.multiple !== firstHuInfo[index].multiple)) {
                    allMultiplesSame = false;
                }
            }
            // 找出胡牌数最多的牌（支持并列）
            if (totalCount > maxCount) {
                maxCount = totalCount;
                maxCountCards = [parseInt(outCardId)];
            } else if (totalCount === maxCount) {
                maxCountCards.push(parseInt(outCardId));
            }
            // 找出倍数最大的牌（支持并列）
            if (maxCardMultiple > maxMultiple) {
                maxMultiple = maxCardMultiple;
                maxMultipleCards = [parseInt(outCardId)];
            } else if (maxCardMultiple === maxMultiple) {
                maxMultipleCards.push(parseInt(outCardId));
            }
        }
        // 检查总张数是否相同
        const firstTotalCount = totalCounts[0];
        const allCountsSame = totalCounts.every(count => count === firstTotalCount);

        // 检查所有最大倍数是否相同
        const firstMaxMultiple = maxMultiples[0];
        allMaxMultiplesSame = maxMultiples.every(multiple => multiple === firstMaxMultiple);

        // 根据不同情况显示听牌提示
        let finalMaxMultipleCards = maxMultipleCards, // 倍数最大的牌
            finalMaxCountCards = maxCountCards; // 胡牌数最多的牌
        if (allSame) {
            finalMaxMultipleCards.length = 0;
            finalMaxCountCards.length = 0;
        }
        if (allMultiplesSame || allMaxMultiplesSame) {
            finalMaxMultipleCards.length = 0;
        }
        if (allCountsSame) {
            finalMaxCountCards.length = 0;
        }
        this._handCtrl[MYSELF_VIEW_ID].showListenCard(cards, finalMaxCountCards, finalMaxMultipleCards);
    }

    // 清除出牌提示
    public clearListenCard(): void {
        this._handCtrl[MYSELF_VIEW_ID].clearListenCard();
    }

    // 显示相同的牌
    public showSameCard(card: number) {
        let cards: MJCard[] = [];
        this._discardCtrl.forEach(js => {
            if (!js.node.active) return;
            cards.push(...js.cards);
        });
        this._weaveCtrl.forEach(js => {
            if (!js.node.active) return;
            js.weaveItems.forEach(item => {
                if (!item.node.active) return;
                cards.push(...item.cards);
            });
        });
        cards.push(...this._handCtrl[MYSELF_VIEW_ID].allCards);
        cards.forEach(js => {
            js.isSelect = (js.card == card && js.node.active && js.node.parent.active);
        });
    }

    // 重置view
    public resetView(): void {
        if (!this._init) return;
        this.unscheduleAllCallbacks();
        this._dirCtrl.resetView();
        this._exchange.resetView();
        this._dingque.resetView();
        this._discardCtrl.forEach(js => js.resetView());
        this._weaveCtrl.forEach(js => js.resetView());
        this._handCtrl.forEach(js => {
            js.resetView();
            js.node.active = false;
        })
        this._handShowCtrl.forEach(js => {
            js.resetView();
            js.node.active = false;
        })
        this.$('_out').children.forEach(node => {
            Tween.stopAllByTarget(node);
            node.active = false;
        })
        this.curSign.active = false;
        this._listenTips.node.active = false;
        this._operateCtrl.node.active = false;
        this._exchange.node.active = false;
        this._dingque.node.active = false;
        this.setCanOutCard(false);

        this._outCallbackMap = null;
    }

    /****************************** 外部接口 end ******************************/

}
