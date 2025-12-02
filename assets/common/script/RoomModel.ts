import { Bundle_name, Scene_name } from "../../frame/config/Config";
import vv from "../../frame/Core";
import SceneNavigator from "../../frame/ui/SceneNavigator";
import { Battle, Enum, Match } from "../../resources/pbjs";

/**
 * 房间模块 处理进出房间逻辑
 */
export default class RoomModel {
    private static _instance: RoomModel = null;
    public static get instance(): RoomModel { return this._instance ?? (this._instance = new RoomModel()); }
    public msgHandler: { [key: number]: Function } = {};

    // 请求：开始匹配
    public async reqStartMatch(param: Match.IReqStartMatch): Promise<void> {
        vv.utils.showWaiting();
        vv.network.send('Match.ReqStartMatch', 'Match.RspStartMatch', param, async (res: Match.IRspStartMatch) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                vv.utils.removeWaiting();
                return;
            }
            this.enterGameRoom(res.RoomInfo);
        })
    }

    // 请求: 准备状态设置
    public async reqSetReadyStatus(param: Match.IReqSetReadyStatus, callback?: (success: boolean) => void): Promise<boolean> {
        return new Promise<boolean>(async resolve => {
            vv.network.send('Match.ReqSetReadyStatus', 'Match.RspSetReadyStatus', param, (res: Match.IRspSetReadyStatus) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    callback?.(false);
                    resolve(false);
                    return;
                }
                callback?.(true);
                resolve(true);
            })
        })
    }

    // 请求：退出匹配房间
    public reqLeaveRoom(param: Match.IReqLeaveRoom, callback?: (success: boolean) => void): void {
        vv.network.send('Match.ReqLeaveRoom', 'Match.RspLeaveRoom', param, (res: Match.IRspLeaveRoom) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                vv.utils.removeWaiting();
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }

    // 根据房间ID进入游戏房间
    public async enterGameRoomByRoomID(roomID: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            let param: Match.IReqGetRoomInfo = {
                RoomID: roomID
            }
            // 请求：获取房间信息
            vv.network.send('Match.ReqGetRoomInfo', 'Match.RspGetRoomInfo', param, async (res: Match.IRspGetRoomInfo) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    vv.utils.removeWaiting();
                    resolve(false);
                    return;
                }
                this.enterGameRoom(res.Room, () => { // 进入游戏房间
                    resolve(true);
                })
            })
        })
    }

    /**
     * 请求：加入个人房卡房间
     * @param roomID 房间ID（6位数字）
     */
    public async reqJoinPersonalRoom(roomID: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const param: Match.IReqJoinPersonalRoom = {
                RoomID: roomID,
            };
            vv.network.send('Match.ReqJoinPersonalRoom', 'Match.RspJoinPersonalRoom', param, (res: Match.IRspJoinPersonalRoom) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    vv.utils.removeWaiting();
                    resolve(false);
                    return;
                }
                this.enterGameRoom(res.RoomInfo, () => { // 进入游戏房间
                    resolve(true);
                })
            })
        })
    }

    // 请求：加入亲友圈房间
    public async reqJoinGuildRoom(param: Match.IReqJoinGuildRoom): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            vv.network.send('Match.ReqJoinGuildRoom', 'Match.RspJoinGuildRoom', param, async (res: Match.RspJoinGuildRoom) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    vv.utils.removeWaiting();
                    resolve(false);
                } else {
                    await this.enterGameRoomByRoomID(res.RoomInfo.RoomID);
                    resolve(true);
                }
            })
        })
    }

    /**
     * 获取个人房卡房间默认规则
     * @returns Promise<Match.RspGetPersonalRoomDefaultRule>
     * @throws 获取失败时抛出异常
     */
    public async reqGetPersonalRoomDefaultRule(): Promise<Match.IRspGetPersonalRoomDefaultRule> {
        return new Promise((resolve, reject) => {
            vv.network.send('Match.ReqGetPersonalRoomDefaultRule', 'Match.RspGetPersonalRoomDefaultRule', {}, (res: Match.IRspGetPersonalRoomDefaultRule) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    reject(new Error(res.Message));
                    vv.utils.removeWaiting();
                } else {
                    resolve(res);
                }
            });
        });
    }

    // 请求: 申请提前解散房间
    public async reqApplyEarlyTermination(roomID: string, callback?: (success: boolean) => void): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            let param: Match.IReqApplyEarlyTermination = {
                RoomID: roomID,
            }
            vv.network.send('Match.ReqApplyEarlyTermination', 'Match.RspApplyEarlyTermination', param, (res: Match.IRspApplyEarlyTermination) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    callback?.(false);
                    resolve(false);
                } else {
                    resolve(true);
                    callback?.(true);
                }
            });
        });
    }

    // 请求：是否同意提前结束
    public async reqProcessEarlyTermination(roomID: string, agree: boolean): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            let param: Match.IReqProcessEarlyTermination = {
                RoomID: roomID,
                Agree: agree,
            }
            vv.network.send('Match.ReqProcessEarlyTermination', 'Match.RspProcessEarlyTermination', param, (res: Match.IRspProcessEarlyTermination) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // 请求：重连战斗
    public async reqRejoinRoomBattle(): Promise<Battle.IRspRejoinRoomBattle> {
        vv.utils.showWaiting();
        return new Promise<Battle.IRspRejoinRoomBattle>((resolve, reject) => {
            vv.network.send('Battle.ReqRejoinRoomBattle', 'Battle.RspRejoinRoomBattle', undefined, (res: Battle.IRspRejoinRoomBattle) => {
                if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                    vv.utils.showToast(res.Message);
                    vv.utils.removeWaiting();
                    resolve(null);
                    return;
                }
                vv.utils.removeWaiting();
                resolve(res);
            }, () => {
                vv.utils.removeWaiting();
            })
        })
    }

    // 进入游戏房间 
    public async enterGameRoom(roomInfo: Enum.IRoomInfo, callback?: () => void, sceneName: Scene_name = Scene_name.Mahjong): Promise<void> {
        await this.loadSubGameBundle(roomInfo);
        vv.memmory.room_id = roomInfo.RoomID; // 记录当前房间ID
        SceneNavigator.go(sceneName, null, () => {
            callback?.();
            vv.utils.removeWaiting(true);
            vv.memmory.gameClient?.init?.();
        })
    }

    /**
     * 加载子游戏包
     * @param roomInfo 房间信息
     */
    private async loadSubGameBundle(roomInfo?: Enum.IRoomInfo): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            await vv.asset.loadBundle(Bundle_name.Mahjong);
            import('../../game/mahjong/script/MahjongModel')
                .then((module) => {
                    const model = module.default.instance;
                    model.init(roomInfo);
                    resolve();
                })
        })
    }

}