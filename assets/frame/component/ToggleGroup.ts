import { Button, CCBoolean, CCInteger, Component, EventHandler, Node, _decorator } from "cc";
import vv from "../Core";
import { Bundle_name } from "../config/Config";
import ActiveNode from "./ActiveNode";
import ActiveSprite from "./ActiveSprite";

/**
 * 自定义toggleGroup
 */
const { ccclass, property, menu } = _decorator;
@ccclass
@menu('Custom/ToggleGroup')
export default class ToggleGroup extends Component {
    @property({ type: CCBoolean, tooltip: '如果这个设置为 true，那么 toggle 按钮在被点击的时候可以反复地被选中和未选中。' }) allowSwitchOff: boolean;
    @property({ type: CCBoolean, tooltip: '禁止多选', visible: function () { return this.allowSwitchOff } }) noMore: boolean;

    private _indexs: number[] = [];

    public get indexs(): number[] {
        return this._indexs;
    }

    public set indexs(value: number[]) {
        this._indexs = value;
        this.node.children.forEach((v, i) => {
            let component = v.getComponent(ActiveSprite) ?? v.getComponent(ActiveNode);
            component.index = this._indexs.includes(i) ? 1 : 0;
        })
    }

    _index: number = 0;
    @property({
        type: CCInteger,
        range: [0, 10],
    })

    public set index(idx: number) {
        this._index = idx;
        this.node.children.forEach((v, i) => {
            let component = v.getComponent(ActiveSprite) ?? v.getComponent(ActiveNode)
            component.index = idx === i ? 1 : 0;
        })
    }

    public get index(): number {
        return this._index;
    }

    public getCurrNode(): Node {
        return this.node.children[this.index];
    }

    @property({ type: EventHandler }) checkEvents: EventHandler[] = [];

    protected onLoad(): void {
        this.node.children.forEach((v, i) => {
            let eventHandler: EventHandler = new EventHandler();
            eventHandler.target = this.node;
            eventHandler.component = this.name.match(/<.*>$/)[0].slice(1, -1);
            eventHandler.handler = 'onClick';
            eventHandler.customEventData = i + '';
            let bt = v.getComponent(Button) ?? v.addComponent(Button);
            bt.clickEvents.push(eventHandler);
        })
    }

    private onClick(event: TouchEvent, param: string): void {
        vv.audio.playEffect('audio/button_open', Bundle_name.Common);
        let idx = +param;
        if (this.allowSwitchOff) {
            let indexOf = this._indexs.indexOf(idx);
            if (indexOf === -1) {
                if (this.noMore) {
                    this._indexs.length = 0;
                }
                this._indexs.push(idx);
            } else {
                this._indexs.splice(indexOf, 1);
            }
            this.indexs = this._indexs;
            EventHandler.emitEvents(this.checkEvents, this._indexs);
        } else {
            this.switchToggle(idx);
        }
    }

    // 屏幕右滑
    public onSwipeRight(): void {
        let index = this.index - 1;
        if (index >= 0) {
            this.playSound();
            this.switchToggle(index);
        }
    }

    // 屏幕左滑
    public onSwipeLeft(): void {
        let index = this.index + 1;
        if (index < this.node.children.length) {
            this.playSound();
            this.switchToggle(index);
        }
    }

    public switchToggle(index: number): void {
        this.index = index;
        EventHandler.emitEvents(this.checkEvents, index);
    }

    private playSound(): void {
        vv.audio.playEffect('audio/button_open', Bundle_name.Common);
    }
}