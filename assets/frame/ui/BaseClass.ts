import { Button, Component, EventHandler, Node, Toggle, _decorator, warn } from "cc";
import vv from "../Core";
import { Bundle_name } from "../config/Config";

const { ccclass } = _decorator;

/**
 * UI脚本基类
 */
@ccclass
export default class BaseClass extends Component {

    /**
     * 是否初始化
     */
    protected m_isInit: boolean = false;

    /**
     * 存放节点的map
     */
    protected m_nodePool: Map<string, Node> = new Map();

    /**
     * 以'_'开头的节点会存放在节点map中
     */
    private _prefix: string = '_';

    /**
     * 以'_bt'开头的按钮点击时会自动调用脚本下'_onBtxxx'方法
     */
    private _prefixBt: string = '_bt';

    /**
     * 以'$'结尾的按钮会自动绑定点击声音
     */
    private _preEnd_open: string = '$';
    private _preEnd_close: string = '&';

    /**
     * 不提示警告信息
     */
    protected without_warn: boolean = true;

    private _preSoundOpen: string = '_onBtSoundOpen';
    private _preSoundClose: string = '_onBtSoundClose';
    private _preDouble: string = '_onBtDoubleClick';

    // 初始化
    public __preload() {
        if (!this.m_isInit) {
            this.bind();
        }
    }

    /**
     * 获取节点
     * @param name 节点名称
     * @param type 组件，不传则返回节点本身
     * @example
     * let player = this.$('_player', Sprite)
     */
    public $<T extends Component>(name: string, type: { prototype: T }): T;
    public $(name: string): Node;
    public $<T extends Component>(name: string, type?: { prototype: T }): (T | Node) {
        // 没初始化先初始
        if (!this.m_isInit) {
            this.bind();
        }
        if (!this.m_nodePool) {
            return;
        }
        let node: Node | undefined = this.m_nodePool.get(name);
        if (!node) {
            return null;
        }
        if (type) {
            return node.getComponent(<any>type) as T;
        } else {
            return node;
        }
    }

    /**
     * 绑定数据，一般在开发中需要存储一些数据可以用此方法存储
     * @param data 数据
     * @param ts 脚本，默认当前脚本
     */
    public saveData(data: any, ts: BaseClass = this) {
        ts.node.attr({ customData: data });
    }

    /** 
     * 获取绑定的数据
     */
    public getData(ts: BaseClass = this): any {
        return (<any>ts.node).customData;
    }

    /**
     * 绑定数据 针对节点
     * @param node 
     * @param data 
     */
    public setCustomData(node: Node, data: any): void {
        node['customData'] = data;
    }

    /**
     * 获取绑定的数据
     * @param node 
     * @returns 
     */
    public getCustomData(node: Node): any {
        return node['customData'];
    }

    /**
     * 获取BaseClass脚本，当点击某个节点时需要获取到某个BaseClass上存储的数据时可以用此方法获取
     * @param node 节点
     * @param value 几层，一个父节点+1层
     * @returns 
     */
    protected getJs(node: Node, value: number = 1): BaseClass {
        let currNode = null;
        while (value > 0) {
            currNode = (currNode ?? node).parent;
            value--;
        }
        if (!currNode) return null;
        return currNode.getComponent(BaseClass);
    }

    /** 
     * 绑定数据
     */
    private bind(): void {
        let poll: Map<string, Node> = new Map();
        this._bindSound(this.node, this);
        this._bindClickEvent(this.node, this);
        this._bindNode(this.node, poll);
        this.m_nodePool = poll;
        this.m_isInit = true;
    }

    /**
     * 给节点下所有按钮添加按钮点击声音
     * @param node 节点
     * @param js 事件响应函数所在组件名（脚本名）
     * @returns 
     */
    private _bindSound(node: Node, js?: any): void {
        if (js == null) return;
        let btArr: Button[] = node.getComponentsInChildren(Button);
        for (let bt of btArr) {
            let funcName: string = '';
            let preEnd = bt.node.name.slice(-1)
            if (preEnd === this._preEnd_open) {
                funcName = this._preSoundOpen;
            } else if (preEnd === this._preEnd_close) {
                funcName = this._preSoundClose;
            }
            if (!!funcName && this.bindEvent(bt, funcName, js)) {
                bt.node.name = bt.node.name.slice(0, -1);
            }
        }
    }

    /**
     * 给节点下所有按钮添加按钮点击事件
     * @param node 节点
     * @param js 事件响应函数所在组件名（脚本名）
     * @returns 
     */
    private _bindClickEvent(node: Node, js: any): void {
        if (js == null) return;
        let btArr: Button[] = node.getComponentsInChildren(Button);
        for (let bt of btArr) {
            let name: string = bt.node.name;
            if (name === this.node.name) continue; // 跳过自身
            if (name.slice(0, 3) === this._prefixBt) {
                name = name.slice(3);
                let parseArr: string[] = name.split('#');
                name = parseArr[0];
                name = name.slice(0, 1).toUpperCase() + name.slice(1);
                let funcName: string = '_onBt' + name;
                this.bindEvent(bt, funcName, js, parseArr[1]);
                this.bindEvent(bt, this._preDouble, js);
            }
        }
    }

    /** 
     * 点击按钮时间控制（避免连点），所有按钮自动绑定
     */
    private _onBtDoubleClick(event: EventHandler): void {
        if (!event.target) return;
        let bt = event.target.getComponent(Button);
        let tog = event.target.getComponent(Toggle);
        if (bt && !tog) {
            bt.enabled = false;
            let id = setTimeout(() => {
                if (bt.isValid) {
                    bt.enabled = true;
                }
                clearTimeout(id);
                id = null;
            }, 200);
        }
    }

    /**
     * 添加节点
     * @param node 节点
     * @param pool 节点map
     */
    private _bindNode(node: Node, pool: Map<string, Node>): void {
        node.children.forEach((child: Node) => {
            let name: string = child.name;
            if (name[0] === this._prefix) {
                pool.set(name, child);
            }
            this._bindNode(child, pool);
        })
    }

    /**
     * 绑定事件
     * @param bt 按钮组件本身
     * @param name 函数名
     * @param js 事件响应函数所在组件名（脚本名）
     * @param param 参数
     * @returns 
     */
    private bindEvent(bt: Button, name: string, js: any, param?: string): boolean {
        let componentName = this._getComponentName(js);
        if (this._eixstEvent(bt, name, componentName)) {
            return false;
        }
        if (!js[name]) {
            if (componentName !== 'BaseClass' && !this.without_warn) {
                warn(`${componentName}脚本下无${name}函数,绑定点击事件失败!`);
            }
            return false;
        }
        let eventHandler: EventHandler = new EventHandler();
        eventHandler.target = js.node;
        eventHandler.component = componentName;
        eventHandler.handler = name;
        if (param != null) eventHandler.customEventData = param;
        bt.clickEvents.push(eventHandler);
        return true;
    }

    /**
     * 是否存在事件（关闭事件除外）
     * @param button 按钮组件本身
     * @param func 函数名
     * @param jsName 事件响应函数所在组件名（脚本名）
     * @returns 
     */
    protected _eixstEvent(button: Button, func: string, jsName: string): boolean {
        for (let event of button.clickEvents) {
            if (func == '_onBtClose' && event.handler == '_onBtClose') continue;
            if (event.handler == func && event.component == jsName) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取组件名称，组件名称如下'Canvas<Loading>'，所以稍稍处理下
     * @param component 组件
     * @returns 
     */
    protected _getComponentName(component: any): string {
        try {
            return component.name.match(/<.*>$/)[0].slice(1, -1);
        } catch (e) {
            vv.logger.log(e);
            return '';
        }
    }

    /**
     * 点击关闭
     */
    protected _onBtClose(): void { }

    /** 
     * 播放按钮点击音效，一些非buttom节点可手动绑定
     */
    protected onBtSoundOpen(): void {
        this._onBtSoundOpen();
    }

    /** 
     * 播放按钮点击音效
     */
    protected _onBtSoundOpen(): void {
        vv.audio.playEffect('audio/button_open', Bundle_name.Common);
    }

    /** 
     * 播放按钮点击音效
     */
    protected _onBtSoundClose(): void {
        vv.audio.playEffect('audio/button_open', Bundle_name.Common);
    }

}