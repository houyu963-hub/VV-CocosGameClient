import { Component, EventHandler, Node, UITransform, Vec3, _decorator, instantiate, tween, v3 } from "cc";

/**
 * 循环滚动行
 */
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/CircleScrollLine')
export default class CircleScrollLine extends Component {
    @property({ tooltip: '滚动节点', type: Node }) scroll_node: Node = null;
    @property({ tooltip: '滚动时间间隔' }) delay: number = 3;
    @property({ tooltip: '循环滚动' }) loop: boolean = true;
    @property({ type: EventHandler }) updateEvents: EventHandler[] = [];

    private _isRolling: boolean;

    private _data: unknown[] = [];
    private _currIndex: number = 0;
    private _position = {
        top: v3(0, 0, 0),
        centre: v3(0, 0, 0),
        bottom: v3(0, 0, 0),
    }

    protected onLoad(): void {
        this._position.top = v3(0, this.scroll_node.getComponent(UITransform).height);
        this._position.centre = v3(0, 0);
        this._position.bottom = v3(0, -this.scroll_node.getComponent(UITransform).height);

        let node = instantiate(this.scroll_node);
        node.parent = this.scroll_node.parent;
        node.position = this._position.bottom;
    }

    /**
     * 开始滚动
     * @returns 
     */
    public startRoll(data: unknown[]): void {
        if (!data || data.length === 0) {
            return;
        }
        this._data = data;
        if (this._isRolling) {
            return;
        }
        this._isRolling = true;
        this.schedule(() => {
            let parent = this.scroll_node.parent;
            let first_child = parent.children[0];
            let second_node = parent.children[1];
            // 设置数据
            let data = this._data[this._currIndex];
            if (data) {
                EventHandler.emitEvents(this.updateEvents, second_node, data);
            }
            this.move(first_child, this._position.top, () => {
                // 放到最下面
                first_child.setPosition(this._position.bottom);
                // 赋值下一条数据
                let next = this.getNextData();
                if (next) {
                    EventHandler.emitEvents(this.updateEvents, first_child, next);
                }
            })
            // 把第二个移到中间显示
            second_node.active = true;
            this.move(second_node, this._position.centre, () => {
                // 设置第二个节点索引为0
                second_node.setSiblingIndex(0);
            })
        }, this.delay)
    }

    /**
     * 停止滚动
     */
    private stoptRoll(): void {
        this._isRolling = false;
        this.unscheduleAllCallbacks();
    }

    /**
     * 移动节点动画
     */
    private move(target: Node, position: Vec3, callback?: () => void): void {
        tween(target)
            .to(1, { position: position })
            .call(() => {
                callback?.();
            })
            .start()
    }

    /**
     * 获取下一个数据
     * @returns 
     */
    private getNextData(): unknown {
        this._currIndex++;
        if (this._currIndex >= this._data.length) {
            if (this.loop) {
                this._currIndex = 0;
            } else {
                this.stoptRoll();
                return null;
            }
        }
        return this._data[this._currIndex];
    }
}