import { assetManager, AssetManager, find, instantiate, isValid, Node, Prefab, resources } from "cc";
import vv from "../Core";
import PopupBase, { PopupState } from "./PopupBase";
import PopupConfig, { IPopupConfig } from "./PopupConfig";

/** 弹窗缓存模式 */
enum CacheMode {
    /** 一次性的（立即销毁节点，预制体资源随即释放） */
    Once = 1,
    /** 正常的（立即销毁节点，但是缓存预制体资源） */
    Normal,
    /** 频繁的（只关闭节点，且缓存预制体资源） */
    Frequent
}

/** 弹窗请求结果 */
enum ShowResult {
    /** 展示成功（已关闭） */
    Done = 1,
    /** 展示失败（加载失败） */
    Failed,
    /** 等待中（已加入等待队列） */
    Waiting
}

/**
 * 弹窗管理
 */
export default class PopupManager {
    /** 预制体缓存 */
    public get prefabCache() { return this._prefabCache; }
    private _prefabCache: Map<string, Prefab> = new Map<string, Prefab>();

    /** 节点缓存 */
    public get nodeCache() { return this._nodeCache; }
    private _nodeCache: Map<string, Node> = new Map<string, Node>();

    /** 当前弹窗请求 */
    public get current() { return this._current; }
    private _current: PopupRequestType;

    /** 所有弹窗请求 */
    public get popups() { return this._popups; }
    private _popups: PopupRequestType[] = [];

    /** 等待队列 */
    public get queue() { return this._queue; }
    private _queue: PopupRequestType[] = [];

    /** 关闭队列 */
    public get closeQueue() { return this._closeQueue; }
    private _closeQueue: string[] = [];

    /** 被挂起的弹窗队列 */
    public get suspended() { return this._suspended; }
    private _suspended: PopupRequestType[] = [];

    /** 锁定状态 */
    public locked: boolean = false;

    /** 连续展示弹窗的时间间隔（秒） */
    public interval: number = 0.05;

    /** 弹窗缓存模式 */
    public get CacheMode() {
        return CacheMode;
    }

    /** 弹窗请求结果类型 */
    public get ShowResult() {
        return ShowResult;
    }

    /**
     * 弹窗动态加载开始回调
     * @example
     * PopupManager.loadStartCallback = () => {
     *     LoadingTip.show();
     * };
     */
    public loadStartCallback: () => void;

    /**
     * 弹窗动态加载结束回调
     * @example
     * PopupManager.loadFinishCallback = () => {
     *     LoadingTip.hide();
     * };
     */
    public loadFinishCallback: () => void;

    /**
     * 展示弹窗，如果当前已有弹窗在展示中则加入等待队列
     * @param popupName 弹窗预制体名称
     * @param options 弹窗选项（将传递给弹窗的组件）
     * @param params 弹窗展示参数
     * @example
     * const options = {
     *     title: 'Hello',
     *     content: 'This is a popup!'
     * };
     * const params = {
     *     mode: PopupCacheMode.Normal
     * };
     * PopupManager.show('MyPopup', options, params);
     */
    public open<Options>(popupName: string, options?: Options, params?: PopupParamsType, parent?: Node, openCallback?: () => void): Promise<ShowResult> {
        return new Promise(async resolve => {
            // 解析处理参数
            params = this.parseParams(params);
            // 路径
            let popupConfig = PopupConfig.config[popupName];
            let path = popupConfig.popupPath;
            // 如果在关闭队列中将其移除
            if (this.closeQueue.includes(path)) {
                let index = this.closeQueue.indexOf(path);
                this.closeQueue.splice(index, 1);
            }
            // 先检查弹窗状态
            let isShow = this.isShowPopup(popupName);
            if (isShow) {
                vv.logger.warn(`[PopupManager]弹窗已经显示:${path}`);
                return;
            }
            // 当前已有弹窗在展示中则加入等待队列
            if (this.locked) {
                // 是否立即强制展示
                if (params && params.immediately) {
                    this.locked = false;
                    // 挂起当前弹窗
                    await this.suspend();
                } else {
                    // 将请求推入等待队列
                    this.push(path, options, params);
                    resolve(ShowResult.Waiting);
                    return;
                }
            }
            // 先在缓存中获取弹窗节点
            let node = this.getNodeFromCache(path);
            // 缓存中没有，动态加载预制体资源
            if (!isValid(node)) {
                // 开始回调
                this.loadStartCallback?.();
                // 等待加载
                const prefab = await this.load(popupConfig);
                // 加载预制体需要短许时间，这里再检查弹窗状态
                let isShow = this.isShowPopup(popupName);
                if (isShow) {
                    vv.logger.warn(`[PopupManager]弹窗已经显示:${path}`);
                    return;
                }
                // 完成回调
                this.loadFinishCallback?.();
                // 加载失败（一般是路径错误导致的）
                if (!prefab || !isValid(prefab)) {
                    vv.logger.warn(`[PopupManager]弹窗加载失败${path}`);
                    this._current = null;
                    resolve(ShowResult.Failed);
                    return;
                }
                // 实例化节点
                node = instantiate(prefab) as unknown as Node;
            }
            // 获取PopupBase
            const popup = node.getComponent(PopupBase);
            if (!popup) {
                vv.logger.warn(`[PopupManager]未找到弹窗组件${path}`);
                this._current = null;
                resolve(ShowResult.Failed);
                return;
            }
            if (this.closeQueue.includes(path)) {
                let index = this.closeQueue.indexOf(path);
                this.closeQueue.splice(index, 1);
                this.recycle(path, node, params.mode);
                // vv.logger.warn(`[PopupManager]弹窗[${path}]存在关闭队列中,不予展示`);
                resolve(ShowResult.Failed);
                return;
            }
            // 保存为当前弹窗
            this._current = {
                path,
                options,
                params
            }
            // 保存组件引用
            this._current.popup = popup;
            // 保存节点引用
            this._current.node = node;
            // 添加到场景中
            node.setParent(parent ?? find('Canvas')?.getChildByName('popups') ?? find('Canvas'));
            // 显示在最上层
            node.setSiblingIndex(node.parent.children.length);
            // 设置完成回调
            const hideCallback = async (suspended: boolean) => {
                if (suspended) {
                    return;
                }
                // 是否需要锁定
                this.locked = (this._suspended.length > 0 || this._queue.length > 0);
                // 回收
                this.recycle(path, node, params.mode);
                // 从弹窗中删除
                let index = this._popups.findIndex(v => { return v.path === path });
                if (index !== -1) {
                    this._popups.splice(index, 1);
                    vv.logger.log('[PopupManager]移除弹窗:' + path, '#1F00FF');
                    vv.logger.log('[PopupManager]弹窗展示列表:' + this._popups.map(v => { return v.path }), '#1F00FF');
                } else {
                    vv.logger.warn('[PopupManager]移除弹窗失败:' + path);
                }
                // 设置当前弹窗
                this._current = this._popups[this._popups.length - 1] ?? null;
                resolve(ShowResult.Done);
                // 延迟一会儿
                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, this.interval * 1000);
                });
                // 下一个弹窗
                this.next();
            }
            popup.setFinishCallback(hideCallback);
            // 保存弹窗
            this._popups.push(this._current);
            vv.logger.log('[PopupManager]打开弹窗:' + path, '#1F00FF');
            vv.logger.log('[PopupManager]弹窗展示列表:' + this._popups.map(v => { return v.path }), '#1F00FF');
            // 展示
            await popup.open(options);
            openCallback?.();
        })
    }

    /**
     * 关闭当前弹窗
     */
    public closeCurr(): void {
        if (this._current.popup) {
            this._current.popup.close();
        }
    }

    /**
     * 关闭指定弹窗,如果关闭失败且`@param queue === true`会放入关闭队列中,下次打开此弹窗时则不会显示
     * @param popupName 
     * @param queue 
     */
    public close(popupName: string, queue?: boolean, duration?: number): void {
        let path = PopupConfig.config[popupName].popupPath;
        let popupData = this._popups.find(v => { return v.path === path });
        if (popupData) {
            popupData.popup.close(false, duration);
        } else {
            if (!this.closeQueue.includes(path)) {
                // vv.logger.warn(`[PopupManager]弹窗[${path}]关闭失败,未找到弹窗[可能还在加载中]`);
                if (queue) {
                    this.closeQueue.push(path);
                    // vv.logger.warn(`[PopupManager]弹窗[${path}]放入关闭队列`);
                }
            }
        }
    }

    /**
     * 是否显示了弹窗
     * @param path 弹窗路径
     * @returns 
     */
    public isShowPopup(popupName: string): PopupBase<any> {
        let path = PopupConfig.config[popupName].popupPath;
        let popup = this._popups.find(v => { return v.path === path });
        if (!popup) return null;
        if (popup.popup.popupState === PopupState.Showing || popup.popup.popupState === PopupState.Showed) {
            return popup.popup;
        }
        return null;
    }

    /**
     * 从缓存中获取节点
     * @param path 弹窗路径
     */
    private getNodeFromCache(path: string): Node {
        // 从节点缓存中获取
        const nodeCache = this._nodeCache;
        if (nodeCache.has(path)) {
            const node = nodeCache.get(path);
            if (isValid(node)) {
                return node;
            }
            // 删除无效引用
            nodeCache.delete(path);
        }
        // 从预制体缓存中获取
        const prefabCache = this._prefabCache;
        if (prefabCache.has(path)) {
            const prefab = prefabCache.get(path);
            if (isValid(prefab)) {
                // 增加引用计数
                prefab.addRef();
                // 实例化并返回
                return instantiate(prefab) as unknown as Node;
            }
            // 删除无效引用
            prefabCache.delete(path);
        }
        // 无
        return null;
    }

    /**
     * 展示挂起或等待队列中的下一个弹窗
     */
    private next() {
        if (this._current || (this._suspended.length === 0 && this._queue.length === 0)) {
            return;
        }
        // 取出一个请求
        let request: PopupRequestType;
        if (this._suspended.length > 0) {
            // 挂起队列
            request = this._suspended.shift();
        } else {
            // 等待队列
            request = this._queue.shift();
        }
        // 解除锁定
        this.locked = false;
        // 已有实例
        if (isValid(request.popup)) {
            // 设为当前弹窗
            this._current = request;
            // 直接展示
            request.node.setParent(find('Canvas')?.getChildByName('popups') ?? find('Canvas'));
            request.popup.open(request.options);
            return;
        }
        // 加载并展示
        this.open(request.path, request.options, request.params);
    }

    /**
     * 添加一个弹窗请求到等待队列中，如果当前没有展示中的弹窗则直接展示该弹窗。
     * @param path 弹窗预制体相对路径（如：prefabs/MyPopup）
     * @param options 弹窗选项
     * @param params 弹窗展示参数
     */
    private push<Options>(path: string, options: Options, params: PopupParamsType) {
        // 直接展示
        if (!this._current && !this.locked) {
            this.open(path, options, params);
            return;
        }
        // 加入队列
        this._queue.push({ path, options, params });
        // 按照优先级从小到大排序
        this._queue.sort((a, b) => (a.params.priority - b.params.priority));
    }

    /**
     * 挂起当前展示中的弹窗
     */
    private async suspend() {
        if (!this._current) {
            return;
        }
        const request = this._current;
        // 将当前弹窗推入挂起队列
        this._suspended.push(request);
        // 关闭当前弹窗（挂起）
        await request.popup.close(true);
        // 置空当前
        this._current = null;
    }

    /**
     * 回收弹窗
     * @param path 弹窗路径
     * @param node 弹窗节点
     * @param mode 缓存模式
     */
    private recycle(path: string, node: Node, mode: CacheMode) {
        switch (mode) {
            // 一次性
            case CacheMode.Once: {
                this._nodeCache.delete(path);
                node.destroy();
                // 释放
                this.release(path);
                break;
            }
            // 正常
            case CacheMode.Normal: {
                this._nodeCache.delete(path);
                node.destroy();
                break;
            }
            // 频繁
            case CacheMode.Frequent: {
                node.removeFromParent();
                this._nodeCache.set(path, node);
                break;
            }
        }
    }

    /**
     * 加载并缓存弹窗资源
     * @param path 弹窗路径
     */
    private load(popupConfig: IPopupConfig): Promise<Prefab> {
        return new Promise(async resolve => {
            let path = popupConfig.popupPath;
            const prefabMap = this._prefabCache;
            // 先看下缓存里有没有，避免重复加载
            if (prefabMap.has(path)) {
                const prefab = prefabMap.get(path);
                // 缓存是否有效
                if (isValid(prefab)) {
                    resolve(prefab);
                    return;
                } else {
                    // 删除无效引用
                    prefabMap.delete(path);
                }
            }
            // 动态加载
            let bundle: AssetManager.Bundle = null;
            if (popupConfig.bundle === 'resources') {
                bundle = resources;
            } else {
                bundle = assetManager.getBundle(popupConfig.bundle);
            }
            if (bundle) {
                bundle.load(path, (error: Error, prefab: Prefab) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    // 缓存预制体
                    prefabMap.set(path, prefab);
                    // 返回
                    resolve(prefab);
                })
            } else {
                resolve(null);
            }
        })
    }

    /**
     * 尝试释放弹窗资源（注意：弹窗内部动态加载的资源请自行释放）
     * @param path 弹窗路径
     */
    private release(path: string) {
        // 移除节点
        const nodeCache = this._nodeCache;
        let node = nodeCache.get(path);
        if (node) {
            nodeCache.delete(path);
            if (isValid(node)) {
                node.destroy();
            }
            node = undefined;
        }
        // 移除预制体
        const prefabCache = this._prefabCache;
        let prefab = prefabCache.get(path);
        if (prefab) {
            // 删除缓存
            if (prefab.refCount <= 1) {
                prefabCache.delete(path);
            }
            // 减少引用
            prefab.decRef();
            prefab = undefined;
        }
    }

    /**
     * 解析参数
     * @param params 参数
     */
    private parseParams(params: PopupParamsType | undefined): PopupParamsType {
        if (params == undefined) {
            return new PopupParamsType();
        }
        // 是否为对象
        if (Object.prototype.toString.call(params) !== '[object Object]') {
            vv.logger.warn(`[PopupManager]弹窗参数无效，使用默认参数:${params}`);
            return new PopupParamsType();
        }
        // 缓存模式
        if (params.mode == undefined) {
            params.mode = CacheMode.Normal;
        }
        // 优先级
        if (params.priority == undefined) {
            params.priority = 0;
        }
        // 立刻展示
        if (params.immediately == undefined) {
            params.immediately = false;
        }
        return params;
    }

    public clear(): void {
        this.popups.length = 0;
        this.queue.length = 0;
        this.suspended.length = 0;
        this.closeQueue.length = 0;
        this.locked = false;
    }
}

/** 弹窗展示参数 */
class PopupParamsType {
    /** 缓存模式 */
    mode?: CacheMode = CacheMode.Frequent;
    /** 优先级（优先级大的优先展示） */
    priority?: number = 0;
    /** 立刻展示（将会挂起当前展示中的弹窗） */
    immediately?: boolean = false;
}

/** 弹窗展示请求 */
interface PopupRequestType {
    /** 弹窗预制体相对路径 */
    path: string;
    /** 弹窗选项 */
    options: any;
    /** 缓存模式 */
    params: PopupParamsType;
    /** 弹窗组件 */
    popup?: PopupBase<any>;
    /** 弹窗节点 */
    node?: Node;
}
