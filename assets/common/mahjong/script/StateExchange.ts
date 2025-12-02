import { _decorator, Label, sp } from 'cc';
import HandCtrl from 'db://assets/common/mahjong/script/HandCtrl';
import { MYSELF_VIEW_ID } from 'db://assets/common/script/GameClient';
import Timer from 'db://assets/frame/component/Timer';
import vv from 'db://assets/frame/Core';
import BaseClass from 'db://assets/frame/ui/BaseClass';
const { ccclass } = _decorator;

/**
 * 换牌状态 换牌界面
 */
@ccclass
export class StateExchange extends BaseClass {
    public handCtrl: HandCtrl;

    // 进入换牌阶段 timeoutSeconds:剩余时间s
    public enterExchangeState(resTimestamp: number): void {
        this.$('_exchangeNode').active = true;
        // 倒计时
        if (resTimestamp > 0) {
            let timer = this.$('_timer', Timer)
            timer.startTimer(resTimestamp, () => {
                timer.node.getComponent(Label).string = resTimestamp + 's';
            }, (current: string) => {
                let num = Number(current);
                timer.node.getComponent(Label).string = `(${vv.utils.padNumberWithZeros(2, num)})`;
            })
        }
    }

    // 显示其他玩家换牌中
    public showOtherExchange(boo: boolean): void {
        this.$('_otherExchange').active = boo;
    }

    // 更新换牌进度 viewIDs:已换牌的viewID
    public updateExchangeProgress(viewIDs: number[]): void {
        viewIDs.forEach(viewID => {
            this.$('_items').children[viewID].active = true; // 显示出牌墩
            this.$('_otherExchange').children[viewID].active = false;
            if (viewID === MYSELF_VIEW_ID) {
                this.$('_exchangeNode').active = false;
            }
        })
    }

    // 播放动画 0:对家交换 1：逆时针交换 2：顺时针交换
    public palyAni(type: number, callback: () => void): void {
        let aniName = '';
        switch (type) {
            case 0:
                aniName = 'huanpai_duijia';
                break;
            case 1:
                aniName = 'huanpai_ni';
                break;
            case 2:
                aniName = 'huanpai_shun';
                break;
            default:
                break;
        }
        let ske = this.$('_ske_huanpai', sp.Skeleton);
        ske.node.active = true;
        ske.setAnimation(0, aniName, false);
        ske.setCompleteListener(() => {
            ske.setCompleteListener(null);
            callback();
        });
    }

    // 重置view
    public resetView(): void {
        this.$('_items').children.forEach((item) => {
            item.active = false;
        });
        this.$('_ske_huanpai').active = false;
        this.$('_exchangeNode').active = false;
        this.$('_otherExchange').active = false;
    }

    // 点击换牌
    private _onBtExchange(): void {
        let shoot = this.handCtrl.allCards.filter(v => { return v.shoot });
        let cards = shoot.map(v => { return v.card });
        let param = {
            ExchangeCards: cards,
        }
        let _proxy = vv.memmory.gameClient._proxy;
        if (_proxy && _proxy.reqExchange) {
            _proxy.reqExchange(param, (succes: boolean) => {
                if (succes) {
                    shoot.forEach(v => v.node.active = false);
                    let cardData = this.handCtrl.cardData;
                    this.handCtrl.setCards(cardData.handCard, cardData.currentCard); // 更新手牌
                }
            })
        }
    }
}