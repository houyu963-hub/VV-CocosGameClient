import { _decorator, Color, Font, Label, Layout, Node, sp, Sprite, Tween, tween, UIOpacity, v3 } from 'cc';
import { MYSELF_VIEW_ID } from 'db://assets/common/script/GameClient';
import ActiveNode from 'db://assets/frame/component/ActiveNode';
import List from 'db://assets/frame/component/List';
import vv from 'db://assets/frame/Core';
import BaseClass from 'db://assets/frame/ui/BaseClass';
import PopupBase from 'db://assets/frame/ui/PopupBase';
import { PopupName } from 'db://assets/frame/ui/PopupConfig';
import { Battle, Enum } from 'db://assets/resources/pbjs';
import MahjongSound from '../MahjongSound';

interface ListItemData {
    type: string,            // 类型
    score: number,           // 分数
    seat: string,            // 座位
    huTypes?: string,        // 胡牌类型
    isCapped?: boolean,      // 是否被封杠
    extraFanTypes?: number[],// 加番类型
    huMultiplier?: number,   // 胡牌/点炮倍率
}

interface PopupData {
    data: Battle.INotifySettlement,
    roomInfo: Enum.IRoomInfo,
    publicInfo: Battle.IRoomPublicInfo,
    nextCallback: () => void,
    leaveCallback: () => void,
    backCallback: () => void
}

const { ccclass, property } = _decorator;

@ccclass
export class MahjongResult extends PopupBase<PopupData> {
    @property({ type: Font }) win_font: Font;
    @property({ type: Font }) lose_font: Font;

    private _win_color: Color = new Color('FFE68E');
    private _lose_color: Color = new Color('8FC8E6');

    private ske_win: sp.Skeleton;
    private ske_lose: sp.Skeleton;

    private ske_win_hua: sp.Skeleton;
    private ske_lose_hua: sp.Skeleton;

    protected onLoad(): void {
        this.ske_win = this.$('_ske_win_ren', sp.Skeleton);
        this.ske_win.setCompleteListener(() => {
            this.ske_win.node.active = true;
            this.ske_win.setAnimation(0, 'cj_sj_ren_sl', true);
        })
        this.ske_lose = this.$('_ske_lose_ren', sp.Skeleton);
        this.ske_lose.setCompleteListener(() => {
            this.ske_lose.node.active = true;
            this.ske_lose.setAnimation(0, 'cj_sj_ren_sb', true);
        })
        this.ske_win_hua = this.$('_ske_win_huaban', sp.Skeleton);
        this.ske_lose_hua = this.$('_ske_lose_huaban', sp.Skeleton);

        this.$('_backTable').on(Node.EventType.TOUCH_START, this.onBeginTapped, this);
        this.$('_backTable').on(Node.EventType.TOUCH_CANCEL, this.onEndTapped, this);
        this.$('_backTable').on(Node.EventType.TOUCH_END, this.onEndTapped, this);
    }

    protected onEnable(): void {
        this.$('_backTable').on(Node.EventType.TOUCH_START, this.onBeginTapped, this);
        this.$('_backTable').on(Node.EventType.TOUCH_CANCEL, this.onEndTapped, this);
        this.$('_backTable').on(Node.EventType.TOUCH_END, this.onEndTapped, this);
    }

    protected onDisable(): void {
        this.restView();
    }

    protected onShow(options: PopupData): void {
        let players = options.data.AllPlayers;
        for (let i = 0; i < players.length; i++) {
            let chairID = players[i].SeatID;
            let viewID = vv.memmory.gameClient.chair2View(chairID);
            let p = players[i];
            let ts = this.$('_players').children[viewID].getComponent(BaseClass);
            // vv.utils.loadAvatarSprite(p.head_url, this.$('_avatar', Sprite));
            ts.$('_nickName', Label).string = p.PlayerName;

            let isWin = p.ScoreChange >= 0;
            ts.$('_score', Label).string = isWin ? ('+' + p.ScoreChange) : p.ScoreChange.toString();
            ts.$('_score', Label).font = isWin ? this.win_font : this.lose_font;
            if (viewID === MYSELF_VIEW_ID) { // 自己
                this.$('_ActiveNode', ActiveNode).index = isWin ? 0 : 1;
                if (isWin) {
                    MahjongSound.playEffect(MahjongSound.soundList.shengli);
                    this.ske_win.node.active = true;
                    this.ske_win.setAnimation(0, 'cj_sj_ren_slcx', false);

                    this.ske_win_hua.node.active = true;
                    this.ske_win_hua.setAnimation(0, 'cj_sl_hb', true);
                } else {
                    MahjongSound.playEffect(MahjongSound.soundList.shibai);
                    this.ske_lose.node.active = true;
                    this.ske_lose.setAnimation(0, 'cj_sj_ren_sbcx', false);

                    this.ske_lose_hua.node.active = true;
                    this.ske_lose_hua.setAnimation(0, 'cj_sb_hb', true);
                }
            }
        }
        this.setSelfSettlementDetails();
        let isGoldRoom = options.roomInfo.RoomType === vv.pb.Enum.RoomType.ROOM_TYPE_GOLD;
        if (isGoldRoom) { // 金币房间
            this.$('_btBack').active = false;
            this.$('_Layput').active = true;
        } else { // 房卡房间
            let roundCount = options.roomInfo.RuleConfig.BaseConfig.RoundCount;
            let currentRound = options.publicInfo.CurrentRound;
            let isMaxRound = currentRound === roundCount; // 是否打完最大局数
            this.$('_btBack').active = isMaxRound;
            this.$('_Layput').active = !isMaxRound;
        }
    }

    // 自己流水明细
    private setSelfSettlementDetails(): void {
        // 具体得分项
        let mySettlement = this.options.data.MySettlement;
        let listData: ListItemData[] = [];
        let huRecords = mySettlement.HuRecords; // 胡牌结算单列表
        huRecords.forEach(record => {
            let winSeat = this.getSeatString([record.TargetPlayerID]); // 该条明细赢家
            let loseIds: string[] = [];
            record.ScoreParts.forEach(v => {
                if (v.Score < 0) {
                    loseIds.push(v.PlayerID);
                }
            })
            let loserSeat = this.getSeatString(loseIds); // 该条明细输家
            let selfSocre = record.ScoreParts.find(v => { return v.PlayerID === mySettlement.AccountID }).Score; // 该条明细中自己得分
            if (record.TargetPlayerID === mySettlement.AccountID) { // 自己赢了
                let type: string;
                if (record.IsChaJiao) {
                    type = '查叫';
                } else {
                    type = record.IsZimo ? '自摸' : '胡牌';
                }
                let itme: ListItemData = {
                    type: type,
                    score: selfSocre,
                    seat: loserSeat,
                    huTypes: this.getHuTypeStr(record.HuTypes, record.ExtraFanTypes),
                    isCapped: record.IsCapped,
                    extraFanTypes: record.ExtraFanTypes,
                    huMultiplier: record.HuMultiplier
                };
                listData.push(itme);
            } else {
                // 自己输了
                let type: string;
                if (record.IsChaJiao) {
                    type = '被查叫';
                } else {
                    type = record.IsZimo ? '被自摸' : '点炮';
                }
                let itme: ListItemData = {
                    type: type,
                    score: selfSocre,
                    seat: winSeat,
                    huTypes: this.getHuTypeStr(record.HuTypes, record.ExtraFanTypes),
                    isCapped: record.IsCapped,
                    extraFanTypes: record.ExtraFanTypes,
                    huMultiplier: record.HuMultiplier
                };
                listData.push(itme);
            }
        })
        let gangRecords = mySettlement.GangRecords; // 杠牌结算单列表
        gangRecords.forEach(record => {
            let winSeat = this.getSeatString([record.TargetPlayerID]); // 该条明细赢家
            let loseIds: string[] = [];
            record.ScoreParts.forEach(v => {
                if (v.Score < 0) {
                    loseIds.push(v.PlayerID);
                }
            })
            let loserSeat = this.getSeatString(loseIds); // 该条明细输家

            let provider: string; // 杠提供者
            let score: number = Infinity; // 杠提供者输的杠分
            record.ScoreParts.forEach(v => {
                if (v.Score < score) {
                    score = v.Score;
                    provider = v.PlayerID;
                }
            })
            score = Math.abs(score);
            let selfSocre = record.ScoreParts.find(v => { return v.PlayerID === mySettlement.AccountID }).Score; // 该条明细中自己得分
            if (record.TargetPlayerID === mySettlement.AccountID) { // 自己是杠牌者
                if (record.GangType === vv.pb.Enum.StackType.STACK_TYPE_AN_GANG) { // 暗杠
                    let itme: ListItemData = {
                        type: '下雨',
                        score: selfSocre,
                        seat: loserSeat,
                    };
                    listData.push(itme);
                } else if (record.GangType === vv.pb.Enum.StackType.STACK_TYPE_DIAN_GANG) { // 点杠
                    let itme: ListItemData = { // 提供杠牌的人显示下雨
                        type: '下雨',
                        score: score,
                        seat: this.getSeatString([provider]),
                    };
                    listData.push(itme);

                    // 非提供杠牌的人显示刮风
                    let other = loseIds.filter(v => { return v !== provider });
                    if (other.length > 0) {
                        let itme2: ListItemData = {
                            type: '刮风',
                            score: selfSocre - score,
                            seat: this.getSeatString(other),
                        };
                        listData.push(itme2);
                    }
                } else { // 巴杠
                    let itme: ListItemData = {
                        type: '刮风',
                        score: selfSocre,
                        seat: loserSeat,
                    };
                    listData.push(itme);
                }
            } else {
                // 自己输
                if (record.GangType === vv.pb.Enum.StackType.STACK_TYPE_AN_GANG) { // 暗杠
                    let itme: ListItemData = {
                        type: '被下雨',
                        score: selfSocre,
                        seat: winSeat,
                    };
                    listData.push(itme);
                } else if (record.GangType === vv.pb.Enum.StackType.STACK_TYPE_DIAN_GANG) { // 点杠
                    if (provider === mySettlement.AccountID) {
                        let itme: ListItemData = {
                            type: '被下雨',
                            score: selfSocre,
                            seat: winSeat,
                        };
                        listData.push(itme);
                    } else {
                        let itme: ListItemData = {
                            type: '被刮风',
                            score: selfSocre,
                            seat: winSeat,
                        };
                        listData.push(itme);
                    }
                } else { // 巴杠
                    let itme: ListItemData = {
                        type: '被刮风',
                        score: selfSocre,
                        seat: winSeat,
                    };
                    listData.push(itme);
                }
            }
        })
        let data = this.mergedData(listData); // 合并 listData 相同数据
        this.$('_detailsList', List).setList(data, (js, da, index, node) => {
            js.$('_text', Label).string = da.type;
            if (da.huTypes) { // 胡牌
                js.$('_isCapped').active = !!da.isCapped; // 是否封顶
                js.$('_huMultiplier', Label).string = `${da.huMultiplier}倍`; // 番数
                if ((da.type.length + da.huTypes.length) > 8) {
                    js.$('_btMore').active = true;
                    js.$('_huTypes', Label).string = `(${da.huTypes.slice(0, 5)}...`;
                } else {
                    js.$('_btMore').active = false;
                    js.$('_huTypes', Label).string = `(${da.huTypes})`;
                }
            } else { // 不是胡牌的加分项
                js.$('_isCapped').active = false;
                js.$('_btMore').active = false;
                js.$('_huTypes', Label).string = '';
                js.$('_huMultiplier', Label).string = '';
            }
            js.$('_typeLayout', Layout).updateLayout();
            js.$('_seat', Label).string = da.seat;
            js.$('_settlementScore', Label).string = da.score > 0 ? `+${da.score}` : da.score.toString();
            if (da.score > 0) {
                js.$('_text', Label).color = this._win_color;
                js.$('_huTypes', Label).color = this._win_color;
                js.$('_seat', Label).color = this._win_color;
                js.$('_huMultiplier', Label).color = this._win_color;
                js.$('_settlementScore', Label).color = this._win_color;
            } else {
                js.$('_text', Label).color = this._lose_color;
                js.$('_huTypes', Label).color = this._lose_color;
                js.$('_seat', Label).color = this._lose_color;
                js.$('_huMultiplier', Label).color = this._lose_color;
                js.$('_settlementScore', Label).color = this._lose_color;
            }
        })
    }

    // 合并 listData 相同数据
    private mergedData(listData: ListItemData[]): ListItemData[] {
        const mergedData = [];
        const map = new Map();
        const filter = ['自摸', '胡牌', '被自摸', '点炮', '查叫', '被查叫']; // 不合并项
        listData.forEach(item => {
            const key = item.type; // 用 type 作为 key
            if (map.has(key) && !filter.includes(item.type)) {
                const existingItem = map.get(key);
                existingItem.count = (existingItem.count || 1) + 1;
                existingItem.seat += `,${item.seat}`;
                existingItem.score += item.score;
            } else {
                const newItem = { ...item, count: 1 };
                map.set(key, newItem);
                mergedData.push(newItem);
            }
        })
        // 处理显示文本
        mergedData.forEach(item => {
            if (item.count > 1) {
                item.type = `${item.type} x${item.count}`;
            }
            const seatSet = new Set(item.seat.split(','));
            item.seat = Array.from(seatSet).join(',');
        })
        // 排序逻辑
        mergedData.sort((a, b) => {
            // 赢分的排序
            if (a.score > 0 && b.score > 0) {
                // 都是赢分，按优先级排序
                return this.getWinPriority(a.type) - this.getWinPriority(b.type);
            } else if (a.score < 0 && b.score < 0) {
                // 都是输分，按优先级排序
                return this.getLosePriority(a.type) - this.getLosePriority(b.type);
            } else {
                // 赢分在前
                return b.score - a.score;
            }
        })
        return mergedData;
    }

    // 获取赢分优先级
    private getWinPriority(type: string): number {
        if (type.includes('自摸')) return 1; // 胡
        if (type.includes('胡牌')) return 2; // 胡
        if (type.includes('下雨')) return 3; // 杠
        if (type.includes('刮风')) return 4; // 杠
        if (type.includes('查叫')) return 5; // 查觉
        return 5; // 默认优先级
    }

    // 获取输分优先级
    private getLosePriority(type: string): number {
        if (type.includes('被自摸')) return 1; // 被胡
        if (type.includes('点炮')) return 2;   // 被胡
        if (type.includes('被下雨')) return 3; // 被杠
        if (type.includes('被刮风')) return 4; // 被杠
        if (type.includes('被查叫')) return 5; // 被查觉
        return 5; // 默认优先级
    }

    // 获取座位
    private getSeatString(accountIDList: string[]): string {
        let result = [];
        let players = this.options.roomInfo.Players;
        accountIDList.forEach(id => {
            let player = players.find(v => { return v.AccountID === id });
            if (player) {
                let viewID = vv.memmory.gameClient.chair2View(player.SeatNumber);
                result.push(['自己', '下家', '对家', '上家'][viewID]);
            }
        })
        return result.toString();
    }

    /**
     * 获取胡类型
     * @param huTypes 
     * @returns string
     */
    private getHuTypeStr(huTypes: Enum.HuCardType[], extraFanType: Enum.ExtraFanType[]): string {
        const hasFan = (type: Enum.ExtraFanType) => extraFanType.includes(type);
        const FAN = vv.pb.Enum.ExtraFanType;
        // 天胡、地胡不展示其他
        if (hasFan(FAN.EXTRA_FAN_TYPE_TIAN_HU)) {
            return '天胡';
        } else if (hasFan(FAN.EXTRA_FAN_TYPE_DI_HU)) {
            return '地胡';
        }

        const res: string[] = [];
        const has = (type: Enum.HuCardType) => huTypes.includes(type);
        const HU = vv.pb.Enum.HuCardType;
        let gangCount = huTypes.filter(type => type === vv.pb.Enum.HuCardType.HU_CARD_TYPE_GANG).length; // 统计根的数量

        let JIANG_DUI_USED = false, // 是否使用了将对
            DAI_YAO_JIU = false,    // 是否使用了带幺九
            JIN_GOU_DIAO = false;   // 是否使用了金钩钓
        // 组合规则判断
        if (has(HU.HU_CARD_TYPE_QING_YI_SE)) {
            // 清一色系列
            if (has(HU.HU_CARD_TYPE_AN_QI_DUI) && has(HU.HU_CARD_TYPE_GANG)) {
                res.push('清龙七对');
                // 清龙7对使用了一个根
                gangCount -= 1;
            } else if (has(HU.HU_CARD_TYPE_AN_QI_DUI)) {
                res.push('清七对');
            } else if (has(HU.HU_CARD_TYPE_DUI_DUI_HU)) {
                res.push('清对');
            } else if (has(HU.HU_CARD_TYPE_JIN_GOU_DIAO)) {
                res.push('清金钩');
                JIN_GOU_DIAO = true;
            } else if (has(HU.HU_CARD_TYPE_DAI_YAO_JIU)) {
                res.push('清带幺');
                DAI_YAO_JIU = true;
            } else {
                res.push('清一色');
            }
        } else {
            // 七对系列
            if (has(HU.HU_CARD_TYPE_AN_QI_DUI)) {
                if (has(HU.HU_CARD_TYPE_GANG)) { // 带根
                    if (has(HU.HU_CARD_TYPE_JIANG_DUI)) {
                        res.push('将龙七对');
                        JIANG_DUI_USED = true;
                    } else {
                        res.push('龙七对');
                    }
                    gangCount -= 1;
                } else { // 不带根
                    if (has(HU.HU_CARD_TYPE_JIANG_DUI)) {
                        res.push('将七对');
                        JIANG_DUI_USED = true;
                    } else {
                        res.push('七对');
                    }
                }
            }
        }
        // 其他系列
        if (has(HU.HU_CARD_TYPE_JIANG_DUI)) {
            if (!JIANG_DUI_USED) {
                res.push('将对');
                JIANG_DUI_USED = true;
            }
        } else if (has(HU.HU_CARD_TYPE_DUI_DUI_HU)) {
            !JIANG_DUI_USED && res.push('对对胡');
        }
        if (has(HU.HU_CARD_TYPE_DAI_YAO_JIU)) {
            !DAI_YAO_JIU && res.push('带幺九');
        } else if (has(HU.HU_CARD_TYPE_DUAN_YAO_QIU)) {
            res.push('断幺九');
        }
        if (has(HU.HU_CARD_TYPE_JIN_GOU_DIAO)) {
            !JIN_GOU_DIAO && res.push('金钩钓');
        }
        // 独立系列
        if (has(HU.HU_CARD_TYPE_JIA_XIN_WU)) {
            res.push('夹心五');
        }
        if (has(HU.HU_CARD_TYPE_YI_TIAO_LONG)) {
            res.push('一条龙');
        }
        if (has(HU.HU_CARD_TYPE_MEN_QING)) {
            res.push('门清');
        }
        if (has(HU.HU_CARD_TYPE_PING_HU)) {
            res.length === 0 && res.push('平胡');
        }
        if (gangCount > 0) {
            res.push(`根x${gangCount}`);
        }

        if (hasFan(FAN.EXTRA_FAN_TYPE_HAI_DI)) {
            res.push('海底');
        }
        if (hasFan(FAN.EXTRA_FAN_TYPE_QIANG_GANG)) {
            res.push('抢杠');
        }
        if (hasFan(FAN.EXTRA_FAN_TYPE_GANG_SHANG_HUA)) {
            res.push('杠上花');
        }
        if (hasFan(FAN.EXTRA_FAN_TYPE_GANG_SHANG_PAO)) {
            res.push('杠上炮');
        }
        if (hasFan(FAN.EXTRA_FAN_TYPE_ZI_MO)) {
            // res.push('自摸');
        }
        return res.join('、');
    }

    // 点击返回牌桌
    private onBeginTapped(): void {
        let uiOpacity = this.$('_result').getComponent(UIOpacity);
        Tween.stopAllByTarget(uiOpacity);
        tween(uiOpacity)
            .to(0.2, { opacity: 0 })
            .start();
    }

    // 点击返回牌桌End
    private onEndTapped(): void {
        let uiOpacity = this.$('_result').getComponent(UIOpacity);
        Tween.stopAllByTarget(uiOpacity);
        tween(uiOpacity)
            .to(0.2, { opacity: 255 })
            .start()
    }

    // 点击更多
    private _onBtMore(event: TouchEvent): void {
        let target = event.target as unknown as Node;
        let js = this.getJs(target, 1);
        let node = this.$('_moreTips');
        node.active = true;
        this.$('_btCloseMore').active = true;
        let local = vv.utils.convertLocation(target, node.parent);
        node.setPosition(v3(local.x - 45, local.y - 20));

        let data: ListItemData = this.getData(js);
        if (data.huTypes) {
            this.$('_moreText', Label).string = `${data.type} (${data.huTypes})`;
        } else {
            this.$('_moreText', Label).string = data.type;
        }
    }

    // 点击离开
    private _onBtLeave(): void {
        this.options.leaveCallback?.();
    }

    // 点击下一局
    private _onBtNext(): void {
        this.close();
        this.options.nextCallback?.();
    }

    // 点击返回
    private _onBtBack(): void {
        this.close();
        vv.ui.open(PopupName.MahjongResultAll, { callback: this.options.backCallback });
    }

    // 点击关闭更多牌型tips
    private _onBtCloseMore(): void {
        this.$('_moreTips').active = false;
        this.$('_btCloseMore').active = false;
    }

    // 重置UI
    private restView(): void {
        this.$('_players').children.forEach(p => {
            let ts = p.getComponent(BaseClass);
            ts.$('_avatar', Sprite).spriteFrame = null;
            ts.$('_nickName', Label).string = '';
            ts.$('_score', Label).string = '';
        })
        this.$('_detailsList').children.forEach(v => {
            v.active = false;
        })
        let uiOpacity = this.$('_result').getComponent(UIOpacity);
        Tween.stopAllByTarget(uiOpacity);
        uiOpacity.opacity = 255;

        this.ske_win.node.active = false;
        this.ske_lose.node.active = false;
        this.ske_win_hua.node.active = false;
        this.ske_lose_hua.node.active = false;
        this.$('_ActiveNode', ActiveNode).index = -1;
        this.$('_moreTips').active = false;
        this.$('_btCloseMore').active = false;
    }
}
