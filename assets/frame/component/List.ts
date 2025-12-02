import { Component, Layout, Node, _decorator, instantiate } from "cc";
import BaseClass from "../ui/BaseClass";

/**
 * 显示列表，item重复利用，不销毁，只控制active属性，在显示数量过多时建议使用分帧加载或虚拟列表
 * @example
 * CustomList.setList(['1','2','3'],() => {
 *     // todo something
 * })
 */
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/List')
export default class List extends Component {
    @property({ type: Node }) template: Node = null;
    public data: any[] = [];

    /**
     * 设置列表数据
     * @param res 原数据
     * @param cb 每实例化一个item回调一次(js: BaseClass, data: T, index: number, node: Node) => {
     * @param cb 
     *  js：若item挂有BaseClass的脚本，则返回该脚本
     *  data：数据
     *  index：索引
     *  node：item
     * }
     */
    public setList<T>(res: Array<T>, cb?: (js: BaseClass, data: T, index: number, node: Node) => boolean | any) {
        this.data = res;
        for (let i = 0; i < res.length; i++) {
            let node = this.node.children[i] || instantiate(this.template ?? this.node.children[0]);
            node.parent = this.node;
            let ts = node.getComponent(BaseClass);
            if (ts) {
                ts.saveData(res[i]);
            } else {
                node.attr({ customData: res[i] });
            }
            node.active = !cb?.(ts, res[i], i, node);
        }
        for (let i = res.length; i < this.node.children.length; i++) {
            this.node.children[i].active = false;
            let ts = this.node.children[i].getComponent(BaseClass);
            if (ts) {
                ts.saveData(null);
            }
        }
        this.node.getComponent(Layout).updateLayout();
    }

    /**
     * 搜素
     * @param cb 遍历原数据，每循环一次回调一次
     * @param cb 
     *  js：若item挂有BaseClass的脚本，则返回该脚本
     *  data：数据
     *  index：索引
     * @example
     * CustomList.search((js: BaseClass, data: T, index: number) => {
     *      return data === 1;
     * })
     */
    public search<T>(cb: (js: BaseClass, data: T, index: number) => boolean) {
        for (let i = 0; i < this.data.length; i++) {
            let node = this.node.children[i];
            if (node == null) {
                continue;
            }
            let ts = node.getComponent(BaseClass);
            node.active = cb(ts, this.data[i], i);
        }
    }

}
