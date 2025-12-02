import { CCInteger, Component, Node, _decorator } from "cc";

/**
 * 节点显隐性控制
 */
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/ActiveNode')
export default class ActiveNode extends Component {

    @property([Node])
    nodes: Node[] = [];

    _index: number = 0;
    @property({
        type: CCInteger,
        range: [0, 10],
    })

    public set index(idx: number) {
        this._index = idx;
        this.nodes.forEach((v, index) => {
            if (v) v.active = index === idx;
        })
    }

    public get index(): number {
        return this._index;
    }

    public getCurrNode(): Node {
        return this.nodes[this.index];
    }

}
