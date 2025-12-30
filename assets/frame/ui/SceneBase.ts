import { _decorator, find, instantiate, Prefab, Widget } from 'cc';
import Thirdparty, { NativeEventId } from 'db://assets/frame/system/Thirdparty';
import vv from '../Core';
import ClickEffect from '../component/ClickEffect';
import { Bundle_name, Scene_name } from '../config/Define';
import BaseClass from './BaseClass';
import { PopupName } from './PopupConfig';
import SceneNavigator from './SceneNavigator';
const { ccclass } = _decorator;

@ccclass
export class SceneBase extends BaseClass {
    private _popupQueue: Function[] = [];
    private _starting: boolean = false;

    protected onLoad(): void {
        this.addComponent(ClickEffect);

        vv.ui.clear();
        vv.event.on(vv.eventType.onAppUpdate, this.onAppUpdate, this);
        vv.event.on(vv.eventType.onSocketColse, this.onSocketClose, this);
        vv.event.on(vv.eventType.onNativeBack, this.onNativeBack, this);

        // 游戏内跑马灯
        if (vv.memmory.room_id) {
            return; // 暂时不弹
            vv.asset.loadRes('prefab/Marquees', Prefab, (err: any, prefab: Prefab) => {
                if (err) {
                    return;
                }
                let node = instantiate(prefab);
                if (this.node?.isValid) {
                    node.parent = this.node;
                    let widget = node.getComponent(Widget);
                    if (!widget) {
                        widget = node.addComponent(Widget);
                    }
                    widget.top = 0;
                }
            }, Bundle_name.Hall)
        }
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private onAppUpdate(): void {
        vv.event.emit(vv.eventType.blockInput, true); // 强更！不允许玩家操作
    }

    /**
     * 断开连接
     * @param code 
     */
    private onSocketClose(code: number): void {
        switch (code) {
            case 1000: // 正常关闭
                break;
            case 4000: // 心跳失败
                console.log('心跳失败，重新连接');
                vv.event.emit(vv.eventType.autoLogin);
                break;
            default: // 非正常断开
                this.opneDialog(code);
                break;
        }
    }

    /**
     * 打开对话弹窗 子类可重写以具体实现
     */
    protected opneDialog(code: number): void {
        vv.utils.showDialog({
            content: `连接断开[code:${code}],请重新登录`,
            confirmCb: () => {
                vv.event.emit(vv.eventType.autoLogin);
            },
            btnStyle: 0
        })
    }

    /**
     * 原生端触发返回按键
     * @returns 
     */
    protected onNativeBack(): void {
        let haveClose = false;
        let popup = vv.ui.current;
        if (popup?.node.isValid && popup.node.active) {
            haveClose = true;
            switch (popup.node.name) {
                case PopupName.Dialog:
                case PopupName.Toast:
                case PopupName.Waiting:
                    break;
                default:
                    popup.popup.close();
                    break;
            }
        }
        if (haveClose) return;
        switch (SceneNavigator.curScene) {
            case Scene_name.Loading:
            case Scene_name.Login:
            case Scene_name.Hall:
                vv.utils.showDialog({
                    content: '是否退出游戏?',
                    confirmCb: () => {
                        Thirdparty.callThirdparty(NativeEventId.ExitApp);
                    },
                    btnStyle: 3,
                })
                break;
            default:
                let gameClient: any = find('Canvas').getComponent('GameClient');
                gameClient?.onNativeBackHander?.();
                break;
        }
    }
}