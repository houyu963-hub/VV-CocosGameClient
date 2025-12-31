import { Config } from "db://assets/frame/config/Config";
import vv from "../Core";

export interface Response {
    code: number,
    data: any,
    msg: string,
}

/**
 * http模块
 */
export default class Http {

    public async get(url: string, params?: any): Promise<any> {
        return await this._send(this._process(url, params), 'GET');
    }

    public async post(url: string, params?: any, headers?: any): Promise<any> {
        return await this._send(url, 'POST', params, headers);
    }

    private _process(url: string, params?: object) {
        if (params) {
            if (url.slice(-1) != '?') url += '?';
            let joint: string = '';
            for (let key in params) {
                url += joint + key + '=' + params[key];
                joint = '&';
            }
        }
        return url;
    }

    private _send(url: string, type: string, params?: object | string, headers?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        let response = xhr.responseText;
                        try {
                            vv.logger.logRecieve('response url:' + route);
                            vv.logger.log('data:' + response);
                            resolve(response);
                            xhr = null;
                        } catch (e) {
                            vv.logger.log(e);
                            vv.utils.showToast('网络异常');
                            resolve(null);
                            xhr = null;
                        }
                    } else {
                        vv.utils.showToast('网络异常');
                        resolve(null);
                        xhr = null;
                    }
                }
            }
            xhr.timeout = 6000;
            let route = Config.serverUrl + url;
            xhr.open(type, route, true);
            vv.logger.logSend('request url:' + route);
            vv.logger.log('param:' + (typeof (params) === 'object' ? JSON.stringify(params) : params));
            if (type === 'POST') {
                xhr.setRequestHeader('Content-Type', 'application/json');
                if (headers) {
                    for (let key in headers) {
                        xhr.setRequestHeader(key, headers[key]);
                    }
                }
                xhr.send(JSON.stringify(params || {}));
            } else {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
                xhr.send();
            }
        })
    }
}

