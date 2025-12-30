import { Bundle_name } from "../config/Define"

export interface IPopupConfig {
    popupPath: string,      // 弹窗路径
    bundle: string,         // 所属bundle
    desc?: string,          // 描述
}

/**
 * 弹窗名字
 */
export const PopupName = {
    // Resources
    Toast: 'Toast',
    Waiting: 'Waiting',
    Dialog: 'Dialog',
    // Mahjong
    MahjongResult: 'MahjongResult',
    MahjongResultAll: 'MahjongResultAll',
    MahjongPlayerInfo: 'MahjongPlayerInfo',
    MahjongChat: 'MahjongChat',
    MahjongCoinFlow: 'MahjongCoinFlow',
    MahjongSetting: 'MahjongSetting',
    MahjongRecord: 'MahjongRecord',
    MahjongDissolve: 'MahjongDissolve',
    // 大厅
    Hall: 'Hall',
    Marquees: 'Marquees',
    // 玩家信息
    PlayerInfo: 'PlayerInfo',
    // 绑定手机
    BindPhone: 'BindPhone',
    // 设置
    Setting: 'Setting',
    // 公告
    Notice: 'Notice',
    // 游戏规则
    GameRule: 'GameRule',
    // 商城
    Shop: 'Shop',
    // 邮箱
    Email: 'Email',
    // 修改昵称
    Rename: 'Rename',
    // 修改头像
    ChangeAvatar: 'ChangeAvatar',
    // 消息弹窗
    MessageBox: 'MessageBox',
    // 金币场选择
    CoinLobby: 'CoinLobby',
    // Debug
    Debug: 'Debug',
    // DebugMessageBox
    DebugMessageBox: 'DebugMessageBox',
    // 协议
    Agreement: 'Agreement',
    // 房卡
    // 加入键盘
    JoinKeybord: 'JoinKeybord',
    // 房卡主界面
    RoomMain: 'RoomMain',
    // 亲友圈申请记录
    GuildAskRecord: 'GuildAskRecord',
    // 亲友圈申请记录-圈主
    GuildAskRecordOwner: 'GuildAskRecordOwner',
    // 房卡转亲友圈房卡
    GuildConvertRoom: 'GuildConvertRoom',
    // 亲友圈主界面
    GuildMain: 'GuildMain',
    // 亲友圈消息弹窗
    GuildMessageBoxLarge: 'GuildMessageBoxLarge',
    // 亲友圈消息弹窗
    GuildMessageBoxSmall: 'GuildMessageBoxSmall',
    // 亲友圈公告
    GuildNotice: 'GuildNotice',
    // 亲友圈公告编辑
    GuildNoticeEdit: 'GuildNoticeEdit',
    // 亲友圈游戏记录
    PlayRecord: 'PlayRecord',
    // 亲友圈游戏记录详情
    PlayRecordDetail: 'PlayRecordDetail',
    // 我的亲友圈
    MyGuild: 'MyGuild',
    // 开房
    CreateRoom: 'CreateRoom',
    // 修改亲友圈名
    GuildRename: 'GuildRename',
    // 房间规则
    GuildRoomRule: 'GuildRoomRule',

    // 夺宝
    DuobaoMain: 'DuobaoMain',
    // 发起夺宝
    DuobaoCreate: 'DuobaoCreate',
    // 发起夺宝确认弹窗
    DuobaoCreateMessageBox: 'DuobaoCreateMessageBox',
    // 夺宝记录
    DuobaoRecord: 'DuobaoRecord',
    // 夺宝规则
    DuobaoRule: 'DuobaoRule',
    // 取消个人夺宝确认弹窗
    DuobaoCancelMessageBox: 'DuobaoCancelMessageBox',
    // 夺宝结果弹窗
    DuobaoResult: 'DuobaoResult',
    // 参与夺宝
    DuobaoJoinMessageBox: 'DuobaoJoinMessageBox',
}

/**
 * 弹窗配置
 */
export default class PopupConfig {
    public static config: { [popupName: string]: IPopupConfig } = {
        // Resources
        [PopupName.Toast]: {
            popupPath: 'prefab/component/Toast',
            bundle: Bundle_name.Common,
        },
        [PopupName.Waiting]: {
            popupPath: 'prefab/component/Waiting',
            bundle: Bundle_name.Common,
        },
        [PopupName.Dialog]: {
            popupPath: 'prefab/component/Dialog',
            bundle: Bundle_name.Common,
        },
        // Mahjong
        [PopupName.MahjongResult]: {
            popupPath: 'prefab/MahjongResult',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongResultAll]: {
            popupPath: 'prefab/MahjongResultAll',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongPlayerInfo]: {
            popupPath: 'prefab/MahjongPlayerInfo',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongChat]: {
            popupPath: 'prefab/MahjongChat',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongCoinFlow]: {
            popupPath: 'prefab/MahjongCoinFlow',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongSetting]: {
            popupPath: 'prefab/MahjongSetting',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongRecord]: {
            popupPath: 'prefab/MahjongRecord',
            bundle: Bundle_name.Mahjong,
        },
        [PopupName.MahjongDissolve]: {
            popupPath: 'prefab/MahjongDissolve',
            bundle: Bundle_name.Mahjong,
        },
        // Hall
        [PopupName.Marquees]: {
            popupPath: 'prefab/Marquees',
            bundle: Bundle_name.Hall,
        },
        // 玩家信息
        [PopupName.PlayerInfo]: {
            popupPath: 'prefab/PlayerInfo',
            bundle: Bundle_name.Hall,
        },
        // 绑定手机
        [PopupName.BindPhone]: {
            popupPath: 'prefab/BindPhone',
            bundle: Bundle_name.Hall,
        },
        // 设置
        [PopupName.Setting]: {
            popupPath: 'prefab/Setting',
            bundle: Bundle_name.Hall,
        },
        // 公告
        [PopupName.Notice]: {
            popupPath: 'prefab/Notice',
            bundle: Bundle_name.Hall,
        },
        // 游戏规则
        [PopupName.GameRule]: {
            popupPath: 'prefab/GameRule',
            bundle: Bundle_name.Hall,
        },
        // 商城
        [PopupName.Shop]: {
            popupPath: 'prefab/Shop',
            bundle: Bundle_name.Hall,
        },
        // 邮箱
        [PopupName.Email]: {
            popupPath: 'prefab/Email',
            bundle: Bundle_name.Hall,
        },
        // 修改昵称
        [PopupName.Rename]: {
            popupPath: 'prefab/Rename',
            bundle: Bundle_name.Hall,
        },
        // 修改头像
        [PopupName.ChangeAvatar]: {
            popupPath: 'prefab/ChangeAvatar',
            bundle: Bundle_name.Hall,
        },
        // 消息弹窗
        [PopupName.MessageBox]: {
            popupPath: 'prefab/MessageBox',
            bundle: Bundle_name.Hall,
        },
        // 金币场弹窗
        [PopupName.CoinLobby]: {
            popupPath: 'prefab/CoinLobby',
            bundle: Bundle_name.Hall,
        },
        // Debug
        [PopupName.Debug]: {
            popupPath: 'prefab/debug/Debug',
            bundle: Bundle_name.Hall,
        },
        // DebugMessageBox
        [PopupName.DebugMessageBox]: {
            popupPath: 'prefab/debug/DebugMessageBox',
            bundle: Bundle_name.Hall,
        },
        // 房卡
        [PopupName.JoinKeybord]: {
            popupPath: 'prefab/room/JoinKeybord',
            bundle: Bundle_name.Hall,
        },
        [PopupName.RoomMain]: {
            popupPath: 'prefab/room/RoomMain',
            bundle: Bundle_name.Hall,
        },
        // 公会
        [PopupName.GuildAskRecord]: {
            popupPath: 'prefab/room/guild/GuildAskRecord',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildAskRecordOwner]: {
            popupPath: 'prefab/room/guild/GuildAskRecordOwner',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildConvertRoom]: {
            popupPath: 'prefab/room/guild/GuildConvertRoom',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildMain]: {
            popupPath: 'prefab/room/guild/GuildMain',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildMessageBoxLarge]: {
            popupPath: 'prefab/room/guild/GuildMessageBoxLarge',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildMessageBoxSmall]: {
            popupPath: 'prefab/room/guild/GuildMessageBoxSmall',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildNotice]: {
            popupPath: 'prefab/room/guild/GuildNotice',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildNoticeEdit]: {
            popupPath: 'prefab/room/guild/GuildNoticeEdit',
            bundle: Bundle_name.Hall,
        },
        [PopupName.PlayRecord]: {
            popupPath: 'prefab/room/PlayRecord',
            bundle: Bundle_name.Hall,
        },
        [PopupName.PlayRecordDetail]: {
            popupPath: 'prefab/room/PlayRecordDetail',
            bundle: Bundle_name.Hall,
        },
        [PopupName.MyGuild]: {
            popupPath: 'prefab/room/guild/MyGuild',
            bundle: Bundle_name.Hall,
        },
        [PopupName.CreateRoom]: {
            popupPath: 'prefab/room/CreateRoom',
            bundle: Bundle_name.Hall,
        },
        [PopupName.GuildRename]: {
            popupPath: 'prefab/room/guild/GuildRename',
            bundle: Bundle_name.Hall,
        },
        // 房间规则
        [PopupName.GuildRoomRule]: {
            popupPath: 'prefab/room/guild/GuildRoomRule',
            bundle: Bundle_name.Hall,
        },

        // 夺宝
        [PopupName.DuobaoMain]: {
            popupPath: 'prefab/duobao/DuobaoMain',
            bundle: Bundle_name.Hall,
        },
        // 发起夺宝
        [PopupName.DuobaoCreate]: {
            popupPath: 'prefab/duobao/DuobaoCreate',
            bundle: Bundle_name.Hall,
        },
        // 发起夺宝确认弹窗
        [PopupName.DuobaoCreateMessageBox]: {
            popupPath: 'prefab/duobao/DuobaoCreateMessageBox',
            bundle: Bundle_name.Hall,
        },
        // 夺宝记录
        [PopupName.DuobaoRecord]: {
            popupPath: 'prefab/duobao/DuobaoRecord',
            bundle: Bundle_name.Hall,
        },
        // 夺宝规则
        [PopupName.DuobaoRule]: {
            popupPath: 'prefab/duobao/DuobaoRule',
            bundle: Bundle_name.Hall,
        },
        // 取消个人夺宝确认弹窗
        [PopupName.DuobaoCancelMessageBox]: {
            popupPath: 'prefab/duobao/DuobaoCancelMessageBox',
            bundle: Bundle_name.Hall,
        },
        // 夺宝结果弹窗
        [PopupName.DuobaoResult]: {
            popupPath: 'prefab/duobao/DuobaoResult',
            bundle: Bundle_name.Hall,
        },
        // 参与夺宝
        [PopupName.DuobaoJoinMessageBox]: {
            popupPath: 'prefab/duobao/DuobaoJoinMessageBox',
            bundle: Bundle_name.Hall,
        },
        // 协议
        [PopupName.Agreement]: {
            popupPath: 'prefab/Agreement',
            bundle: Bundle_name.Hall,
        },
    }
}