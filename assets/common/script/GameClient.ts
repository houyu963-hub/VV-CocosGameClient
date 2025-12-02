import { _decorator } from "cc";
import vv from "../../frame/Core";
import { SceneBase } from "../../frame/ui/SceneBase";

export const INVALID_CHAIR = -1;
export const MYSELF_VIEW_ID = 0;

const { ccclass, property } = _decorator;

/**
 * 主游戏脚本基类 包含游戏基础处理函数
 */
@ccclass
export default class GameClient extends SceneBase {
    public meChairID: number = INVALID_CHAIR;

    protected onLoad(): void {
        super.onLoad();
        vv.memmory.gameClient = this;
    }

    protected onDestroy(): void {
        super.onDestroy();
        vv.memmory.gameClient = null;
        this.unscheduleAllCallbacks();
    }

    /**
    * 游戏场景初始化函数
    * 子类重写以具体实现
    */
    public init(): void { };

    /**
     * 服务器位置转客户端位置
     * @param chairID 
     * @returns 
     */
    public chair2View(chairID: number): number {
        if (chairID === INVALID_CHAIR) return INVALID_CHAIR;
        return (Number(chairID) + this.maxPlayerCnt - this.meChairID + MYSELF_VIEW_ID) % this.maxPlayerCnt;
    }

    /**
     * 客户端位置转服务器位置
     * @param viewID 
     * @returns 
     */
    public view2Chair(viewID: number): number {
        return (Number(viewID) + this.maxPlayerCnt - MYSELF_VIEW_ID + (this.meChairID - 1)) % this.maxPlayerCnt + 1;
    }

    /**
     * 最大玩家数
     * 子类重写以具体实现
     */
    public get maxPlayerCnt(): number { return 4; }

    /**
     * 最大手牌数
     * 子类重写以具体实现
     */
    public get maxCardCnt(): number { return 14; }
}