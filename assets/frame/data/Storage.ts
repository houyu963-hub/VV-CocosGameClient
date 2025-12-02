import { sys } from "cc";
import vv from "../Core";

/** 
 * 本地储存
 */
export default class Storage {
    private _inited: boolean = false;
    private _data: any = {};

    /**
     * 存储
     * @param key 
     * @param value 
     */
    public setItem(key: string, value: string): void {
        this._init();
        this._data[key] = value;
        sys.localStorage.setItem(vv.user.userData.RoleUID, JSON.stringify(this._data));
    }

    /**
     * 获取
     * @param key 
     * @returns 
     */
    public getItem(key: string): string {
        this._init();
        return this._data[key];
    }

    /**
     * 删除
     * @param key 
     */
    public removeItem(key: string): void {
        delete this._data[key];
        sys.localStorage.setItem(vv.user.userData.RoleUID, JSON.stringify(this._data));
    }

    /**
     * 清空
     */
    public clearStorage(): void {
        this._data = {};
        sys.localStorage.removeItem(vv.user.userData?.RoleUID);
        sys.localStorage.removeItem('device_id');
        sys.localStorage.removeItem('phone');
        sys.localStorage.removeItem('custom_account');
    }

    /**
     * 初始化
     * @returns 
     */
    private _init(): void {
        if (this._inited) return;
        this._inited = true;
        let str = sys.localStorage.getItem(vv.user.userData.RoleUID);
        if (!str) str = '{}';
        this._data = JSON.parse(str);
    }
}