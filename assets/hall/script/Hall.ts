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