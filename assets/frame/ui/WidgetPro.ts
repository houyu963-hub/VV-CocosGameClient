import { Component, Widget, _decorator } from "cc";
import vv from "../Core";
import { Config } from "../config/Config";

const { ccclass, requireComponent, menu } = _decorator;

@ccclass
@requireComponent(Widget)
@menu('Custom/WidgetPro')
export default class WidgetPro extends Component {

    protected onLoad(): void {
        let wedget = this.getComponent(Widget);
        let ratio = vv.memmory.screen_h / Config.design_height;
        wedget.top *= ratio;
        wedget.bottom /= ratio;
        wedget.left *= ratio;
        wedget.right *= ratio;
        wedget.updateAlignment();
    }
}