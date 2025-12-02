import { Component, Layout, _decorator } from "cc";
import vv from "../Core";
import { Config } from "../config/Config";

const { ccclass, requireComponent, menu } = _decorator;

@ccclass
@requireComponent(Layout)
@menu('Custom/LayoutPro')
export default class LayoutPro extends Component {
    private _spacingY: number;

    protected onLoad(): void {
        let layout = this.getComponent(Layout);
        this._spacingY = layout.spacingY;

        let verticalSpacing = (vv.memmory.screen_h - Config.design_height) / 100 * 10;// 每增减100像素 间距增减10
        let value = this._spacingY;
        value += verticalSpacing;

        let spacingY = Math.min(Math.max(value, 10), this._spacingY); // 保持间距不小于10
        layout.spacingY = spacingY;
        this._spacingY = spacingY;
        layout.updateLayout();
    }
}