/**
 * 通知事件名
 */
export class MahjongNotify {
    public static onNotifyGamePhase = 'onNotifyGamePhase';                   // 通知游戏状态
    public static onNotifyGameStart = 'onNotifyGameStart';                   // 通知通知游戏开始游戏状态
    public static onNotifyHandCards = 'onNotifyHandCards';                   // 通知玩家手牌
    public static onNotifyWeaveCards = 'onNotifyWeaveCards';                 // 通知玩家碰杠牌
    public static onNotifyPlayerPlayedCards = 'onNotifyPlayerPlayedCards';   // 通知玩家已出牌
    public static onNotifyExchangeSelected = 'onNotifyExchangeSelected';     // 通知换牌选择进度
    public static onNotifyExchangeComplete = 'onNotifyExchangeComplete';     // 通知换牌完成
    public static onNotifyDingqueSelected = 'onNotifyDingqueSelected';       // 通知定缺选择进度
    public static onNotifyDingqueComplete = 'onNotifyDingqueComplete';       // 通知定缺完成
    public static onNotifyCurrentPlayer = 'onNotifyCurrentPlayer';           // 通知当前玩家
    public static onNotifyDrawCard = 'onNotifyDrawCard';                     // 通知摸牌（服务器自动摸牌后推送）
    public static onNotifyPlayerAction = 'onNotifyPlayerAction';             // 通知玩家操作
    public static onNotifyTingInfo = 'onNotifyTingInfo';                     // 通知听牌
    public static onNotifyDeadlineTimestamp = 'onNotifyDeadlineTimestamp';   // 通知作截止时间（独立协议）
    public static onNotifySettlement = 'onNotifySettlement';                 // 通知结算
    public static onNotifyInstantSettlement = 'onNotifyInstantSettlement';   // 通知即时结算
    public static onNotifyQuickMessage = 'onNotifyQuickMessage';             // 通知快捷语/表情（房间广播）
    public static onNotifyAutoPlayState = 'onNotifyAutoPlayState';           // 通知玩家托管
    public static onNotifyPlayerOptions = 'onNotifyPlayerOptions';           // 通知操作选项（告诉玩家可以做哪些操作）
    public static onNotifyPlayerJoined = 'onNotifyPlayerJoined';             // 通知玩家加入房间
    public static onNotifyPlayerLeft = 'onNotifyPlayerLeft';                 // 通知玩家离开房间
    public static onRspRejoinRoomBattle = 'onRspRejoinRoomBattle';           // 通知重连战斗结果
    public static onNotifyPlayerReadyStatus = 'onNotifyPlayerReadyStatus';   // 通知玩家准备
    public static onNotifyPlayerVote = 'onNotifyPlayerVote';                 // 通知玩家投票解散房间
    public static onNotifyRoomDissolved = 'onNotifyRoomDissolved';           // 通知房间解散
    public static onNotifyPlayerItemChange = 'onNotifyPlayerItemChange';     // 通知玩家物品变化
}