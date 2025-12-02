import { Component, EventHandler, Layout, Node, UITransform, _decorator, game } from "cc";
import vv from "../Core";

/**
 * 循环滚动列表
 */
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/CircleScrollList')
export default class CircleScrollList extends Component {
    @property({ tooltip: '滚动列表', type: Node }) list: Node = null;
    @property({ tooltip: '滚动速度' }) speed: number = 0.05;
    @property({ tooltip: '更新事件', type: EventHandler }) updateEvents: EventHandler[] = [];

    private _data: any[] = [];
    private _isInited: boolean = false;
    private _isCanScroll: boolean = false;
    private _lastTime: number = 0;
    private _nextIndex: number = 0;
    private _item: Node = null;
    private _direction: number = 0;

    protected onLoad(): void {
        this._item = this.list.children[0];
        this._direction = this.list.getComponent(Layout).verticalDirection;
    }

    /**
     * 初始化
     * @param arr 
     * @returns 
     */
    public init(arr: unknown[]): void {
        if (this._isInited) return;
        if (!arr || !Array.isArray(arr) || arr.length == 0) {
            this.unscheduleAllCallbacks();
            this.list.children.forEach((child, i) => child.active = false);
            return;
        }
        // 深拷贝一份数据
        let copy_arr = vv.utils.deepCopy(arr);
        this._data = copy_arr;
        this._nextIndex = this.list.children.length;
        // 初始化数据
        this.list.children.forEach((child, i) => {
            child.active = !!copy_arr[i] || copy_arr[i] === 0;
            if (child.active) {
                EventHandler.emitEvents(this.updateEvents, child, copy_arr[i]);
            }
        })
        this.list.getComponent(Layout).updateLayout();
        // 滚动
        this._isCanScroll = this._data.length > this.list.children.length - 1;
    }

    /**
     * 更新数据
     * @param data 
     */
    public updateData(data: unknown[]): void {
        this._data = data;
    }

    protected update(): void {
        if (this._isCanScroll) {
            let delta: number = 0;
            let currentTime: number = game.totalTime;
            if (this._lastTime > 0) {
                delta = currentTime - this._lastTime;
            }
            this._lastTime = currentTime;
            let deltaY = delta * this.speed;
            const POS = this.list.getPosition();
            let target_y: number = this._direction === 0 ? POS.y - deltaY : POS.y + deltaY;
            this.list.setPosition(POS.x, target_y)
            while (this.checkBoundary()) {
                // 获取下一个列表数据
                this._nextIndex++;
                if (this._nextIndex >= this._data.length) {
                    this._nextIndex = 0;
                }
                let data = this._data[this._nextIndex];
                // 把第一个item放到末尾
                let it = this.list.children[0];
                it.setSiblingIndex(this._data.length);
                EventHandler.emitEvents(this.updateEvents, it, data);
                let layout = this.list.getComponent(Layout);
                layout.updateLayout();
                let spacing_y = layout.spacingY;
                const POS = this.list.getPosition();
                // 向下移动
                if (this._direction === 0) {
                    this.list.setPosition(POS.x, POS.y + this._item.getComponent(UITransform).height + spacing_y);
                } else {
                    // 向上移动
                    this.list.setPosition(POS.x, POS.y - this._item.getComponent(UITransform).height - spacing_y);
                }
            }
        }
    }

    /**
     * 检查移动距离，确定是否可以显示下一条数据了
     * @returns 
     */
    private checkBoundary(): boolean {
        if (this._direction === 0) {
            return this.list.getPosition().y < -this._item.getComponent(UITransform).height;
        } else {
            return this.list.getPosition().y > this._item.getComponent(UITransform).height;
        }
    }

}