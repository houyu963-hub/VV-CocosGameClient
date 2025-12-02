import { _decorator, Layout, Node } from "cc";
import ActiveSprite from "db://assets/frame/component/ActiveSprite";
import List from "db://assets/frame/component/List";
import vv from "db://assets/frame/Core";
import BaseClass from "db://assets/frame/ui/BaseClass";
import MJCard from "./MJCard";
import WeaveItem from "./WeaveItem";

export enum Action {
    ACTION_PENG = 3,              // 碰：当其他玩家打出与自己手牌相同的牌时可以碰
    ACTION_GANG = 4,              // 杠：明杠（碰后杠）、暗杠（自摸四张）、续明杠
    ACTION_HU = 6,                // 胡：自摸胡牌或点炮胡牌
    ACTION_CANCEL = -2            // 过：放弃当前可执行的操作
}

export interface IPlayerOptions {
    Action: number;
    TargetCard: number;
    Cards: number[];
}

const { ccclass, property } = _decorator;

/**
 * 玩家操作按钮制脚本
 */
@ccclass
export default class Operate extends BaseClass {
    private _gangOption: IPlayerOptions[];
    private _gangCallback: (cards: number[]) => void;
    private _optedCallback: (action: Action) => void;

    // 收到玩家操作通知
    public showOperateOptions(data: IPlayerOptions[], gangCallback: (cards: number[]) => void, optedCallback: (action: Action) => void): void {
        this._gangCallback = gangCallback;
        this._optedCallback = optedCallback;
        // 显示目标牌
        this.$('_MJCard', MJCard).card = data[0].TargetCard;
        this._gangOption = data.filter(v => { return v.Action === Action.ACTION_GANG });
        data = data.filter(v => { return v.Action !== Action.ACTION_GANG });
        if (this._gangOption.length > 0) { // 只保留一个杠操作
            data.push(this._gangOption[0]);
            if (this._gangOption.length > 1) {
                this.$('_MJCard', MJCard).card = -1; // 多个杠操作时 隐藏目标牌
            }
        }
        // 显示有操作按钮
        this.$('_optList', List).setList(data, (js, da, index, node) => {
            let activeSprite = node.getComponent(ActiveSprite);
            activeSprite.index = da.Action - 3; // 服务器传过来的操作类型 3：碰 4：杠 5：抢杠 6：胡
        })
        // 显示操作的具体的牌
        let opts = data.filter(v => { return v.Action !== Action.ACTION_CANCEL }); // 排除过操作
        this.$('_weaveList', List).setList(opts, (js, da, index, node) => {
            let weaveItem = node.getComponent(WeaveItem);
            let data = {
                weaveKind: da.Action,
                provider: undefined,
                cards: da.Cards
            }
            // weaveItem.setWeave(data);
        })
        this.$('_Layout', Layout).updateLayout();
    }

    // 点击碰杠胡按钮
    private _onBtOperate(event: TouchEvent): void {
        let node = event.target as unknown as Node;
        let data: IPlayerOptions = this.getCustomData(node);
        if (data.Action === Action.ACTION_GANG && this._gangOption.length > 1) {
            // 杠操作有多个,需要选择一个杠牌操作
            let shoot = this._gangOption.map(v => { return v.TargetCard });
            this._gangCallback(shoot);
        } else {
            this.send(data);
        }
    }

    // 点击过
    private _onBtPass(event: TouchEvent): void {
        let data: IPlayerOptions = { Action: Action.ACTION_CANCEL, TargetCard: 0, Cards: [] };
        this.send(data);
    }

    // 发送操作
    private send(options: IPlayerOptions): void {
        this.node.active = false;
        let _proxy = vv.memmory.gameClient._proxy;
        if (_proxy && _proxy.reqPlayerAction) {
            this._optedCallback?.(options.Action);
            _proxy.reqPlayerAction(options, (success: boolean) => {
                if (!success) {
                    this.node.active = true;
                }
            });
        }
    }
}
