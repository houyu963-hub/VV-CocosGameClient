import { _decorator, sp, tween, Tween, v3, Vec3 } from 'cc';
import ActiveSprite from 'db://assets/frame/component/ActiveSprite';
import vv from 'db://assets/frame/Core';
import BaseClass from 'db://assets/frame/ui/BaseClass';
import { MYSELF_VIEW_ID } from '../../script/GameClient';
const { ccclass } = _decorator;

/**
 * 定缺状态 定缺界面
 */
@ccclass
export class StateDingque extends BaseClass {
    private _position: Vec3[] = [];

    protected onLoad(): void {
        for (let index = 0; index < this.$('_dingqueResult').children.length; index++) { // 记录位置
            const element = this.$('_dingqueResult').children[index];
            this._position[index] = element.getPosition();
        }
    }

    // 显示操作按钮 recommendedDingqueSuit:推荐定缺 1万 2条 3筒 
    public showOperateBtn(boo: boolean, recommendedDingqueSuit: number): void {
        this.$('_operateBtn').active = boo;
        let spine = this.$('_btOperate#' + recommendedDingqueSuit).getChildByName('spine');
        let ske = spine.getComponent(sp.Skeleton);
        let animationName = `dingque_${['wan', 'tiao', 'tong'][recommendedDingqueSuit - 1]}`;
        ske.setAnimation(0, animationName, true);
        ske.paused = false;
        // 停止非推荐定缺动画
        for (let index = 1; index <= 3; index++) {
            if (index === recommendedDingqueSuit) continue;
            let spine = this.$('_btOperate#' + index).getChildByName('spine');
            let ske = spine.getComponent(sp.Skeleton);
            // 先停止所有动画
            ske.clearTracks();
            // 设置到初始状态
            ske.setToSetupPose();
            // 添加动画但立即暂停
            ske.setAnimation(0, `dingque_${['wan', 'tiao', 'tong'][index - 1]}`, false);
            ske.paused = true;
        }
    }

    // 显示其他玩家定缺中
    public showOtherDingque(boo: boolean): void {
        this.$('_otherDingque').active = boo;
    }

    // 更新定缺进度 viewID:刚完成定缺的玩家
    public updateDingQueProgress(viewID: number): void {
        if (viewID < 0) return;
        this.$('_otherDingque').children[viewID].active = false;
        if (viewID === MYSELF_VIEW_ID) {
            this.$('_operateBtn').active = false;
        }
    }

    // 显示定缺结果 suits:定缺玩家定的花色 posArray:显示缺的位置本地坐标
    public showDingqueResult(suits: { [viewID: number]: number }, posArray: Vec3[], callback: () => void): void {
        this.$('_dingqueResult').active = true;
        for (const viewID in suits) {
            const suit = suits[viewID];
            this.$('_dingqueResult').children[viewID].getComponent(ActiveSprite).index = suit;
        }
        this.$('_dingqueResult').children.forEach((item, viewID) => {
            Tween.stopAllByTarget(item);
            item.setPosition(this._position[viewID]);
            item.scale = v3(1, 1, 1);
            tween(item)
                .delay(0.5)
                .to(0.7, { scale: v3(0.3, 0.3, 1), position: posArray[viewID] }, { easing: 'backIn' })
                .call(() => {
                    callback?.();
                })
                .start();
        })
    }

    // 重置UI
    public resetView(): void {
        this.$('_operateBtn').active = false;
        this.$('_otherDingque').active = false;
        this.$('_dingqueResult').active = false;
        this.$('_dingqueResult').children.forEach(item => { Tween.stopAllByTarget(item) });
    }

    private _onBtOperate(event: TouchEvent, data: string): void {
        let param = {
            DingqueType: Number(data),
        }
        let _proxy = vv.memmory.gameClient._proxy;
        if (_proxy && _proxy.reqDingque) {
            _proxy.reqDingque(param);
        }
    }
}