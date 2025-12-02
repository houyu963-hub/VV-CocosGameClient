import { Config } from "db://assets/frame/config/Config";
import { Base } from "../../resources/pbjs";
import vv from "../Core";

/**
 * WS心跳
 */
export default class Heartbeat {
	// 计时器
	private _timer: number;
	// 是否在请求中
	private _isRequesting: boolean = false;
	// 心跳失败回调
	private _fail: () => void = null;

	/**
	 * 开始心跳
	 * @param fail 失败回调函数
	 */
	public start(fail: () => void): void {
		this.stop();
		this._fail = fail;
		this._timer = setTimeout(this.onTimer.bind(this), 2000);
	}

	/**
	 * 停止心跳
	 */
	public stop(): void {
		if (this._isRequesting) {
			vv.network.cancelRequest('Base.ReqHeartbeat');
			this._isRequesting = false;
		}
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	}

	/**
	 * 心跳请求
	 * @returns 
	 */
	private onTimer(): void {
		if (this._isRequesting) {
			return;
		}
		this._isRequesting = true;
		vv.network.send('Base.ReqHeartbeat', 'Base.RspHeartbeat', undefined, (data: Base.IRspHeartbeat) => {
			this._isRequesting = false;
			if (this._timer) {
				clearTimeout(this._timer);
			}
			// 收到心跳返回继续下一次心跳
			this._timer = setTimeout(this.onTimer.bind(this), Config.heartbeat_interval);
		}, () => {
			this._isRequesting = false;
			if (this._fail) {
				this._fail();
			}
		}, false, false)
	}

}