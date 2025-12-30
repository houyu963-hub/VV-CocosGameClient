import { _decorator, EditBox, instantiate, Label, Prefab, sp, sys, Tween, tween, UIOpacity, UITransform, v3, Vec3 } from "cc";
import MahjongCtrl from "db://assets/common/mahjong/script/MahjongCtrl";
import { Action } from "db://assets/common/mahjong/script/Operate";
import GameClient, { MYSELF_VIEW_ID } from "db://assets/common/script/GameClient";
import RoomModel from "db://assets/common/script/RoomModel";
import Timer from "db://assets/frame/component/Timer";
import { ChannelConfig } from "db://assets/frame/config/ChannelConfig";
import { PopupName } from "db://assets/frame/ui/PopupConfig";
import SceneNavigator from "db://assets/frame/ui/SceneNavigator";
import { Battle, Enum, Match } from "db://assets/resources/pbjs";
import vv from "../../../frame/Core";
import MahjongModel from "./MahjongModel";
import { MahjongNotify } from "./MahjongNotify";
import { MahjongProxy } from "./MahjongProxy";
import MahjongSound from "./MahjongSound";
import { MahjongCoinFlow } from "./component/MahjongCoinFlow";
import { DissolvePopupType } from "./component/MahjongDissolve";
import { MahjongPlayer } from "./component/MahjongPlayer";

// 游戏暂停原因
enum PausedReason {
    Offline, // 玩家离线
    Dissolve // 投票解散
}

const { ccclass, property } = _decorator;
@ccclass
export default class Mahjong extends GameClient {
    @property({ type: Prefab, tooltip: '麻将牌桌预制体' }) mahjongCtrlPrefab: Prefab = null;

    private _model: MahjongModel;
    private _proxy: MahjongProxy;
    private _mahjongCtrl: MahjongCtrl;

    protected onLoad(): void {
        super.onLoad();
        MahjongSound.playMusic(); // 播放背景音乐

        this._model = MahjongModel.instance; // 数据模型
        this._proxy = MahjongProxy.instance; // 请求代理

        let node = instantiate(this.mahjongCtrlPrefab); // 实例化麻将控制节点
        node.parent = this.$('_game');
        this._mahjongCtrl = node.getComponent(MahjongCtrl);

        this.onEvent();
    }

    protected onDestroy(): void {
        super.onDestroy();
        MahjongSound.stopAllSound();
        vv.event.removeAllByTarget(this);
        this._model.clear();
    }

    // 注册事件
    private onEvent(): void {
        vv.event.on(MahjongNotify.onRspRejoinRoomBattle, this.onRspRejoinRoomBattle, this);            // 响应重连战斗结果
        vv.event.on(MahjongNotify.onNotifyPlayerJoined, this.onNotifyPlayerJoined, this);              // 通知玩家加入房间
        vv.event.on(MahjongNotify.onNotifyPlayerLeft, this.onNotifyPlayerLeft, this);                  // 通知玩家离开房间
        vv.event.on(MahjongNotify.onNotifyPlayerReadyStatus, this.onNotifyPlayerReadyStatus, this);    // 通知玩家准备
        // vv.event.on(MahjongNotify.onPlayerOffline, this.onPlayerOffline, this);             // 玩家离线
        vv.event.on(MahjongNotify.onNotifyPlayerVote, this.onNotifyPlayerVote, this);                  // 通知玩家投票解散房间
        vv.event.on(MahjongNotify.onNotifyRoomDissolved, this.onNotifyRoomDissolved, this);            // 通知房间解散
        vv.event.on(MahjongNotify.onNotifyPlayerItemChange, this.onNotifyPlayerItemChange, this);      // 通知物品更新

        vv.event.on(MahjongNotify.onNotifyGamePhase, this.onNotifyGamePhase, this);                    // 通知游戏状态
        vv.event.on(MahjongNotify.onNotifyGameStart, this.onNotifyGameStart, this);                    // 通知游戏开始
        vv.event.on(MahjongNotify.onNotifyHandCards, this.onNotifyHandCards, this);                    // 通知玩家手牌
        vv.event.on(MahjongNotify.onNotifyWeaveCards, this.onNotifyWeaveCards, this);                  // 通知玩家碰杠牌
        vv.event.on(MahjongNotify.onNotifyPlayerPlayedCards, this.onNotifyPlayerPlayedCards, this);    // 通知玩家已出牌
        vv.event.on(MahjongNotify.onNotifyExchangeSelected, this.onNotifyExchangeSelected, this);      // 通知换牌选择进度
        vv.event.on(MahjongNotify.onNotifyExchangeComplete, this.onNotifyExchangeComplete, this);      // 通知换牌完成
        vv.event.on(MahjongNotify.onNotifyDingqueSelected, this.onNotifyDingqueSelected, this);        // 通知定缺选择进度
        vv.event.on(MahjongNotify.onNotifyDingqueComplete, this.onNotifyDingqueComplete, this);        // 通知定缺完成
        vv.event.on(MahjongNotify.onNotifyCurrentPlayer, this.onNotifyCurrentPlayer, this);            // 通知当前玩家
        vv.event.on(MahjongNotify.onNotifyDrawCard, this.onNotifyDrawCard, this);                      // 摸牌通知（服务器自动摸牌后推送）
        vv.event.on(MahjongNotify.onNotifyPlayerOptions, this.onNotifyPlayerOptions, this);            // 操作选项通知（告诉玩家可以做哪些操作）
        vv.event.on(MahjongNotify.onNotifyPlayerAction, this.onNotifyPlayerAction, this);              // 玩家操作通知
        vv.event.on(MahjongNotify.onNotifyTingInfo, this.onNotifyTingInfo, this);                      // 通知听牌
        vv.event.on(MahjongNotify.onNotifyDeadlineTimestamp, this.onNotifyDeadlineTimestamp, this);    // 通知操作截止时间（独立协议）
        vv.event.on(MahjongNotify.onNotifySettlement, this.onNotifySettlement, this);                  // 通知结算
        vv.event.on(MahjongNotify.onNotifyInstantSettlement, this.onNotifyInstantSettlement, this);    // 通知即时结算
        vv.event.on(MahjongNotify.onNotifyQuickMessage, this.onNotifyQuickMessage, this);              // 通知快捷语/表情（房间广播）
        vv.event.on(MahjongNotify.onNotifyAutoPlayState, this.onNotifyAutoPlayState, this);            // 通知玩家托管
    }

    // 初始化
    public init(): void {
        this.resetView();
        let matchData = this._model.matchData;
        let sitUser = matchData.RoomInfo.Players;

        let me = sitUser.find(item => item.RoleUID === vv.user.userData.RoleUID);
        this.meChairID = me.SeatNumber;
        this._mahjongCtrl.setDirCtrlChair(this.meChairID);
        this.initRoomInfo(matchData.RoomInfo);

        let roomStatus = matchData.RoomInfo.Status;
        vv.logger.log(`进入房间 房间状态：${['等待中', '已满员', '已开始', '已结束'][roomStatus]}`);
        switch (roomStatus) {
            case vv.pb.Enum.RoomStatus.ROOM_STATUS_WAITING:   // 等待中
            case vv.pb.Enum.RoomStatus.ROOM_STATUS_FULL:      // 已满员
                this.initPlayerInfo(sitUser);
                this.initReadyBtn(matchData.RoomInfo);
                this.activeWaiting(true);
                break;
            case vv.pb.Enum.RoomStatus.ROOM_STATUS_STARTED:   // 已开始
                RoomModel.instance.reqRejoinRoomBattle();
                break;
            case vv.pb.Enum.RoomStatus.ROOM_STATUS_FINISHED:  // 已结束
                this.returnLobby(() => {
                    vv.utils.showToast('房间已结束');
                })
                break;
            default:
                break;
        }
    }

    // 初始化房间信息
    private initRoomInfo(roomInfo: Enum.IRoomInfo): void {
        let roomType = roomInfo.RoomType;
        let roomID = roomInfo.RoomID;
        switch (roomType) {
            case vv.pb.Enum.RoomType.ROOM_TYPE_GOLD: // 金币
            case vv.pb.Enum.RoomType.ROOM_TYPE_SYSTEM: // 系统
                this.$('_goldRoom').active = true;
                this.$('_gold_roomID', Label).string = `房号：${roomID.match(/\d+/g)}`;
                this.$('_gold_roomLevel', Label).string = `场次：${['初级场', '中级场', '高级场', '大师场'][roomInfo.RoomLevel]}`;
                break;
            case vv.pb.Enum.RoomType.ROOM_TYPE_ROOM_CARD: // 房卡
            case vv.pb.Enum.RoomType.ROOM_TYPE_GUILD: // 亲友圈
                this.$('_roomCardRoom').active = true;
                this.$('_roomCard_roomID', Label).string = `房号：${roomID.match(/\d+/g)}`;
                this.$('_round', Label).string = `局数：${0}/${roomInfo.RuleConfig.BaseConfig.RoundCount}`;
                break;
            default:
                break;
        }
        this.$('_debug').active = ChannelConfig.debug && sys.isBrowser;
    }

    // 初始化准备按钮
    private initReadyBtn(roomInfo: Enum.IRoomInfo): void {
        let roomType = roomInfo.RoomType;
        switch (roomType) {
            case vv.pb.Enum.RoomType.ROOM_TYPE_ROOM_CARD: // 房卡
            case vv.pb.Enum.RoomType.ROOM_TYPE_GUILD: // 亲友圈
                if (this.meChairID === 1) { // 自己是房主
                    this.$('_btStartGame').active = true;
                    this.$('_btReady').active = false;
                    this.$('_btCancelReady').active = false;
                } else {
                    let meReady = roomInfo.Players.find(v => v.SeatNumber === this.meChairID).IsReady;
                    this.$('_btReady').active = !meReady;
                    this.$('_btCancelReady').active = meReady;
                }
                break;
            default:
                break;
        }
    }

    private _currIndex: number = 0;
    // 是否显示等待匹配中
    public activeWaiting(boo: boolean): void {
        this.$('_waiting').active = boo;
        if (boo) {
            this._currIndex = 0;
            this.schedule(this.doPoints, 0.3);
        } else {
            this.unschedule(this.doPoints);
        }
    }

    // 等待匹配中...
    private doPoints(): void {
        let children = this.$('_waiting').children;
        if (this._currIndex > children.length - 1) {
            this._currIndex = 0;
            children.forEach(item => item.active = false);
        } else {
            children[this._currIndex].active = true;
            this._currIndex++;
        }
    }

    // 原生触发返回时处理函数，隐式调用不要删除
    protected onNativeBackHander(): void {
        vv.utils.showDialog({
            content: 'Exit the game?',
            confirmCb: () => {
                this._onBtExit();
            },
            btnStyle: 3
        })
    }

    // 恢复游戏
    private recover(): void {
        // 恢复座位玩家基本信息
        let sitUser = this._model.matchData.RoomInfo.Players;
        let publicInfo = this._model.roomData.PublicInfo;
        let privateInfo = this._model.roomData.PrivateInfo;
        let players = publicInfo.AllPlayers;
        this.initPlayerInfo(sitUser, players);
        // 恢复玩家的牌
        let state: Enum.GameStage = publicInfo.CurrentStage;
        if (state !== vv.pb.Enum.GameStage.GAME_STAGE_WAITING && state !== vv.pb.Enum.GameStage.GAME_STAGE_ENDING) {
            this.recoverPlayerCards();
            this._mahjongCtrl.setHandPosition();
        }
        // 恢复出牌听牌提示
        let data: Battle.INotifyTingInfo = {
            DiscardInfos: privateInfo.DiscardInfos,
        }
        this.onNotifyTingInfo(data);
        // 恢复操作时间
        vv.utils.setServerTime(this._model.roomData.Timestamp); // 设置服务器当前时间戳ms
        let resTimestamp: Battle.INotifyDeadlineTimestamp = {
            RoomID: publicInfo.RoomID,
            DeadlineTimestamp: publicInfo.DeadlineTimestamp,
            CurrentStage: publicInfo.CurrentStage,
        }
        this.onNotifyDeadlineTimestamp(resTimestamp);
        // 恢复局数
        this.$('_round', Label).string = `局数：${publicInfo.CurrentRound}/${publicInfo.TotalRounds}`;
        // 恢复投票数据
        // @ts-ignore
        let voteData: Enum.INotifyPlayerVote = this._model.matchData.RoomInfo.PlayerVote;
        this.onNotifyPlayerVote(voteData);

        vv.logger.log(`开始恢复游戏数据 游戏状态：${['等待', '发牌阶段', '换牌阶段', '定缺阶段', '出牌阶段', '结束'][state]}`);
        switch (state) {
            case vv.pb.Enum.GameStage.GAME_STAGE_WAITING:     // 等待
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_DISPATCH:    // 发牌阶段
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_EXCHANGE:    // 换牌阶段
                let etime = resTimestamp.DeadlineTimestamp - vv.utils.getServerTime();
                let leftTime = Math.round(etime.div(1000));
                this.enterExchangeState(privateInfo.RecommendedCards.map(v => { return v.CardID }), leftTime);
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_DINGQUE:     // 定缺阶段
                this.enterDingQueState(privateInfo.RecommendedDingqueSuit);
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_PUT_MAHJONG: // 出牌阶段
                this.enterPlayState(publicInfo, privateInfo);
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_ENDING:      // 结束
                this.returnLobby(() => {
                    vv.utils.showToast('房间已结束');
                })
                break;
            default:
                break;
        }
    }

    // 恢复玩家手牌、弃牌
    private recoverPlayerCards(): void {
        let played_cards: { [viewID: number]: number[] } = {};
        let weave_cards: { [viewID: number]: Battle.IWeaveItem[] } = {};
        let players = this._model.roomData.PublicInfo.AllPlayers;
        let huData: { [seatID: number]: number } = {};
        players.forEach(p => {
            let viewID = this.chair2View(p.SeatID);
            this._mahjongCtrl.setDingqueColor({ [viewID]: p.LackColor });
            played_cards[viewID] = p.PlayedCards.map(item => item.CardID);
            weave_cards[viewID] = p.WeaveItems;
            if (viewID === MYSELF_VIEW_ID) {
                let handCards = this._model.roomData.PrivateInfo.HandCards;
                if (p.HuCard.CardID > 0) {
                    let index = handCards.findIndex(v => v.CardID === p.HuCard.CardID); // 去掉自己的胡牌
                    if (index !== -1) {
                        handCards.splice(index, 1);
                        handCards.forEach(v => v.IsNewDrawn = false); // 自己胡牌后去掉服务器当前牌标记
                    }
                }
                this.updateHandCards(viewID, handCards);
            } else {
                if (p.HuCard.CardID > 0) {
                    p.HandCardCount--;
                }
                this.updateHandCards(viewID, [], p.HandCardCount, p.HasDrawnCard ? 1 : 0);
            }
            if (p.HuCard.CardID > 0) {
                huData[p.SeatID] = p.HuCard.CardID;
            }
        })
        this._mahjongCtrl.updateDiscard(played_cards);
        this._mahjongCtrl.updateWeave(weave_cards);
        for (const key in huData) {
            const card = huData[key];
            let viewID = this.chair2View(Number(key));
            this._mahjongCtrl.setHuCard(viewID, card);
        }
    }

    // 重置view 
    private resetView(): void {
        this.unscheduleAllCallbacks();
        this.players.forEach(item => item.resetView());
        this._mahjongCtrl.resetView();
        this._model.resetData();
        this.$('_ting').active = false;
        this.$('_btStartGame').active = false;
        this.$('_btReady').active = false;
        this.$('_btCancelReady').active = false;
        this.$('_auto').active = false;
        this.$('_tingNum', Label).string = '';

        this.activeRemainingCards(-1);
        this.activeWaiting(false);
        this.activePaused(false);
        this.activeOutCardTips(false);
    }

    // 清理view
    public clearView(): void {
        this.resetView();
        this.players.forEach(item => item.clearView());
        this.activeWaiting(true);
    }

    private _players: MahjongPlayer[] = null;
    // 获取玩家脚本
    public get players(): MahjongPlayer[] {
        if (!this._players) {
            this._players = [];
            this.$('_players').children.forEach(item => {
                this._players.push(item.getComponent(MahjongPlayer));
            });
        }
        return this._players;
    }

    // 初始化座位玩家信息
    private initPlayerInfo(sitUser: Enum.IPlayerInfo[], players?: Battle.IPlayerInfo[]): void {
        let roomInfo = this._model.matchData.RoomInfo;
        for (let i = 0; i < sitUser.length; i++) {
            let chairID = sitUser[i].SeatNumber;
            let viewID = this.chair2View(chairID);
            let player: Battle.IPlayerInfo;
            if (players) {
                player = players.find(v => { return v.SeatID === sitUser[i].SeatNumber });
            }
            this.players[viewID].setPlayerData(sitUser[i], player);
            this.players[viewID].node.active = true;
            this.players[viewID].setReady(sitUser[i].IsReady
                && roomInfo.RoomType !== vv.pb.Enum.RoomType.ROOM_TYPE_GOLD
                && roomInfo.Status !== vv.pb.Enum.RoomStatus.ROOM_STATUS_STARTED
                && chairID !== 1
            );
            this._mahjongCtrl.setChair(chairID);
        }
    }

    // 根据玩家 accountID 获取座位ID
    private getChairIDByAccountID(accountID: string): number {
        let sitUser = this._model.matchData.RoomInfo.Players;
        for (let i = 0; i < sitUser.length; i++) {
            if (sitUser[i].AccountID === accountID) {
                return sitUser[i].SeatNumber;
            }
        }
        return -1;
    }

    // 根据玩家 RoleUID 获取座位ID
    private getChairIDByRoleUID(roleUID: string): number {
        let sitUser = this._model.matchData.RoomInfo.Players;
        for (let i = 0; i < sitUser.length; i++) {
            if (sitUser[i].RoleUID === roleUID) {
                return sitUser[i].SeatNumber;
            }
        }
        return -1;
    }

    // 播放spine动画
    private playSpineAnimation(ske: sp.Skeleton, animationName: string, callback?: () => void): void {
        ske.node.active = true;
        ske.setAnimation(0, animationName, false);
        if (callback) {
            ske.setCompleteListener(() => {
                ske.setCompleteListener(null);
                ske.node.active = false;
                callback();
            })
        }
    }

    // 返回大厅
    public returnLobby(callback?: () => void): void {
        let roomType = this._model.matchData.RoomInfo.RoomType;
        // 清理数据
        let guildID = this._model.matchData.RoomInfo.GuildID;
        this._model.clear();
        vv.memmory.clearRoomData();
        vv.user.userData.RoomID = null;
        // 返回大厅
        SceneNavigator.goHome(null, true, async () => {
            let openPopup = (popupName: string, options?: any) => {
                vv.ui.open(popupName, options, undefined, undefined, callback);
            }
            switch (roomType) {
                case vv.pb.Enum.RoomType.ROOM_TYPE_GOLD: // 金币房间
                    openPopup(PopupName.CoinLobby);
                    break;
                case vv.pb.Enum.RoomType.ROOM_TYPE_ROOM_CARD: // 房卡房间
                    openPopup(PopupName.RoomMain);
                    break;
                case vv.pb.Enum.RoomType.ROOM_TYPE_GUILD: // 亲友圈房间

                    break;
                default:
                    break;
            }
        })
    }

    /****************************** 收到服务器事件回调 start ********************************/

    // 响应重连战斗结果
    private onRspRejoinRoomBattle(res: Battle.IRspRejoinRoomBattle): void {
        this.recover();
    }

    // 通知玩家加入房间
    private onNotifyPlayerJoined(res: Match.INotifyPlayerJoined): void {
        this.initPlayerInfo([res.Player]);
    }

    // 通知玩家离开房间
    private onNotifyPlayerLeft(res: Match.INotifyPlayerLeft): void {
        let chairID = this.getChairIDByAccountID(res.AccountID);
        let viewID = this.chair2View(chairID);
        this.players[viewID].clearView();
    }

    // 通知玩家准备
    private onNotifyPlayerReadyStatus(res: Match.INotifyPlayerReadyStatus): void {
        let viewID = this.chair2View(this.getChairIDByRoleUID(res.RoleUID));
        this.players[viewID].setReady(res.IsReady);
        if (viewID === MYSELF_VIEW_ID) {
            this.$('_btReady').active = !res.IsReady;
            this.$('_btCancelReady').active = res.IsReady;
        }
    }

    // 通知玩家投票解散房间
    private onNotifyPlayerVote(res: Enum.INotifyPlayerVote): void {
        let sitUser = this._model.matchData.RoomInfo.Players;
        if (res.RejectCount > 0) { // 有人拒绝
            vv.ui.close(PopupName.MahjongDissolve);
            this.activePaused(false);
            let user = sitUser.find(v => { return v.RoleUID === res.CurrentVoterRoleUID });
            if (user) {
                vv.utils.showToast(`玩家${user.RoleName}已拒绝`);
            }
            return;
        }
        let votedRoleUIDs = res.VotedRoleUIDs; // 已投票玩家RoleUID列表
        let etime = res.EndTime - vv.utils.getServerTime(); // 投票结束时间
        let leftTime = Math.round(etime.div(1000));
        let already = votedRoleUIDs.some(v => { return this.getChairIDByRoleUID(v) === this.meChairID });
        if (already) {
            // 自己已经投票 关闭弹窗 显示倒计时
            vv.ui.close(PopupName.MahjongDissolve);
            this.activePaused(true, PausedReason.Dissolve);
            if (leftTime > 0) {
                this.$('_dissolveTimer', Timer).startTimer(leftTime, () => {
                    this.$('_dissolveTimer', Label).string = '(00s)';
                    this.activePaused(false);
                }, (current: string) => {
                    let num = Number(current);
                    this.$('_dissolveTimer', Label).string = `(${vv.utils.padNumberWithZeros(2, num)}s)`;
                })
            }
        } else {
            // 自己没有投票 弹窗
            let initiator = sitUser.find(v => { return v.RoleUID === res.InitiatorRoleUID }); // 发起人
            let isDissolve = this.getChairIDByRoleUID(res.InitiatorRoleUID) === 1;
            vv.ui.open(PopupName.MahjongDissolve, {
                type: isDissolve ? DissolvePopupType.VoteOwnerDissolve : DissolvePopupType.VoteMemberExit,
                data: {
                    playerName: initiator?.RoleName,
                    leftTime: leftTime
                },
                callback: (confirm: boolean) => {
                    let roomID = this._model.matchData.RoomInfo.RoomID;
                    RoomModel.instance.reqProcessEarlyTermination(roomID, confirm);
                }
            })
        }
    }

    // 是否显示暂停
    private activePaused(value: boolean, reason?: PausedReason): void {
        this.$('_pause').active = value;
        if (value) {
            this.$('_offlineList').active = reason === PausedReason.Offline;
            this.$('_dissolve').active = reason === PausedReason.Dissolve;
        } else {
            this.$('_dissolveTimer', Timer).stopTimer();
        }
    }

    // 通知房间解散
    private onNotifyRoomDissolved(res: Match.INotifyRoomDissolved): void {
        this.returnLobby(() => {
            vv.utils.showToast(res.Reason);
        })
    }

    // 通知游戏阶段
    private onNotifyGamePhase(res: Battle.INotifyGamePhase): void {
        switch (res.CurrentStage) {
            case vv.pb.Enum.GameStage.GAME_STAGE_DISPATCH: // 发牌阶段
                this.resetView();
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_EXCHANGE: // 换牌阶段
                this.enterExchangeState(res.RecommendedCards.map(v => { return v.CardID }), 0); // 0：换牌剩余时间在onNotifyDeadlineTimestamp中处理
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_DINGQUE: // 定缺阶段
                this.exitExchangeState();
                this.enterDingQueState(res.RecommendedDingqueSuit);
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_PUT_MAHJONG: // 出牌阶段：玩家轮流出牌
                this.exitDingQueState();
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_ENDING: // 结束阶段：游戏完全结束
                break;
            default:
                break;
        }
        this.activeWaiting(false);
    }

    // 进入换牌阶段 recommendedCards:推荐的换牌 resTimestamp:剩余时间s
    private enterExchangeState(recommendedCards: number[], resTimestamp: number): void {
        if (recommendedCards.length > 0) {
            MahjongSound.playEffect(MahjongSound.soundList.tuijianhuanpai);
        }
        this._mahjongCtrl.enterExchangeState(recommendedCards, resTimestamp);
        this._mahjongCtrl.setDirCurrent(MYSELF_VIEW_ID);
    }

    // 退出换牌阶段
    private exitExchangeState(): void {
        this._mahjongCtrl.exitExchangeState();
    }

    // 进入定缺阶段 recommendedDingqueSuit:推荐定缺 1万 2条 3筒 
    private enterDingQueState(recommendedDingqueSuit: number): void {
        this._mahjongCtrl.enterDingQueState(recommendedDingqueSuit);
        this._mahjongCtrl.setDirCurrent(MYSELF_VIEW_ID);
    }

    // 退出定缺阶段
    private exitDingQueState(): void {
        this._mahjongCtrl.exitDingQueState();
    }

    // 重连进入出牌阶段
    private enterPlayState(publicInfo: Battle.IRoomPublicInfo, privateInfo: Battle.IPlayerPrivateInfo): void {
        // 通知当前玩家
        let res: Battle.INotifyCurrentPlayer = { RoomID: publicInfo.RoomID, AccountID: publicInfo.CurrentPlayer };
        this.onNotifyCurrentPlayer(res);
        let viewID = this.chair2View(this.getChairIDByAccountID(res.AccountID));
        this._mahjongCtrl.setCanOutCard(viewID === MYSELF_VIEW_ID); // 设置是否可以出牌
        // 设置弃牌指针
        if (publicInfo.LastPlayer) {
            let last_out_user = publicInfo.LastPlayer;
            let last_out_user_viewID = this.chair2View(this.getChairIDByAccountID(last_out_user));
            this._mahjongCtrl.recoverDiscardPointer(last_out_user_viewID);
        }
        // 显示我的操作列表
        if (privateInfo.Options.length > 0) {
            let options = privateInfo.Options.filter(v => {
                return v.Action === vv.pb.Enum.Action.ACTION_PENG
                    || v.Action === vv.pb.Enum.Action.ACTION_GANG
                    || v.Action === vv.pb.Enum.Action.ACTION_QIANG_GANG
                    || v.Action === vv.pb.Enum.Action.ACTION_HU
            });
            if (options.length > 0) {
                this._mahjongCtrl.showOperateOptions(options as any, (action: Action) => {
                    this.activeOutCardTips(false);
                });
            }
        }
        // 显示剩余牌
        this.activeRemainingCards(publicInfo.RemainingCards);
    }

    // 通知游戏开始
    private onNotifyGameStart(res: Battle.INotifyGameStart): void {
        MahjongSound.playEffect(MahjongSound.soundList.kaishiyouxi);
        vv.utils.setServerTime(res.Timestamp); // 设置服务器当前时间戳ms
        let ske = this.$('_ske_game_start', sp.Skeleton);
        this.playSpineAnimation(ske, 'paijukaishi', () => {
            let hand_cards_ids = res.HandCards.map(item => item.CardID).reverse();
            let bankChairID = this.getChairIDByAccountID(res.BankerID);
            this._mahjongCtrl.dealTiles(hand_cards_ids, bankChairID);
        })
        let roomPublicInfo = this._model.roomData.PublicInfo;
        this.$('_round', Label).string = `局数：${roomPublicInfo.CurrentRound}/${roomPublicInfo.TotalRounds}`;
    }

    // 通知手牌
    private onNotifyHandCards(res: Battle.INotifyHandCards): void {
        let viewID = this.chair2View(this.getChairIDByAccountID(res.AccountID));
        this.updateHandCards(viewID, res.HandCards, res.HandCount);
    }

    // 通知玩家碰杠牌
    private onNotifyWeaveCards(res: Battle.INotifyWeaveCards): void {
        let viewID = this.chair2View(this.getChairIDByAccountID(res.AccountID));
        let data: {
            [viewID: number]: {
                weaveKind: number,
                provider: number,
                cards: number[],
            }[]
        } = {};
        res.WeaveItems.forEach(item => {
            if (!data[viewID]) {
                data[viewID] = [];
            }
            data[viewID].push({
                weaveKind: item.weaveKind,
                provider: item.provider,
                cards: item.cards,
            })
        })
        this._mahjongCtrl.setWeave(data);
        if (viewID === MYSELF_VIEW_ID) {
            this._mahjongCtrl.setHandPosition();
        }
    }

    // 通知玩家已出牌
    private onNotifyPlayerPlayedCards(res: Battle.INotifyPlayerPlayedCards): void {
        let viewID = this.chair2View(res.SeatID);
        this._mahjongCtrl.updateDiscard({ [viewID]: res.PlayedCards.map(item => item.CardID) });
    }

    // 通知换牌选择进度
    private onNotifyExchangeSelected(res: Battle.INotifyExchangeSelected): void {
        MahjongSound.playEffect(MahjongSound.soundList.huanpai);
        let viewIDs: number[] = [];
        res.SelectedPlayers.forEach(v => {
            viewIDs.push(this.chair2View(this.getChairIDByAccountID(v)));
        })
        this._mahjongCtrl.updateExchangeProgress(viewIDs, false);
    }

    // 通知换牌完成
    private onNotifyExchangeComplete(res: Battle.INotifyExchangeComplete): void {
        this._mahjongCtrl.updateExchangeProgress([0, 1, 2, 3], true, res.Strategy, () => {
            this.updateHandCards(MYSELF_VIEW_ID, res.HandCards);
            this._mahjongCtrl.shootCard(res.CardsIn.map(item => item.CardID));
        })
    }

    // 通知定缺选择进度
    private onNotifyDingqueSelected(res: Battle.INotifyDingqueSelected): void {
        let viewID = this.chair2View(this.getChairIDByAccountID(res.AccountID));
        this._mahjongCtrl.updateDingQueProgress(viewID);
    }

    // 通知定缺完成
    private onNotifyDingqueComplete(res: Battle.INotifyDingqueComplete): void {
        let viewIDs: { [viewID: number]: number } = {}; // 所有定缺的玩家viewID
        res.SelectedPlayers.forEach(v => {
            viewIDs[this.chair2View(v.SeatID)] = v.DingqueSuit;
        })
        this._mahjongCtrl.setDingqueColor(viewIDs);

        let posArray: Vec3[] = []; // 所有玩家头像显示缺的位置世界坐标
        this.players.forEach(v => {
            let p = v.$('_color');
            let world = p.parent.getComponent(UITransform).convertToWorldSpaceAR(p.getPosition());
            posArray.push(world);
        })
        this._mahjongCtrl.updateDingQueComplete(viewIDs, posArray, () => {
            let bankViewID = this.chair2View(this.getChairIDByAccountID(this._model.roomData.PublicInfo.Banker));
            MahjongSound.playEffect(MahjongSound.soundList.feique);
            this.players[bankViewID].showBanker(); // 显示庄家标识
            this.players.forEach((p, i) => {
                p.showDingque(viewIDs[i]); // 显示缺
            })
        })
        this.updateHandCards(MYSELF_VIEW_ID, res.HandCards);
    }

    // 通知当前玩家
    private onNotifyCurrentPlayer(res: Battle.INotifyCurrentPlayer): void {
        let viewID = this.chair2View(this.getChairIDByAccountID(res.AccountID));
        this._mahjongCtrl.setDirCurrent(viewID);
        this.players.forEach((p, i) => {
            this.players[i].showWait(i === viewID);
        })
    }

    // 摸牌通知（服务器自动摸牌后推送）
    private onNotifyDrawCard(res: Battle.INotifyDrawCard): void {
        let viewID = this.chair2View(res.SeatID);
        if (viewID === MYSELF_VIEW_ID && false) { // 自己听牌后播放摸牌搓牌动画
            let currentCard = this._mahjongCtrl.getCurrentCard(viewID);
            currentCard.node.active = false;
            let ske = this.$('_ske_cuopai_jia', sp.Skeleton);
            let pos = vv.utils.convertLocation(currentCard.node, ske.node.parent);
            ske.node.setPosition(v3(pos.x + 5, pos.y - 5));
            this.playSpineAnimation(ske, 'cuopai_jia', () => {
                currentCard.card = res.CardID;
                currentCard.node.active = true;
            })
        } else {
            this._mahjongCtrl.playerDrawCard(viewID, res.CardID);
        }
        this.activeRemainingCards(res.RemainingCards);
        if (viewID === MYSELF_VIEW_ID) {
            this.$('_ting').active = false;
            this._mahjongCtrl.hideTingCardsView();
            this._mahjongCtrl.showSameCard(-1);
        }
    }

    // 设置剩余牌张数
    private activeRemainingCards(leftNum: number): void {
        this.$('_remaining').active = leftNum > 0;
        this.$('_remainingCards', Label).string = leftNum.toString();

        let node = this.$('_tipLeftCard');
        const positionX = node.getPosition().x;
        const positionY = -175;

        let uiOpacity = node.getComponent(UIOpacity);
        let arr = [20, 10, 5, 1]; // 20, 10, 5, 1张牌时显示
        if (leftNum > 0 && arr.includes(leftNum)) {
            // 从下往上运动，淡入淡出
            this.$('_tipLeftCardNum', Label).string = leftNum.toString();
            uiOpacity.opacity = 255;
            node.active = true;
            node.setPosition(v3(positionX, positionY - 25));
            tween(node)
                .to(0.2, { position: v3(positionX, positionY) })
                .call(() => {
                    tween(uiOpacity)
                        .delay(2)
                        .to(1, { opacity: 0 })
                        .start();
                })
                .start();
        } else {
            Tween.stopAllByTarget(node);
            Tween.stopAllByTarget(uiOpacity);
            node.setPosition(v3(positionX, positionY));
            node.active = false;
        }
    }

    // 操作选项通知（告诉玩家可以做哪些操作）
    private onNotifyPlayerOptions(res: Battle.INotifyPlayerOptions): void {
        let putOut = res.Options.some(v => v.Action === vv.pb.Enum.Action.ACTION_PUT);
        this._mahjongCtrl.setCanOutCard(putOut); // 设置是否可以出牌
        let options = res.Options.filter(v => {
            return v.Action === vv.pb.Enum.Action.ACTION_PENG
                || v.Action === vv.pb.Enum.Action.ACTION_GANG
                || v.Action === vv.pb.Enum.Action.ACTION_QIANG_GANG
                || v.Action === vv.pb.Enum.Action.ACTION_HU
        });
        if (options.length > 0) {
            this._mahjongCtrl.hideTingCardsView();
            this._mahjongCtrl.showOperateOptions(options as any, (action: Action) => {
                this.activeOutCardTips(false);
            });
        }
    }

    // 通知玩家操作
    private onNotifyPlayerAction(res: Battle.INotifyPlayerAction): void {
        let viewID = this.chair2View(res.SeatID);
        this._mahjongCtrl.hideOperateOptions(); // 只要有玩家操作就隐藏操作选项
        let sex = this._model.matchData.RoomInfo.Players.find(v => v.AccountID === res.AccountID).Gender ?? 0;
        switch (res.ActionType) {
            case vv.pb.Enum.Action.ACTION_PUT: {
                // 玩家出牌
                MahjongSound.playEffect(MahjongSound.soundList[`mj${res.TargetCard}`], false, true, sex);
                this._mahjongCtrl.hideOperateOptions();
                this._mahjongCtrl.playCard({
                    viewID: viewID,
                    outCard: res.TargetCard,
                    handCards: res.HandCards.map(v => v.CardID),
                    handCardCount: res.HandCardCount,
                    played_cards: res.PlayedCards.map(v => v.CardID),
                })
                break;
            }
            case vv.pb.Enum.Action.ACTION_PENG: {
                // 碰
                MahjongSound.playEffect(MahjongSound.soundList.pengpai);
                MahjongSound.playEffect(MahjongSound.soundList.peng, false, true, sex);
                this.updateHandCards(viewID, res.HandCards, res.HandCardCount);
                this._mahjongCtrl.showOperate(viewID, res.ActionType as any);
                this._mahjongCtrl.showDiscardPointer(-1);
                break;
            }
            case vv.pb.Enum.Action.ACTION_GANG: {
                // 杠
                MahjongSound.playEffect(MahjongSound.soundList.gangpai);
                this.updateHandCards(viewID, res.HandCards, res.HandCardCount);
                this._mahjongCtrl.showOperate(viewID, res.ActionType as any);
                this._mahjongCtrl.showDiscardPointer(-1);
                if (res.StackType === vv.pb.Enum.StackType.STACK_TYPE_AN_GANG) {
                    // 暗杠
                    MahjongSound.playEffect(MahjongSound.soundList.sc_gang, false, true, sex);
                    MahjongSound.playEffect(MahjongSound.soundList.xiayu);
                    this.playSpineAnimation(this.$('_ske_xiayu', sp.Skeleton), 'xiayu');
                } else if (res.StackType === vv.pb.Enum.StackType.STACK_TYPE_BA_GANG || res.StackType === vv.pb.Enum.StackType.STACK_TYPE_DIAN_GANG) {
                    // 巴杠、点杠
                    MahjongSound.playEffect(MahjongSound.soundList.gang, false, true, sex);
                    MahjongSound.playEffect(MahjongSound.soundList.guafeng);
                    this.playSpineAnimation(this.$('_ske_guafeng', sp.Skeleton), 'guafeng');
                }
                break;
            }
            case vv.pb.Enum.Action.ACTION_HU:
                this._mahjongCtrl.showDiscardPointer(-1);
            case vv.pb.Enum.Action.ACTION_ZI_MO: {
                // 自摸、胡
                this.playHuBaseSpine(sex);
                this._mahjongCtrl.showOperate(viewID, res.ActionType as any);
                this._mahjongCtrl.setHuCard(viewID, res.TargetCard);
                break;
            }
            case vv.pb.Enum.Action.ACTION_GANG_SHANG_PAO:     // 杠上炮
                this._mahjongCtrl.showDiscardPointer(-1);
            case vv.pb.Enum.Action.ACTION_QIANG_GANG:         // 抢杠胡
            case vv.pb.Enum.Action.ACTION_GANG_SHANG_HUA:     // 杠上花
            case vv.pb.Enum.Action.ACTION_HAI_DI_LAO:         // 海底捞
            case vv.pb.Enum.Action.ACTION_CALL_TRANSFER:      // 呼叫转移
            case vv.pb.Enum.Action.ACTION_YI_PAO_DUO_XIANG: { // 一炮多响
                this.playHuBaseSpine(sex);
                let spineName = this.getSpecialPaiXingSpineName(res.ActionType);
                this._mahjongCtrl.playSpecialPaiXingSpine(viewID, spineName);
                this._mahjongCtrl.setHuCard(viewID, res.TargetCard);
                break;
            }
            default:
                break;
        }
        // 自己操作后 重置UI
        if (viewID === MYSELF_VIEW_ID) {
            this.resetUIFromAction(res.ActionType);
        } else {
            // 如果自己听牌了 更新自己听牌
            this.updateTingCardsAfterOtherPlayerAction(res);
        }
        this.updateDeskTingCard();
    }

    // 其他玩家操作后，更新自己的听牌列表
    private updateTingCardsAfterOtherPlayerAction(res: Battle.INotifyPlayerAction): void {
        let tingCards = this._mahjongCtrl.getTingCards();
        if (!tingCards || Object.keys(tingCards).length === 0) {
            return; // 没有听牌，不需要更新
        }

        let card = res.TargetCard;
        let actionType = res.ActionType;

        // 根据其他玩家的操作，更新听牌列表
        switch (actionType) {
            case vv.pb.Enum.Action.ACTION_PUT: {
                // 其他玩家出牌，会消耗该牌的1张
                this.removeTingCard(card, 1);
                break;
            }
            case vv.pb.Enum.Action.ACTION_PENG: {
                // 其他玩家碰，会消耗该牌的2张
                this.removeTingCard(card, 2);
                break;
            }
            case vv.pb.Enum.Action.ACTION_GANG: {
                // 其他玩家杠
                if (res.StackType === vv.pb.Enum.StackType.STACK_TYPE_BA_GANG) {
                    // 巴杠：消耗该牌的1张（原有碰的3张加上新杠的1张）
                    this.removeTingCard(card, 1);
                } else if (res.StackType === vv.pb.Enum.StackType.STACK_TYPE_DIAN_GANG) {
                    // 点杠：消耗该牌的3张（原有碰的3张）
                    this.removeTingCard(card, 3);
                }
                break;
            }
            case vv.pb.Enum.Action.ACTION_ZI_MO:
            case vv.pb.Enum.Action.ACTION_GANG_SHANG_HUA:
            case vv.pb.Enum.Action.ACTION_HAI_DI_LAO: {
                // 自摸、杠上花、海底捞、会消耗该牌的1张
                this.removeTingCard(card, 1);
                break;
            }
            default:
                break;
        }
    }

    // 从听牌列表中删除指定牌（根据数量）
    private removeTingCard(card: number, removeCount: number): void {
        let tingList = this._mahjongCtrl.getTingCards();
        if (!tingList) {
            return;
        }
        // 找到该牌在听牌列表中的索引
        let cardIndex = tingList.findIndex(v => v.card === card);
        if (cardIndex !== -1) {
            // 减少该牌的剩余数量
            tingList[cardIndex].count -= removeCount;
            // 如果该牌的剩余数量小于等于0，删除该听牌记录
            if (tingList[cardIndex].count <= 0) {
                tingList.splice(cardIndex, 1);
            }
        }
    }

    // 更新桌面听牌
    private updateDeskTingCard(): void {
        let tingList = this._mahjongCtrl.getTingCards();
        let tatal: number = 0;
        for (let i = 0; i < tingList.length; i++) {
            tatal += tingList[i].count;
        }
        this.$('_tingNum', Label).string = `听${tatal}张`;
        this.$('_ting').active = tingList.length > 0;
    }

    // 自己操作后 重置UI
    private resetUIFromAction(action: Enum.Action): void {
        this._mahjongCtrl.clearListenCard();
        this._mahjongCtrl.hideTingCardsView();
        this._mahjongCtrl.selectGangState(false);
        this.activeOutCardTips(false);
        this._mahjongCtrl.setCanOutCard(false);
        if (action === vv.pb.Enum.Action.ACTION_HU // 胡
            || action === vv.pb.Enum.Action.ACTION_ZI_MO // 自摸
            || action === vv.pb.Enum.Action.ACTION_GANG_SHANG_HUA // 杠上花
            || action === vv.pb.Enum.Action.ACTION_HAI_DI_LAO // 海底捞
            || action === vv.pb.Enum.Action.ACTION_QIANG_GANG) { // 抢杠胡
            this._mahjongCtrl.shootCard([]);
            this._mahjongCtrl.setCanOutCard(false);
        }
    }

    // 播放胡基础动画
    private playHuBaseSpine(sex: number): void {
        MahjongSound.playEffect(MahjongSound.soundList.hu, false, true, sex);
        this.playSpineAnimation(this.$('_ske_hupai', sp.Skeleton), 'hupai');
    }

    // 获取特殊spine动画名
    private getSpecialPaiXingSpineName(actionType: number): string {
        let map: { [key: number]: string } = {
            [vv.pb.Enum.Action.ACTION_QIANG_GANG]: 'zi_qiangganghu',
            [vv.pb.Enum.Action.ACTION_GANG_SHANG_HUA]: 'zi_gangshanghua',
            [vv.pb.Enum.Action.ACTION_GANG_SHANG_PAO]: 'zi_gangshangpao',
            [vv.pb.Enum.Action.ACTION_HAI_DI_LAO]: 'zi_haidilao',
            [vv.pb.Enum.Action.ACTION_CALL_TRANSFER]: 'zi_hujiaozhuanyi',
            [vv.pb.Enum.Action.ACTION_YI_PAO_DUO_XIANG]: 'zi_yipaoduox'
        };
        return map[actionType];
    }

    // 通知听牌
    private onNotifyTingInfo(res: Battle.INotifyTingInfo): void {
        let data: { [out: number]: { card: number, multiple: number, count: number }[] } = {};
        res.DiscardInfos.forEach(v => {
            data[v.DiscardCard] = v.TingCards.map(v => { return { card: v.CardID, multiple: v.FanCount, count: v.RemainingCount } });
        })
        this._mahjongCtrl.showListenCard(data);
    }

    // 通知操作截止时间（独立协议）
    private onNotifyDeadlineTimestamp(res: Battle.INotifyDeadlineTimestamp): void {
        MahjongSound.stopEffect(MahjongSound.soundList.daojishi);

        // 如果是换三张 显示换三张倒计时
        if (res.CurrentStage === vv.pb.Enum.GameStage.GAME_STAGE_EXCHANGE) {
            let etime = res.DeadlineTimestamp - vv.utils.getServerTime();
            let leftTime = Math.round(etime.div(1000));
            // @ts-ignore
            this._mahjongCtrl._exchange.enterExchangeState(leftTime);
        }

        // 剩余5s倒计时执行的回调函数
        let shortTime: number = 5;
        let shortTimeCallback = (num: number) => {
            if (res.CurrentStage === vv.pb.Enum.GameStage.GAME_STAGE_PUT_MAHJONG) { // 出牌阶段 
                MahjongSound.playEffect(MahjongSound.soundList.daojishi);
                let isHaveOperate = this._mahjongCtrl.getOperateBtnState(); // 是否有操作
                let canOutCard = this._mahjongCtrl.getCanOutCard(); // 是否可以出牌
                if (isHaveOperate) {
                    this.activeOutCardTips(true, num, '大家都在等你操作哦');
                } else if (canOutCard) {
                    this.activeOutCardTips(true, num, '大家都在等你出牌哦');
                }
            }
        }
        this._mahjongCtrl.setDirCurrent(-1, { operation_time: res.DeadlineTimestamp, shortTime: shortTime, shortTimeCallback: shortTimeCallback });
    }

    // 是否出牌显示提示文字 time: 倒计时s
    private activeOutCardTips(value: boolean, time?: number, tips?: string): void {
        if (value === this.$('_tipOutCard').active) {
            return; // 重复
        }
        if (!value) { // 隐藏
            this.$('_tipOutCard').active = false;
            this.$('_tipOutCardTimer', Timer).stopTimer();
        } else {
            // 显示
            this.$('_tipOutCard').active = true;
            this.$('_tipOutCardStr', Label).string = tips;
            this.$('_tipOutCardTimer', Timer).startTimer(time, () => {
                this.$('_tipOutCard').active = false;
            }, (current: string) => {
                let num = Number(current);
                this.$('_tipOutCardTimer', Label).string = `(${num}s)`;
            })
        }
    }

    // 通知结算
    private onNotifySettlement(res: Battle.INotifySettlement): void {
        MahjongSound.stopEffect(MahjongSound.soundList.daojishi);

        // 结算重置UI
        vv.ui.close(PopupName.MahjongCoinFlow);
        this._mahjongCtrl.hideTingCardsView();
        this._mahjongCtrl.resetDirCtrl(); // 重置方向盘
        this.players.forEach(p => { p.showWait(false) });

        // 摊牌
        let tanpai = false;
        res.AllPlayers.forEach(p => {
            if (p.HandCards.length > 0) {
                if (!tanpai) {
                    MahjongSound.playEffect(MahjongSound.soundList.tanpai);
                    tanpai = true;
                }
                this.updateShowCards(this.chair2View(p.SeatID), p.HandCards, p.HuCard.CardID);
            }
        })
        // 播放动画弹结算弹窗
        let ske = this.$('_ske_paijujieshu', sp.Skeleton);
        let callback = () => {
            this.scheduleOnce(() => {
                if (!vv.ui.isShowPopup(PopupName.MahjongResult)) {
                    let roomInfo = this._model.matchData.RoomInfo;
                    vv.ui.open(PopupName.MahjongResult, {
                        data: res,
                        roomInfo: roomInfo,
                        publicInfo: this._model.roomData.PublicInfo,
                        nextCallback: () => { // 点击下一局
                            let currentStage = this._model.roomData.PublicInfo.CurrentStage;
                            // 金币房间
                            if (roomInfo.RoomType === vv.pb.Enum.RoomType.ROOM_TYPE_GOLD) {
                                this.clearView();
                                if (currentStage !== vv.pb.Enum.GameStage.GAME_STAGE_ENDING) {
                                    let leave: Match.IReqLeaveRoom = { // 先离开房间
                                        RoomID: this._model.matchData.RoomInfo.RoomID,
                                    }
                                    RoomModel.instance.reqLeaveRoom(leave, (success: boolean) => {
                                        if (success) {
                                            let param: Match.IReqStartMatch = { // 开始匹配
                                                RoomLevel: roomInfo.RoomLevel,
                                                RoomType: roomInfo.RoomType,
                                            }
                                            RoomModel.instance.reqStartMatch(param);
                                        }
                                    })
                                } else {
                                    let param: Match.IReqStartMatch = { // 开始匹配
                                        RoomLevel: roomInfo.RoomLevel,
                                        RoomType: roomInfo.RoomType,
                                    }
                                    RoomModel.instance.reqStartMatch(param);
                                }
                            } else {
                                // 房卡房间
                                this.resetView();
                                this._onBtReady();
                                let sitUser = this._model.matchData.RoomInfo.Players;  // 准备按钮
                                for (let i = 0; i < sitUser.length; i++) {
                                    let chairID = sitUser[i].SeatNumber;
                                    let viewID = this.chair2View(chairID);
                                    this.players[viewID].setReady(sitUser[i].IsReady)
                                }
                            }
                        },
                        leaveCallback: () => { // 点击离开
                            // 金币房间
                            if (roomInfo.RoomType === vv.pb.Enum.RoomType.ROOM_TYPE_GOLD) {
                                let currentStage = this._model.roomData.PublicInfo.CurrentStage;
                                if (currentStage !== vv.pb.Enum.GameStage.GAME_STAGE_ENDING) { // 非结束阶段
                                    this._onBtExit();
                                } else { // 是结束阶段
                                    this.returnLobby();
                                }
                            } else {
                                // 房卡房间
                                this._onBtExit();
                            }
                        },
                        backCallback: () => {
                            this.returnLobby();
                        }
                    })
                }
            }, 1);
        }
        if (res.SettlementType === vv.pb.Enum.SettlementType.SETTLEMENT_TYPE_NORMAL) { // 正常结算
            if (tanpai) {
                MahjongSound.playEffect(MahjongSound.soundList.paijujieshu);
                this.playSpineAnimation(ske, 'paijujieshu', callback);
            } else {
                callback();
            }
        } else {
            MahjongSound.playEffect(MahjongSound.soundList.liuju);
            this.playSpineAnimation(ske, 'liuju', callback);
        }
    }

    // 通知即时结算
    private onNotifyInstantSettlement(res: Battle.INotifyInstantSettlement): void {
        let viewID = this.chair2View(this.getChairIDByAccountID(res.WinnerPlayerID));
        this.players[viewID].showScore(res.WinScore);
        res.LoserScores.forEach(v => {
            let viewID = this.chair2View(this.getChairIDByAccountID(v.PlayerID));
            this.players[viewID].showScore(v.Score);
            // 更新其他玩家分数
            if (viewID !== MYSELF_VIEW_ID) {
                let _score = this.players[viewID].score + v.Score;
                this.players[viewID].updateScore(_score);
            }
        })
        let popup = vv.ui.isShowPopup(PopupName.MahjongCoinFlow) as MahjongCoinFlow;
        if (popup) {
            popup.updateView(this._model.flowRecord);
        }
    }

    // 通知快捷语/表情（房间广播）
    private onNotifyQuickMessage(res: Battle.INotifyQuickMessage): void {
        let viewID = this.chair2View(res.SeatID);
        if (res.Type === vv.pb.Enum.QuickMessageType.QUICK_MESSAGE_TEXT) {
            this.players[viewID].showQuickTalk(res.Content);
            let sex = this._model.matchData.RoomInfo.Players.find(v => v.SeatNumber === res.SeatID).Gender ?? 0;
            MahjongSound.playEffect(MahjongSound.soundList[res.Content.split('&&')[1]], false, true, sex);
        } else if (res.Type === vv.pb.Enum.QuickMessageType.QUICK_MESSAGE_EMOJI) {
            this.players[viewID].showFace(res.Content);
        }
    }

    // 通知玩家托管
    private onNotifyAutoPlayState(res: Battle.INotifyAutoPlayState): void {
        let viewID = this.chair2View(res.SeatID);
        if (viewID === MYSELF_VIEW_ID) {
            this.$('_auto').active = res.IsAutoPlay;
        } else {
            this.players[viewID].showAutoPlay(res.IsAutoPlay);
        }
    }

    // 通知物品更新
    private onNotifyPlayerItemChange(res: Enum.PlayerItem): void {
        if (res.ItemType === vv.pb.Enum.EItemType.ITEM_GOLD) { // 金币
            this.players[MYSELF_VIEW_ID].updateScore(res.ItemCount);
        } else if (res.ItemType === vv.pb.Enum.EItemType.ITEM_ROOM_CARD) { // 房卡
            this.players[MYSELF_VIEW_ID].updateScore(res.ItemCount);
        }
    }

    // 更新手牌
    private updateHandCards(viewID: number, handCards: Battle.ICard[], handCardCount?: number, currentCard?: number): void {
        if (handCards && handCards.length > 0) {
            let current = currentCard ?? handCards.find(item => item.IsNewDrawn === true)?.CardID;
            this._mahjongCtrl.updateHandCards({ [viewID]: { handCards: handCards.map(item => item.CardID), current: current } });
        } else {
            this._mahjongCtrl.updateHandCards({ [viewID]: { handCards: Array(handCardCount).fill(0), current: currentCard } });
        }
    }

    // 更新摊开牌
    private updateShowCards(viewID: number, handCards: Battle.ICard[], current: number): void {
        this._mahjongCtrl.updateShowCards({ [viewID]: { handCards: handCards.map(item => item.CardID), current: current } });
    }

    /****************************** 收到服务器事件回调 end ********************************/

    /****************************** 按钮点击事件 start ********************************/

    // 点击菜单
    private _onBtMenu(): void {
        let node = this.$('_menuNode');
        let scaleY = 0.4;
        let isHide = !node.active;
        if (isHide) {
            node.active = true;
            node.setScale(v3(1, scaleY, 1));
            scaleY = 1;
        }
        Tween.stopAllByTarget(node);
        tween(node)
            .to(0.1, { scale: v3(1, scaleY, 1) })
            .call(() => {
                if (!isHide) {
                    node.active = false;
                }
            })
            .start();
    }

    // 点击设置
    private _onBtSetting(): void {
        this.$('_menuNode').active = false;
        vv.ui.open(PopupName.MahjongSetting);
    }

    // 点击规则
    private _onBtRule(): void {
        this.$('_menuNode').active = false;
        vv.ui.open(PopupName.GameRule);
    }

    // 点击记录
    private _onBtRecord(): void {
        this.$('_menuNode').active = false;
        vv.ui.open(PopupName.MahjongRecord);
    }

    // 点击关闭菜单
    private _onBtCloseMenu(): void {
        this.$('_menuNode').active = false;
    }

    // 点击退出房间
    private _onBtExit(): void {
        this.$('_menuNode').active = false;
        let matchData = this._model.matchData;
        if (matchData.RoomInfo.RoomType === vv.pb.Enum.RoomType.ROOM_TYPE_GOLD) { // 金币房间
            this.reqLeaveRoom();
        } else { // 房卡房间
            let roomStatus = matchData.RoomInfo.Status;
            if (roomStatus === vv.pb.Enum.RoomStatus.ROOM_STATUS_STARTED) { // 游戏已开始
                if (this.meChairID === 1) { // 自己是房主
                    vv.ui.open(PopupName.MahjongDissolve, { // 发起解散
                        type: DissolvePopupType.OwnerDissolve,
                        callback: (confirm: boolean) => {
                            if (confirm) {
                                let roomID = matchData.RoomInfo.RoomID;
                                RoomModel.instance.reqApplyEarlyTermination(roomID);
                            }
                        }
                    });
                } else {
                    vv.ui.open(PopupName.MahjongDissolve, { // 发起退出
                        type: DissolvePopupType.MemberExit,
                        callback: (confirm: boolean) => {
                            if (confirm) {
                                let roomID = matchData.RoomInfo.RoomID;
                                RoomModel.instance.reqApplyEarlyTermination(roomID);
                            }
                        }
                    });
                }
            } else { // 游戏未开始
                if (this.meChairID === 1) {
                    vv.ui.open(PopupName.MahjongDissolve, { // 确认解散
                        type: DissolvePopupType.Dissolve,
                        callback: (confirm: boolean) => {
                            if (confirm) {
                                this.reqLeaveRoom();
                            }
                        }
                    });
                } else {
                    this.reqLeaveRoom();
                }
            }
        }
    }

    // 请求离开房间
    private reqLeaveRoom(): void {
        let param: Match.IReqLeaveRoom = {
            RoomID: this._model.matchData.RoomInfo.RoomID,
        }
        RoomModel.instance.reqLeaveRoom(param, (success: boolean) => {
            if (success) {
                this.returnLobby();
            }
        })
    }

    // 点击游戏玩法
    private _onBtGameplay(): void {
        vv.ui.open(PopupName.GuildRoomRule, this._model.matchData.RoomInfo.RuleConfig);
    }

    // 点击聊天
    private _onBtChat(): void {
        vv.ui.open(PopupName.MahjongChat);
        this.$('_menuNode').active = false;
    }

    // 点击流水
    private _onBtCoinFlow(): void {
        vv.ui.open(PopupName.MahjongCoinFlow, { record: this._model.flowRecord, roomType: this._model.matchData.RoomInfo.RoomType });
    }

    // 点击听牌提示
    private _onBtTing(): void {
        if (this._mahjongCtrl.getTingCardsViewState()) {
            this._mahjongCtrl.hideTingCardsView();
        } else {
            let tingList = this._mahjongCtrl.getTingCards();
            this._mahjongCtrl.showTingCardsView(tingList);
        }
    }

    // 点击大背景
    private _onBtBg(): void {
        this._mahjongCtrl.shootCard([]);
        this._mahjongCtrl.hideTingCardsView();
        this._mahjongCtrl.showSameCard(-1);
    }

    // 点击准备
    private _onBtReady(): void {
        let param: Match.IReqSetReadyStatus = {
            RoomID: this._model.matchData.RoomInfo.RoomID,
            IsReady: true,
        }
        RoomModel.instance.reqSetReadyStatus(param);
    }

    // 点击取消准备
    private _onBtCancelReady(): void {
        let param: Match.IReqSetReadyStatus = {
            RoomID: this._model.matchData.RoomInfo.RoomID,
            IsReady: false,
        }
        RoomModel.instance.reqSetReadyStatus(param);
    }

    // 点击取消托管
    private _onBtCancelAuto(): void {
        let param: Battle.IReqAutoPlay = {
            IsAutoPlay: false,
        }
        MahjongProxy.instance.reqAutoPlay(param, (success: boolean) => {
            if (success) {
                this.$('_auto').active = false;
            }
        });
    }

    // 点击开始游戏
    private _onBtStartGame(): void {
        let allReady = true;
        let players = this._model.matchData.RoomInfo.Players;
        players.forEach(v => {
            if (v.SeatNumber !== 1) {
                if (!v.IsReady) {
                    allReady = false;
                }
            }
        })
        if (players.length < 4) {
            vv.utils.showToast('人数不足');
            return;
        }
        if (!allReady) {
            vv.utils.showToast('请等待其他玩家准备完成');
            return;
        }
        let param: Match.IReqSetReadyStatus = {
            RoomID: this._model.matchData.RoomInfo.RoomID,
            IsReady: true,
        }
        RoomModel.instance.reqSetReadyStatus(param);
    }

    // 点击debug
    private _onBtDebug(): void {
        this.$('_debugNode').active = !this.$('_debugNode').active;
    }

    // 点击发送 下次摸的牌
    private _onBtSendDrawCard(): void {
        let text = this.$('_debugBox', EditBox).string;
        let cards = Array.from(text.split(','));
        let param: Battle.IReqSetDrawCardPreset = {
            Cards: cards.map(item => parseInt(item)),
        }
        MahjongProxy.instance.reqSetDrawCardPreset(param, () => {
            this.$('_debugNode').active = false;
        });
    }

    // 点击解散房间 测试用
    private _onBtDissolve(): void {
        let param: Match.IReqUpdateRoomStatus = {
            RoomID: this._model.matchData.RoomInfo.RoomID,
            RoomStatus: vv.pb.Enum.RoomStatus.ROOM_STATUS_FINISHED,
        }
        vv.network.send('Match.ReqUpdateRoomStatus', 'Match.RspUpdateRoomStatus', param, (res: Match.IRspUpdateRoomStatus) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                return;
            }
            vv.user.userData.RoomID = null;
            this.returnLobby(() => {
                vv.utils.showToast('房间已解散');
            })
        })
    }

    /****************************** 按钮点击事件 end ********************************/

}