import vv from "../Core";
import NetPackage from "./NetPackage";

/** socket状态 */
export enum WebSocketState {
	UNKNOWN = -1,    // 无
	CONNECTING,      // 正在链接中
	OPEN,            // 已经链接并且可以通讯
	CLOSING,         // 连接正在关闭
	CLOSED,          // 连接已关闭或者没有链接成功
}

export class Socket {
	public _ws: WebSocket = null;
	// scocket 状态
	public get state(): WebSocketState { return this._ws.readyState; }
	// 超时时间
	private _timeoutId: NodeJS.Timeout;
	// 成功失败回调
	private _handlerConnect: {
		succ: () => void,
		fail: () => void
	} = null;

	public constructor(options: {
		server_address: string,
		succ: () => void,
		fail: () => void,
	}) {
		this._handlerConnect = {
			succ: options.succ,
			fail: options.fail,
		};
		let url = options.server_address;
		this._ws = new WebSocket(url);
		this._ws.onmessage = this.onMessage.bind(this);
		this._ws.onopen = this.onConnected.bind(this);
		this._ws.onerror = this.onError.bind(this);
		this._ws.onclose = this.onClosed.bind(this);
		this._ws.binaryType = 'arraybuffer';
		// 设置超时回调
		this._timeoutId = setTimeout(this.connectionTimeout.bind(this, true), 10000);
	}

	/**
	 * 连接超时
	 */
	private connectionTimeout(): void {
		if (this._timeoutId) {
			clearTimeout(this._timeoutId);
			this._timeoutId = null;
		}
		this._handlerConnect?.fail();
		this._handlerConnect = null;
	}

	/** 
	 * 连接成功
	 */
	private onConnected(): void {
		// 清除定时器
		if (this._timeoutId) {
			clearTimeout(this._timeoutId);
			this._timeoutId = null;
		}
		this._handlerConnect?.succ();
		this._handlerConnect = null;
		vv.event.emit(vv.eventType.onSocketOpen);
	}

	/** 
	 * 返回数据
	 */
	private onMessage(event: MessageEvent): void {
		let pkg = NetPackage.decodeDataBuffer(event.data);
		vv.event.emit(vv.eventType.onSocketMsg, pkg);
	}

	/** 
	 * 连接错误
	 */
	private onError(): void {
		// onError之后会onClosed,在onClosed中处理
	}

	/** 
	 * 连接关闭
	 */
	private onClosed(event: CloseEvent): void {
		vv.logger.log('## 连接已关闭 code:' + event.code);
		vv.event.emit(vv.eventType.onSocketColse, event.code);
	}

	/**
	 * 发送数据
	 * @param bytes 
	 */
	public send(bytes: ArrayBuffer): void {
		this._ws.send(bytes);
	}

	/**
	 * 主动关闭
	 * 1000 表示正常关闭。
	 * 1001 表示由于端点离开（客户端或服务端）而关闭。
	 * 1005 表示没有状态码被指定（这是一个不被推荐的用法，因为服务器应该总是返回一个状态码）。
	 * 1006 表示连接被abruptly closed，例如在没有发送或接收任何数据的情况下。
	 * 4000 表示心跳失败
	 */
	public close(code: number, reason: string): void {
		if (this._ws) {
			this._ws.close(code, reason);
		}
		this._ws = null;
		vv.memmory.isCanSendMessage = false;
	}

}