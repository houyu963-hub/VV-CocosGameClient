import { _decorator, Component, Node, v3 } from "cc";

const { ccclass, property, executeInEditMode } = _decorator;

// 用于调整位置
@ccclass
@executeInEditMode
export default class Layout3D extends Component {

    @property
    _offset: number = 0;
    @property
    set offset(value: number) {
        this._offset = value;
        this._updateView();
    }

    get offset() {
        return this._offset;
    }

    @property
    _minScale: number = 1;
    @property
    set minScale(value: number) {
        this._minScale = value;
        this._updateView();
    }

    get minScale() {
        return this._minScale;
    }

    @property
    _maxScale: number = 1;
    @property
    set maxScale(value: number) {
        this._maxScale = value;
        this._updateView();
    }

    get maxScale() {
        return this._maxScale
    }


    _items: Node[] = [];
    get items() {
        if (this._items.length == 0) {
            for (let i in this.node.children) {
                this._items[i] = this.node.children[i];
            }
        }
        return this._items;
    }

    _updateView() {
        let scale = (this.maxScale - this.minScale) / (this.items.length - 1);
        this.items.forEach((item, index) => {
            item.setPosition(index * this._offset, item.getPosition().y, 0);
            let _scale = scale * index + this.minScale;
            item.scale = v3(_scale, _scale, 1);
        })
    }
}
