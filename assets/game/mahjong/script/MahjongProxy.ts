import vv from "db://assets/frame/Core";
import { Battle } from "db://assets/resources/pbjs";

/**
 * 请求代理
 */
export class MahjongProxy {
    private static _instance: MahjongProxy = null;
    public static get instance(): MahjongProxy { return this._instance ?? (this._instance = new MahjongProxy()) };

    // 请求换牌
    public reqExchange(param: Battle.IReqExchange, callback?: (success: boolean) => void): void {
        vv.network.send('Battle.ReqExchange', 'Battle.RspExchange', param, (res: Battle.IRspExchange) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }

    // 请求定缺
    public reqDingque(param: Battle.IReqDingque): void {
        vv.network.send('Battle.ReqDingque', 'Battle.RspDingque', param, (res: Battle.IRspDingque) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                return;
            }
        })
    }

    // 请求出牌
    public reqPutCard(param: Battle.IReqPutCard, callback?: (success: boolean) => void): void {
        vv.network.send('Battle.ReqPutCard', 'Battle.RspPutCard', param, (res: Battle.IRspPutCard) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }

    // 请求统一的玩家操作（碰/杠/胡/过）
    public reqPlayerAction(param: Battle.IReqPlayerAction, callback?: (success: boolean) => void): void {
        vv.network.send('Battle.ReqPlayerAction', 'Battle.RspPlayerAction', param, (res: Battle.IRspPlayerAction) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed && param.Action !== vv.pb.Enum.Action.ACTION_CANCEL) {
                vv.utils.showToast(res.Message);
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }

    // 请求托管（托管和取消托管共用）
    public reqAutoPlay(param: Battle.IReqAutoPlay, callback?: (success: boolean) => void): void {
        vv.network.send('Battle.ReqAutoPlay', 'Battle.RspAutoPlay', param, (res: Battle.IRspAutoPlay) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }

    // 请求设置摸牌配置
    public reqSetDrawCardPreset(param: Battle.IReqSetDrawCardPreset, callback?: (success: boolean) => void): void {
        vv.network.send('Battle.ReqSetDrawCardPreset', 'Battle.RspSetDrawCardPreset', param, (res: Battle.IRspSetDrawCardPreset) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }
}