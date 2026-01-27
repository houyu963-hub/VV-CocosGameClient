import { _decorator } from "cc";
import vv from "../../frame/Core";
import { SceneBase } from "../../frame/ui/SceneBase";

const { ccclass, property } = _decorator;
@ccclass
export default class Login extends SceneBase {
    protected onLoad(): void {
        super.onLoad();
        vv.event.on(vv.eventType.onWxLoginSucc, this.onWxLoginSucc, this);
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private onWxLoginSucc(): void {
    }

    private _onBtLogin(): void {

    }

}