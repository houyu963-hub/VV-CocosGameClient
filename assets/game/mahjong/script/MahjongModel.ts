import vv from "db://assets/frame/Core";
import { Battle, Enum, Lobby, Match } from "db://assets/resources/pbjs";
import { MahjongNotify } from "./MahjongNotify";
import { ListItemData } from "./component/MahjongCoinFlow";

/**
 * 数据模型类 游戏数据都在这里处理通过事件形式派发到view
 */
export default class MahjongModel {
    private static _instance: MahjongModel = null;
    public static get instance(): MahjongModel { return this._instance ?? (this._instance = new MahjongModel()) };

    private _matchData: Match.IRspStartMatch;
    public get matchData(): Match.IRspStartMatch {
        return (this._matchData ?? (this._matchData = vv.pb.Match.RspStartMatch.create({
            RoomInfo: vv.pb.Enum.RoomInfo.create(),
        })));
    }
    public set matchData(value: Match.IRspStartMatch) {
        this._matchData = value;
    }

    private _roomData: Battle.IRoomSnapshot;
    public get roomData(): Battle.IRoomSnapshot {
        return (this._roomData ?? (this._roomData = vv.pb.Battle.RoomSnapshot.create({
            PublicInfo: vv.pb.Battle.RoomPublicInfo.create(),
            PrivateInfo: vv.pb.Battle.PlayerPrivateInfo.create()
        })));
    }
    public set roomData(value: Battle.IRoomSnapshot) {
        this._roomData = value;
    }

    public flowRecord: ListItemData[] = []; // 我的流水记录

    // 初始化
    public init(roomInfo: Enum.IRoomInfo): void {
        if (!roomInfo) return;
        this.matchData.RoomInfo = roomInfo;
        // 匹配服消息
        vv.event.on('Match.RspStartMatch', this.handleMessage.bind(this, this.onRspStartMatch), this);                       // 响应匹配结果
        vv.event.on('Match.NotifyPlayerJoined', this.handleMessage.bind(this, this.onNotifyPlayerJoined), this);             // 通知玩家加入房间
        vv.event.on('Match.NotifyPlayerLeft', this.handleMessage.bind(this, this.onNotifyPlayerLeft), this);                 // 通知玩家离开房间
        vv.event.on('Match.NotifyRoomStatusChanged', this.handleMessage.bind(this, this.onNotifyRoomStatusChanged), this);   // 通知房间状态变化
        vv.event.on('Match.NotifyPlayerReadyStatus', this.handleMessage.bind(this, this.onNotifyPlayerReadyStatus), this);   // 通知玩家准备
        // vv.event.on('Match.onPlayerOffline',this.handleMessage.bind(this, this.onPlayerOffline), this);             // 玩家离线
        vv.event.on('Match.NotifyPlayerVote', this.handleMessage.bind(this, this.onNotifyPlayerVote), this);                 // 通知玩家投票解散房间
        vv.event.on('Match.NotifyRoomDissolved', this.handleMessage.bind(this, this.onNotifyRoomDissolved), this);           // 通知房间解散

        // 大厅服消息
        vv.event.on('Lobby.NotifyPlayerItemChange', this.handleMessage.bind(this, this.onNotifyPlayerItemChange), this);     // 通知玩家物品变化

        // 游戏服消息
        vv.event.on('Battle.RspRejoinRoomBattle', this.handleMessage.bind(this, this.onRspRejoinRoomBattle), this);          // 响应重连战斗结果
        vv.event.on('Battle.NotifyGamePhase', this.handleMessage.bind(this, this.onNotifyGamePhase), this);                  // 通知游戏阶段
        vv.event.on('Battle.NotifyGameStart', this.handleMessage.bind(this, this.onNotifyGameStart), this);                  // 通知游戏开始
        vv.event.on('Battle.NotifyHandCards', this.handleMessage.bind(this, this.onNotifyHandCards), this);                  // 通知玩家手牌
        vv.event.on('Battle.NotifyWeaveCards', this.handleMessage.bind(this, this.onNotifyWeaveCards), this);                // 通知玩家碰杠牌
        vv.event.on('Battle.NotifyPlayerPlayedCards', this.handleMessage.bind(this, this.onNotifyPlayerPlayedCards), this);  // 通知玩家已出牌
        vv.event.on('Battle.NotifyExchangeSelected', this.handleMessage.bind(this, this.onNotifyExchangeSelected), this);    // 通知换牌选择进度
        vv.event.on('Battle.NotifyExchangeComplete', this.handleMessage.bind(this, this.onNotifyExchangeComplete), this);    // 通知换牌完成
        vv.event.on('Battle.NotifyDingqueSelected', this.handleMessage.bind(this, this.onNotifyDingqueSelected), this);      // 通知定缺选择进度
        vv.event.on('Battle.NotifyDingqueComplete', this.handleMessage.bind(this, this.onNotifyDingqueComplete), this);      // 通知定缺完成
        vv.event.on('Battle.NotifyCurrentPlayer', this.handleMessage.bind(this, this.onNotifyCurrentPlayer), this);          // 通知当前玩家
        vv.event.on('Battle.NotifyDrawCard', this.handleMessage.bind(this, this.onNotifyDrawCard), this);                    // 通知摸牌（服务器自动摸牌后推送）
        vv.event.on('Battle.NotifyPlayerOptions', this.handleMessage.bind(this, this.onNotifyPlayerOptions), this);          // 通知操作选项（告诉玩家可以做哪些操作）
        vv.event.on('Battle.NotifyPlayerAction', this.handleMessage.bind(this, this.onNotifyPlayerAction), this);            // 通知玩家操作
        vv.event.on('Battle.NotifyTingInfo', this.handleMessage.bind(this, this.onNotifyTingInfo), this);                    // 通知听牌
        vv.event.on('Battle.NotifyDeadlineTimestamp', this.handleMessage.bind(this, this.onNotifyDeadlineTimestamp), this);  // 通知操作截止时间
        vv.event.on('Battle.NotifySettlement', this.handleMessage.bind(this, this.onNotifySettlement), this);                // 通知游戏结束
        vv.event.on('Battle.NotifyInstantSettlement', this.handleMessage.bind(this, this.onNotifyInstantSettlement), this);  // 通知即时结算
        vv.event.on('Battle.NotifyQuickMessage', this.handleMessage.bind(this, this.onNotifyQuickMessage), this);            // 通知快捷语/表情（房间广播）
        vv.event.on('Battle.NotifyAutoPlayState', this.handleMessage.bind(this, this.onNotifyAutoPlayState), this);          // 通知玩家托管
    }

    // 统一处理消息的函数
    private handleMessage(handler: (res: any) => void, res: any): void {
        try {
            // 验证数据
            if (!res) {
                console.warn('收到空消息');
                return;
            }
            let roomInfo = this.matchData.RoomInfo;
            if (!roomInfo) {
                console.warn('没有房间信息不处理任何消息');
                return;
            }
            if (res.RoomID && res.RoomID !== this.matchData.RoomInfo.RoomID) {
                console.warn(`收到其他房间[${res.RoomID}]消息[不处理]`);
                return;
            }
            // 调用具体的处理函数
            handler.call(this, res);
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    }

    // 通知游戏阶段
    private onNotifyGamePhase(res: Battle.INotifyGamePhase): void {
        this.roomData.PublicInfo.CurrentStage = res.CurrentStage;
        switch (res.CurrentStage) {
            case vv.pb.Enum.GameStage.GAME_STAGE_WAITING:
                if (this._matchData.RoomInfo.Status !== vv.pb.Enum.RoomStatus.ROOM_STATUS_FULL) {
                    this.matchData.RoomInfo.Status = vv.pb.Enum.RoomStatus.ROOM_STATUS_WAITING;
                }
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_DISPATCH:
            case vv.pb.Enum.GameStage.GAME_STAGE_EXCHANGE:
            case vv.pb.Enum.GameStage.GAME_STAGE_DINGQUE:
            case vv.pb.Enum.GameStage.GAME_STAGE_PUT_MAHJONG:
                this.matchData.RoomInfo.Status = vv.pb.Enum.RoomStatus.ROOM_STATUS_STARTED;
                break;
            case vv.pb.Enum.GameStage.GAME_STAGE_ENDING:
                this.matchData.RoomInfo.Status = vv.pb.Enum.RoomStatus.ROOM_STATUS_FINISHED;
                break;
            default:
                break;
        }
        vv.event.emit(MahjongNotify.onNotifyGamePhase, res);
    }

    // 通知游戏开始
    private onNotifyGameStart(res: Battle.INotifyGameStart): void {
        this.roomData.PublicInfo.Banker = res.BankerID;
        this.roomData.PublicInfo.CurrentRound = res.CurrentRound;
        this.roomData.PublicInfo.TotalRounds = res.TotalRounds;
        vv.event.emit(MahjongNotify.onNotifyGameStart, res);
    }

    // 通知手牌
    private onNotifyHandCards(res: Battle.INotifyHandCards): void {
        vv.event.emit(MahjongNotify.onNotifyHandCards, res);
    }

    // 通知玩家碰杠牌
    private onNotifyWeaveCards(res: Battle.INotifyWeaveCards): void {
        vv.event.emit(MahjongNotify.onNotifyWeaveCards, res);
    }

    // 通知玩家已出牌
    private onNotifyPlayerPlayedCards(res: Battle.INotifyPlayerPlayedCards): void {
        vv.event.emit(MahjongNotify.onNotifyPlayerPlayedCards, res);
    }

    // 通知换牌选择进度
    private onNotifyExchangeSelected(res: Battle.INotifyExchangeSelected): void {
        vv.event.emit(MahjongNotify.onNotifyExchangeSelected, res);
    }

    // 通知换牌完成
    private onNotifyExchangeComplete(res: Battle.INotifyExchangeComplete): void {
        vv.event.emit(MahjongNotify.onNotifyExchangeComplete, res);
    }

    // 通知定缺选择进度
    private onNotifyDingqueSelected(res: Battle.INotifyDingqueSelected): void {
        vv.event.emit(MahjongNotify.onNotifyDingqueSelected, res);
    }

    // 通知定缺完成
    private onNotifyDingqueComplete(res: Battle.INotifyDingqueComplete): void {
        vv.event.emit(MahjongNotify.onNotifyDingqueComplete, res);
    }

    // 通知当前玩家
    private onNotifyCurrentPlayer(res: Battle.INotifyCurrentPlayer): void {
        vv.event.emit(MahjongNotify.onNotifyCurrentPlayer, res);
    }

    // 通知摸牌（服务器自动摸牌后推送）
    private onNotifyDrawCard(res: Battle.INotifyDrawCard): void {
        vv.event.emit(MahjongNotify.onNotifyDrawCard, res);
    }

    // 通知操作选项（告诉玩家可以做哪些操作）
    private onNotifyPlayerOptions(res: Battle.INotifyPlayerOptions): void {
        vv.event.emit(MahjongNotify.onNotifyPlayerOptions, res);
    }

    // 通知玩家操作
    private onNotifyPlayerAction(res: Battle.INotifyPlayerAction): void {
        vv.event.emit(MahjongNotify.onNotifyPlayerAction, res);
    }

    // 通知听牌
    private onNotifyTingInfo(res: Battle.INotifyTingInfo): void {
        vv.event.emit(MahjongNotify.onNotifyTingInfo, res);
    }

    // 通知操作截止时间（独立协议）
    private onNotifyDeadlineTimestamp(res: Battle.INotifyDeadlineTimestamp): void {
        vv.event.emit(MahjongNotify.onNotifyDeadlineTimestamp, res);
    }

    // 通知结算
    private onNotifySettlement(res: Battle.INotifySettlement): void {
        this.matchData.RoomInfo.Players.forEach(v => {
            v.IsReady = false;
        })
        vv.event.emit(MahjongNotify.onNotifySettlement, res);
    }

    // 通知即时结算
    private onNotifyInstantSettlement(res: Battle.INotifyInstantSettlement): void {
        // 筛选出与我相关的记录
        if (res.WinnerPlayerID === this.meAccountID) { // 自己是赢家
            let loseIds: string[] = res.LoserScores.map(v => v.PlayerID);
            let loserSeat = this.getSeatString(loseIds); // 该条明细输家
            let item: ListItemData = {
                type: "",
                multiplier: 0,
                seat: loserSeat,
                score: res.WinScore
            }
            this.flowRecord.push(item);
        } else {
            let me = res.LoserScores.find(v => { return v.PlayerID === this.meAccountID });
            if (me) { // 自己是输家
                let item: ListItemData = {
                    type: "",
                    multiplier: 0,
                    seat: this.getSeatString([res.WinnerPlayerID]),
                    score: me.Score
                }
                this.flowRecord.push(item);
            }
        }
        vv.event.emit(MahjongNotify.onNotifyInstantSettlement, res);
    }

    // 通知快捷语/表情（房间广播）
    private onNotifyQuickMessage(res: Battle.INotifyQuickMessage): void {
        vv.event.emit(MahjongNotify.onNotifyQuickMessage, res);
    }

    // 通知玩家托管
    private onNotifyAutoPlayState(res: Battle.INotifyAutoPlayState): void {
        vv.event.emit(MahjongNotify.onNotifyAutoPlayState, res);
    }

    // 响应：匹配结果
    private onRspStartMatch(res: Match.IRspStartMatch): void {
        if (res.ErrorCode === vv.pb.Enum.EErrorCode.Succeed) {
            this.matchData = res;
        }
    }

    // 响应：重连战斗结果
    private onRspRejoinRoomBattle(res: Battle.IRspRejoinRoomBattle): void {
        if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
            return;
        }
        this.roomData = res.RoomSnapshot;
        vv.event.emit(MahjongNotify.onRspRejoinRoomBattle, res);
    }

    // 通知玩家加入房间
    private onNotifyPlayerJoined(res: Match.INotifyPlayerJoined): void {
        let players = this.matchData.RoomInfo.Players;
        let includes = players.find(v => { return v.RoleUID === res.Player.RoleUID });
        if (!includes) {
            players.push(res.Player);
            vv.event.emit(MahjongNotify.onNotifyPlayerJoined, res);
        }
    }

    // 通知玩家离开房间
    private onNotifyPlayerLeft(res: Match.INotifyPlayerLeft): void {
        let players = this.matchData.RoomInfo.Players;
        let index = players.findIndex(v => { return v.RoleUID === res.RoleUID });
        if (index !== -1) {
            vv.event.emit(MahjongNotify.onNotifyPlayerLeft, res);
            players.splice(index, 1);
        }
    }

    // 通知房间状态变化
    private onNotifyRoomStatusChanged(res: Match.INotifyRoomStatusChanged): void {
        this.matchData.RoomInfo.Status = res.NewStatus;
    }

    // 通知玩家准备
    private onNotifyPlayerReadyStatus(res: Match.INotifyPlayerReadyStatus): void {
        this.matchData.RoomInfo.Players.find(v => v.RoleUID === res.RoleUID).IsReady = res.IsReady;
        vv.event.emit(MahjongNotify.onNotifyPlayerReadyStatus, res);
    }

    // 通知玩家投票解散房间
    private onNotifyPlayerVote(res: Enum.INotifyPlayerVote): void {
        vv.event.emit(MahjongNotify.onNotifyPlayerVote, res);
    }

    // 通知房间解散
    private onNotifyRoomDissolved(res: Match.INotifyRoomDissolved): void {
        vv.event.emit(MahjongNotify.onNotifyRoomDissolved, res);
    }

    // 通知玩家物品变化
    private onNotifyPlayerItemChange(res: Lobby.INotifyPlayerItemChange): void {
        vv.event.emit(MahjongNotify.onNotifyPlayerItemChange, res);
    }

    // 玩家离线
    private onPlayerOffline(res: Match.INotifyPlayerReadyStatus): void {

    }

    // 获取自己的AccountID
    private get meAccountID(): string {
        let sitUser = this.matchData.RoomInfo.Players;
        let me = sitUser.find(item => item.RoleUID === vv.user.userData.RoleUID);
        return me.AccountID;
    }

    // accountID 转座位文字
    private getSeatString(accountIDList: string[]): string {
        let result = [];
        let players = this.matchData.RoomInfo.Players;
        accountIDList.forEach(id => {
            let player = players.find(v => { return v.AccountID === id });
            if (player) {
                let viewID = vv.memmory.gameClient.chair2View(player.SeatNumber);
                result.push(['自己', '下家', '对家', '上家'][viewID]);
            }
        })
        return result.toString();
    }

    // 清理数据
    public clear(): void {
        vv.event.removeAllByTarget(this);
        this.roomData = null;
        this.matchData = null;
        this.flowRecord = null;
        MahjongModel._instance = null;
    }

    // 打完一局重置数据
    public resetData(): void {
        this.flowRecord.length = 0;
    }
}