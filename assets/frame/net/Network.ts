import { Config } from "db://assets/frame/config/Config";
import vv from "../Core";
import NetPackage from "./NetPackage";
import { Socket, WebSocketState } from "./Socket";

export enum WSErrorCode {
    CONNECTION_NOT_ESTABLISHED,		// 连接未建立
    TIMEOUT,						// 请求超时
    REPEATED,						// 请求重复
}

/** 
 * 客户端请求消息体 
 */
interface IRequestData {
    request: string,                                     // 请求id
    response: string[] | string,                         // 监听的响应id
    param: any,                                          // 参数
    succ?: (data: Uint8Array, response: string) => void, // 成功回调
    fail?: (res: {                                       // 失败回调
        code: WSErrorCode
    }) => void,
    sendTime?: number,                                   // 请求时间
    canRepeate: boolean,
    pendingRequest: boolean,
}

export default class Network {
    // scoket
    protected _wsGame: Socket = null;
    // scoket请求数据
    private _socketMap: IRequestData[] = [];
    // 请求暂存队列
    private _pendingRequests: IRequestData[] = [];
    // 超时检测计时器id
    private _timer: number = null;
    // 服务器地址
    private _server_address: string = null;

    /**
     * scoket是否已经连接
     */
    public get isGameConnected(): boolean {
        return this._wsGame && this._wsGame.state === WebSocketState.OPEN;
    }

    /**
     * 主动断开网络
     */
    public disconnect(code: number, reason: string): void {
        if (!this._wsGame) {
            vv.logger.log('## 主动断开连接失败 当前无Socket实例!');
            return;
        }
        this._wsGame.close(code, reason);
        this.stopNetworkCheck();
        this._socketMap.length = 0;
        this._wsGame = null;
        vv.logger.log('## 断开连接 原因:' + reason);
    }

    /**
     * 连接服务器
     * @returns 
     */
    public connectServer(server_address: string = this._server_address, callback?: (succ: boolean) => unknown): void {
        if (this._wsGame) { // 先断开
            this.disconnect(1000, 'Disconnect before each connection.'); // 每次连接前断开连接
        }
        this._server_address = server_address;
        vv.logger.log('## 连接' + server_address);
        let ws = new Socket({
            server_address,
            succ: () => {
                vv.logger.log('## 连接成功');
                // 停止网络检测
                this.stopNetworkCheck();
                // 网络监听事件
                vv.event.on(vv.eventType.onSocketColse, this.onSocketClose, this);
                vv.event.on(vv.eventType.onSocketMsg, this.onMessage, this);
                vv.event.on(vv.eventType.onConnected, this.onConnected, this);
                // 启动心跳
                vv.heartbeat.start(() => {
                    vv.logger.warn('心跳失败');
                    this.disconnect(4000, 'Failed heartbeat');
                })
                // 启动超时检测
                this._timer = setInterval(this.checkSocketTimeOut.bind(this), 1000);
                callback?.(true);
            }, fail: () => {
                vv.utils.removeWaiting();
                callback?.(false);
            }
        })
        this._wsGame = ws;
    }

    // 连接恢复后处理队列
    public onConnected(): void {
        while (this._pendingRequests.length > 0) {
            const req = this._pendingRequests.shift()!;
            this.doSend(req, true);
        }
    }

    /**
     * Socket关闭
     */
    private onSocketClose(code: number): void {
        if (code !== 1000) {
            this.stopNetworkCheck();
            this._socketMap.length = 0;
            this._wsGame = null;
        }
    }

    /**
     * 停止网络相关检测
     */
    private stopNetworkCheck(): void {
        // 停止心跳
        vv.heartbeat.stop();
        // 关闭超时检测
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    /**
     * 收到数据
     * @param event A message received by a target object
     * @returns 
     */
    private onMessage(pkg: {
        msgName: string;
        msgBody: any;
        traceInfo: any;
    }): void {
        if (!this.isGameConnected) return;
        if (Config.debug && !Config.exclude_msgId.includes(pkg.msgName)) {
            vv.logger.logRecieve(`receive msg: ${pkg.msgName}`);
            vv.logger.log(JSON.parse(`${JSON.stringify(pkg.msgBody)}`)); // 深拷贝 防止被修改影响打印结果
        }
        // 广播
        vv.event.emit(pkg.msgName, pkg.msgBody);
        const time = Date.now();
        let isCallback = false;
        for (let i = 0; i < this._socketMap.length; i++) {
            let request = this._socketMap[i];
            let responseId = request.response;
            if (!responseId) continue;
            if (typeof (responseId) === 'string') {
                responseId = [responseId];
            }
            for (let j = 0; j < responseId.length; j++) {
                // 找到对应的响应id
                if (responseId[j] === pkg.msgName) {
                    isCallback = true;
                    // 记录延迟时间
                    let delay = time - request.sendTime;
                    vv.event.emit(vv.eventType.ping, delay);
                    // 删除响应id
                    responseId.splice(j, 1);
                    if (responseId.length === 0) {
                        // 删除请求数据
                        this._socketMap.splice(i, 1);
                    }
                    request.succ?.(pkg.msgBody, pkg.msgName);

                }
            }
            if (isCallback) break;
        }
    }

    /**
     * 发送数据
     * @param request 请求id
     * @param param 参数
     * @param responseId 响应id数组
     * @param succ 成功cb
     * @param fail 失败cb
     * @param canRepeate 是否可重复请求
     * @param pendingRequest 是否放入请求队列
     * @returns 本次是否发送了请求
     */
    public send(
        request: string,
        response?: string[] | string,
        param?: any,
        succ?: (data: any, response: string) => void,
        fail?: (res: {
            code: WSErrorCode
        }) => void,
        canRepeate: boolean = false,
        pendingRequest: boolean = true,
    ): boolean {
        const requestData = { request: request, param: param, response: response, succ, fail, sendTime: Date.now(), canRepeate: canRepeate, pendingRequest: pendingRequest };
        // 除以下请求之外的请求必须等到获取 userData 数据后才能请求
        let preReqs = [
            'PreLobby.ReqLogin',            // 登陆请求
            'PreLobby.ReqCreateRole',       // 创建角色
            'PreLobby.ReqGetRoleBaseData',  // 获取用户数据
            'Base.ReqHeartbeat',            // ping
        ]
        if (this.isGameConnected && (vv.memmory.isCanSendMessage || preReqs.includes(request))) { // 已经建立WebSocket连接
            if (!this.hasMessage(request)) {
                this.doSend(requestData);
                return true;
            } else if (canRepeate) {
                this.doSend(requestData);
                return true;
            } else {
                console.log('请勿重复请求:', requestData.request);
                return false;
            }
        } else { // 未建立WebSocket连接
            vv.utils.showToast('网路未连接');
            if (pendingRequest) { // 入队
                if (requestData.response) {
                    this._socketMap.push(requestData);
                }
                this._pendingRequests.push(requestData);
                console.log('连接尚未建立 放入请求队列:', requestData.request);
            } else {
                if (fail) {
                    let code: WSErrorCode;
                    if (!this.isGameConnected) {
                        code = WSErrorCode.CONNECTION_NOT_ESTABLISHED;
                    } else {
                        code = WSErrorCode.REPEATED;
                    }
                    fail({ code });
                }
                return false;
            }
        }
    }

    /**
     * 发送请求
     */
    public doSend(requestData: IRequestData, pendingRequest?: boolean): void {
        if (requestData.response && !pendingRequest) {
            this._socketMap.push(requestData);
        }
        let bytes: ArrayBuffer = NetPackage.encodeBuffer(requestData.request, requestData.param);
        this._wsGame.send(bytes);
        if (!Config.exclude_msgId.includes(requestData.request)) {
            vv.logger.logSend(`send msg: ${requestData.request}`);
            vv.logger.log(requestData.param);
        }
    }

    /**
     * 判断是否存在请求id
     * @param requestId 请求id
     * @returns 
     */
    public hasMessage(requestId: string): boolean {
        return this._socketMap.some(v => { return v.request === requestId });
    }

    /**
     * 取消请求
     * @param requestId 请求id
     */
    public cancelRequest(requestId: string): void {
        for (let i = 0, len = this._socketMap.length; i < len; i++) {
            if (this._socketMap[i].request === requestId) {
                this._socketMap.splice(i, 1);
                break;
            }
        }
        for (let i = 0, len = this._pendingRequests.length; i < len; i++) {
            if (this._pendingRequests[i].request === requestId) {
                this._pendingRequests.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 取消所有请求
     */
    public cancelAllRequest(): void {
        this._socketMap.length = 0;
    }

    /**
     * 超时检测
     */
    private checkSocketTimeOut(): void {
        const time = Date.now();
        let indices: Array<number> = [];
        let fails: Array<(res: { code: WSErrorCode }) => void> = [];
        let it: IRequestData;
        for (let i = 0, len = this._socketMap.length; i < len; i++) {
            it = this._socketMap[i];
            // 记录延迟时间
            let delay = time - it.sendTime;
            vv.event.emit(vv.eventType.ping, delay);
            if (delay > Config.timeout_socket) {
                indices.push(i);
                if (it.fail) {
                    fails.push(it.fail);
                }
            }
        }
        for (let i = indices.length - 1; i >= 0; i--) {
            this._socketMap.splice(indices[i], 1);
        }
        if (indices.length > 0) {
            vv.utils.showToast(`请求超时[${Config.timeout_socket / 1000}s]`);
            indices = null;
        }
        for (let i = 0, len = fails.length; i < len; i++) {
            fails[i]({ code: WSErrorCode.TIMEOUT });
        }
    }

}