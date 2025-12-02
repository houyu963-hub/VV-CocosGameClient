import { CCInteger, Component, Sprite, SpriteFrame, _decorator } from "cc";

/**
 * 图片显隐性控制
 */
const { ccclass, property, integer, requireComponent, menu } = _decorator;
@ccclass
@requireComponent(Sprite)
@menu('Custom/ActiveSprite')
export default class ActiveSprite extends Component {

    @property([SpriteFrame])
    spriteFrame: SpriteFrame[] = [];

    _index: number = 0;
    @property({
        type: CCInteger,
        range: [0, 10],
    })

    public set index(idx: number) {
        this._index = idx;
        this.node.getComponent(Sprite).spriteFrame = this.spriteFrame[idx];
    }

    public get index(): number {
        return this._index;
    }

}
