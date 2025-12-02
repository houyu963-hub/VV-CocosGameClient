import { CCBoolean, CCInteger, Component, EventHandler, Node, _decorator } from "cc";
import vv from "../Core";
import { Bundle_name } from "../config/Config";
import ToggleGroup from "./ToggleGroup";

/**
 * 页面切换
 */
const { ccclass, property, menu } = _decorator;

@ccclass('ToggleManagerList')
class ToggleManagerList {
    @property(Node) page: Node = null;
    @property({ type: EventHandler }) initHander: EventHandler[] = [];
}

@ccclass
@menu('Custom/SwitchTab')
export default class SwitchTab extends Component {
    @property(ToggleGroup) toggleContainer: ToggleGroup;
    @property([ToggleManagerList]) list: ToggleManagerList[] = [];
    @property({ type: EventHandler }) switchHander: EventHandler[] = [];
    @property({ type: CCBoolean, tooltip: '每次显示都更新数据' }) initData: boolean = false;

    private initDataIndexs: number[] = [];

    _index: number = 0;
    @property({
        type: CCInteger,
        range: [0, 10],
    })
    public set index(idx: number) {
        if (this._index === idx) {
            return;
        }
        this._index = idx;
        this.toggleContainer.index = idx;
        this.list.forEach((v, index) => {
            if (!v) return;
            if (index === idx) {
                v.page.active = true;
                EventHandler.emitEvents(this.switchHander, idx);
                if (!this.initDataIndexs.includes(idx)) {
                    this.initDataIndexs.push(idx);
                    EventHandler.emitEvents(v.initHander);
                } else if (this.initData) {
                    EventHandler.emitEvents(v.initHander);
                }
            } else {
                v.page.active = false;
            }
        })
    }
    public get index(): number {
        return this._index;
    }

    protected onLoad(): void {
        let eventHandler: EventHandler = new EventHandler();
        eventHandler.target = this.node;
        eventHandler.component = 'SwitchTab';
        eventHandler.handler = '_onBtToggle';
        this.toggleContainer.checkEvents.push(eventHandler);
    }

    protected onEnable(): void {
        this.index = this._index;
    }

    protected _onBtToggle(index: number): void {
        this.index = index;
    }

    // 屏幕右滑
    public onSwipeRight(): void {
        let index = this.index - 1;
        if (index >= 0) {
            this.playSound();
            this.index = index;
        }
    }

    // 屏幕左滑
    public onSwipeLeft(): void {
        let index = this.index + 1;
        if (index < this.list.length) {
            this.playSound();
            this.index = index;
        }
    }

    private playSound(): void {
        vv.audio.playEffect('audio/button_open', Bundle_name.Common);
    }

}
