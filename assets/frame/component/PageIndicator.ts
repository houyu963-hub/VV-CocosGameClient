import { Node, PageViewIndicator, _decorator, instantiate } from "cc";

const { ccclass, property } = _decorator;
@ccclass
export class PageIndicator extends PageViewIndicator {

    @property({ type: Node }) sign: Node = null;
    // @property isLoop: boolean = true;

    protected onEnable(): void {
        this._changedState();
    }

    public _createIndicator() {
        const node = instantiate(this.sign);
        node.parent = this.node;
        // if (this.isLoop) {
        // node.active = node.getSiblingIndex() !== 0 && node.getSiblingIndex() !== this._pageView.node.getComponent(SuperPageView).data.length + 1
        // } else {
        node.active = true;
        // }
        node.setPosition(0, 0, 0);
        node._uiProps.uiTransformComp!.setContentSize(this._cellSize);
        return node;
    }

    public _changedState() {
        const indicators = this._indicators;
        if (indicators.length === 0 || !this._pageView) { return; }
        const idx = this._pageView.curPageIdx;
        if (idx >= indicators.length) { return; }
        for (let i = 0; i < indicators.length; ++i) {
            const node = indicators[i];
            if (!node._uiProps.uiComp) {
                continue;
            }
            node.getChildByName('bar').active = false;
        }
        if (indicators[idx]._uiProps.uiComp) {
            indicators[idx].getChildByName('bar').active = true;
        }
    }

}