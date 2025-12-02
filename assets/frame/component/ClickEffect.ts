import { Component, EventTouch, Node, NodePool, _decorator, instantiate, sp, v3 } from "cc";
import vv from "../Core";
import { Bundle_name } from "../config/Config";

/**
 * 全局点击动画
*/
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/ClickEffect')
export default class ClickEffect extends Component {
    public static nodePool: NodePool = new NodePool();

    protected onLoad(): void {
        let skeletonNode = new Node();
        vv.asset.loadRes('ske/touch/action', sp.SkeletonData, (err, data) => {
            let skeleton = skeletonNode.addComponent(sp.Skeleton);
            skeleton.skeletonData = data;
            skeleton.premultipliedAlpha = false;
            skeleton.loop = false;

            this.node.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
                let pos = event.touch.getUILocation();
                let node = ClickEffect.nodePool.get() || instantiate(skeletonNode);
                node.parent = this.node;
                node.setWorldPosition(v3(pos.x, pos.y));
                node.active = true;
                let eff = node.getComponent(sp.Skeleton);
                eff.animation = 'action';
                eff.setCompleteListener(() => {
                    ClickEffect.nodePool.put(node);
                })
            }, this, true)
        }, Bundle_name.Hall)
    }
}
