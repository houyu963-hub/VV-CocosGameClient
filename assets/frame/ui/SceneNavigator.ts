import { director } from "cc";
import { Scene_name } from "db://assets/frame/config/Define";

/**
 * 场景导航类
 * 场景之间传参
 */
export default class SceneNavigator {

    /** 首页场景名称 */
    public static get home() { return this._home; }
    private static _home: string = '';

    /** 历史记录（栈） */
    public static get history() { return this._history; }
    private static _history: string[] = [];

    /** 当前场景名称 */
    public static get curScene() { return this._curScene; }
    public static set curScene(value: string) { this._curScene = value }
    private static _curScene: string = '';


    /** 上一个场景留下的参数 */
    private static _param: any = null;
    public static get param(): any {
        return SceneNavigator._param;
    }
    public static set param(value: any) {
        SceneNavigator._param = value;
    }

    /**
     * 设置首页
     * @param name 场景名
     */
    public static setHome(name: string) {
        this._home = name;
        this._history = [name];
        this._curScene = name;
    }

    /**
     * 返回首页
     * @param param 数据
     * @param coverHistory 覆盖历史记录
     * @param onLaunched 场景加载完成回调
     */
    public static goHome(param?: any, coverHistory?: boolean, onLaunched?: Function) {
        this._param = param;
        const name = this._home || Scene_name.Hall;
        if (this._curScene === name) {
            onLaunched?.();
            return;
        }
        this._curScene = null;
        director.loadScene(name, () => {
            if (coverHistory) {
                this._history.length = 0;
            }
            this._history.push(name);
            this._curScene = name;
            onLaunched?.();
        })
    }

    /**
     * 前往场景
     * @param name 场景名
     * @param param 数据
     * @param onLaunched 场景加载完成回调
     */
    public static go(name: string, param?: any, onLaunched?: Function) {
        this._param = param;
        if (this._curScene === name) {
            onLaunched?.();
            return;
        }
        director.loadScene(name, () => {
            this._history.push(name);
            this._curScene = name;
            onLaunched?.();
        })
    }

    /**
     * 返回上一个场景
     * @param param 数据
     * @param onLaunched 场景加载完成回调
     */
    public static back(param?: any, onLaunched?: Function) {
        if (this._history.length < 1) {
            return;
        }
        this._param = param;
        const history = this._history,
            name = history[history.length - 2];
        director.loadScene(name, () => {
            history.pop();
            this._curScene = name;
            onLaunched?.();
        })
    }

}
