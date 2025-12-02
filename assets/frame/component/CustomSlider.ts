import { _decorator, Node, Slider, UITransform } from "cc";

const { ccclass, property, menu } = _decorator;

@ccclass
@menu('Custom/CustomSlider')
export default class CustomSlider extends Slider {
    @property(Node) mask: Node = null;

    _progress: number = 0;
    @property({
        override: true,
        range: [0, 1]
    })
    set progress(pro: number) {
        this._progress = pro;
        if (this.direction == Slider.Direction.Horizontal) {
            this.mask.getComponent(UITransform).width = this.progress * this.node.getComponent(UITransform).width;
            this.handle.node.setPosition(this.mask.getPosition().x + this.mask.getComponent(UITransform).width, this.handle.node.getPosition().y);
        } else {
            this.mask.getComponent(UITransform).height = this.progress * this.node.getComponent(UITransform).height;
            this.handle.node.setPosition(this.mask.getPosition().x, this.mask.getPosition().y + this.mask.getComponent(UITransform).height);
        }
    }
    get progress(): number {
        return this._progress;
    }
}
