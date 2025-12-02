import { _decorator } from "cc";
import { Bundle_name, Scene_name } from "../../frame/config/Config";
import vv from "../../frame/Core";
import { SceneBase } from "../../frame/ui/SceneBase";
import SceneNavigator from "../../frame/ui/SceneNavigator";

const { ccclass } = _decorator;
@ccclass
export default class Hall extends SceneBase {
    public static instance: Hall = null;

    protected onLoad(): void {
        super.onLoad();
        Hall.instance = this;
        vv.memmory.clearRoomData();
        SceneNavigator.setHome(Scene_name.Hall);
        vv.audio.playMusic("resources/audio/datingbeij", Bundle_name.Hall)
    }

    protected onDestroy(): void {
        super.onDestroy();
        vv.event.removeAllByTarget(this);
        Hall.instance = null;
    }

}