const jsb = (<any>window).jsb;

import { assetManager, game, Label, misc, Node, rect, Rect, resources, Sprite, SpriteFrame, sys, tween, Tween, UITransform, v2, Vec2, Vec3 } from "cc";
import { Bundle_name, Config, Scene_name } from "db://assets/frame/config/Config";
import { CurrencySymbol, ErrorCode } from "db://assets/frame/config/Define";
import SceneNavigator from "db://assets/frame/ui/SceneNavigator";
import vv from "../../frame/Core";
import { PopupName } from "../../frame/ui/PopupConfig";

/**
 * 工具类
 */
export default class CommonUtils {

    /******************数学相关**********************/

    /**
     * 数组转arraybuffer
     * @param arr 
     * @returns 
     */
    public arr2Arraybuffer(arr: number[]): ArrayBuffer {
        let buffer = new ArrayBuffer(arr.length);
        let view = new DataView(buffer, 0);
        arr.forEach((v, i) => view.setUint8(i, v));
        return buffer;
    }

    /**
     * number转Uint8Array数组
     * @param num 
     * @returns 
     */
    public number2Uint8Array(num: number): number[] {
        let c4 = num % 256;
        let _num = Math.floor(num / 256);
        let c3 = _num % 256;
        _num = Math.floor(_num / 256);
        let c2 = _num % 256;
        let c1 = Math.floor(_num / 256);
        let c = [c1, c2, c3, c4];
        return c;
    }

    /**
     * 生成随机数，包含最小值不包含最大值
     * @param max 
     * @param min 
     * @returns 
     */
    public getRandomValue(max: number, min: number = 0): number {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /**
     * 从数组中随机取一个元素
     * @param data 
     * @returns 
     */
    public getRandData<T>(data: T[]) {
        return data[this.getRandomValue(data.length)];
    }

    /**
     * 从数组中随机取n个元素
     * @param data 
     * @param n 
     * @returns 
     */
    public getRandDatas<T>(data: T[], n: number) {
        return this.randArray(data).slice(0, n);
    }

    /**
     * 打乱数组
     * @param array 
     * @returns 
     */
    public randArray<T>(array: T[]): T[] {
        let rand = JSON.parse(JSON.stringify(array));
        for (let i = 0; i < rand.length; i++) {
            let pos = this.getRandomValue(rand.length - i);
            [rand[pos], rand[rand.length - 1 - i]] = [rand[rand.length - 1 - i], rand[pos]];
        }
        return rand;
    }

    /**
     * 对象数组去重
     * @param objArr 
     * @returns 
     */
    public setObj(objArr: {}[]): {}[] {
        let temObj = new Map(), arrNew: {}[] = [];
        for (let obj of objArr) {
            let sy = JSON.stringify(obj);
            if (!temObj.has(sy)) {
                temObj.set(sy, true);
                arrNew.push(JSON.parse(sy));
            }
        }
        return arrNew;
    }

    /**
      * 深拷贝
      * @param target 目标
      */
    public deepCopy(target: any): any {
        if (target == null || typeof target !== 'object') {
            return target;
        }
        if (target instanceof Array) {
            const result = [];
            for (let i = 0, length = target.length; i < length; i++) {
                result[i] = this.deepCopy(target[i]);
            }
            return result;
        }
        if (target instanceof Object) {
            const result = {};
            for (const key in target) {
                if (target.hasOwnProperty(key)) {
                    result[key] = this.deepCopy(target[key]);
                }
            }
            Object.setPrototypeOf(result, Object.getPrototypeOf(target));
            return result;
        }
        if (target instanceof Date) {
            return (new Date()).setTime(target.getTime());
        }
        return null;
    }

    /**
     * 按权重从数组中取一个数
     * @param data 原数据
     * @param weight 权重
     * @example 
     * Utils.getRandDataByWeight(['1','2','3'],[0.5, 0.5 ,0.7]);
     */
    public getRandDataByWeight<T>(data: T[], weight: T[]): T {
        let sum = 0, factor = 0, random = Math.random();
        for (let i = weight.length - 1; i >= 0; i--) {
            sum += +weight[i];
        }
        random *= sum;
        for (let i = weight.length - 1; i >= 0; i--) {
            factor += +weight[i];
            if (random <= factor) {
                return data[i];
            }
        }
        return [] as unknown as T;
    }

    /**
     * 按权重从数组中取n个数
     * @param data 原数据
     * @param weight 权重
     * @param n 个数
     * @example 
     * Utils.getRandDataByWeight(['1','2','3'],[0.5, 0.5 ,0.7], 2);
     */
    public getRandDatasByweight<T>(data: T[], weight: T[], n: number): T[] {
        let res: T[] = [];
        for (let i = 0; i < n; i++) {
            let da = this.getRandDataByWeight(data, weight);
            res.push(da);
        }
        return res;
    }

    /**
     * 当前矩形与指定矩形是否相交。
     * @param currNode 
     * @param targetNode 
     * @returns 
     */
    public hitTestIntersects(currNode: Node, targetNode: Node): boolean {
        return targetNode.getComponent(UITransform).getBoundingBoxToWorld().intersects(currNode.getComponent(UITransform).getBoundingBoxToWorld());
    }

    /**
     * 返回 2 个矩形重叠的部分。
     * @param currNode 
     * @param targetNode 
     * @returns 
     */
    public hitTestIntersection(currNode: Node, targetNode: Node): Rect {
        let out = rect();
        Rect.intersection(out, currNode.getComponent(UITransform).getBoundingBoxToWorld(), targetNode.getComponent(UITransform).getBoundingBoxToWorld());
        return out;
    }

    /**
     * 当前矩形是否包含指定坐标点。
     * @param currNode 
     * @param targetPos 世界坐标
     * @returns 
     */
    public hitTestContains(currNode: Node, targetPos: Vec2): boolean {
        return currNode.getComponent(UITransform).getBoundingBoxToWorld().contains(targetPos);
    }

    /**
     * 当前矩形是否包含指定矩形。
     * @param currNode 
     * @param targetNode 
     * @returns 
     */
    public hitTestContainsRect(currNode: Node, targetNode: Node): boolean {
        return currNode.getComponent(UITransform).getBoundingBoxToWorld().containsRect(targetNode.getComponent(UITransform).getBoundingBoxToWorld());
    }

    /**
     * 随机生成指定矩形边界的坐标值
     * @param box 
     * @param parent 
     * @returns 
     */
    public getBoundaryPos(box: Node, parent: Node): Vec2 {
        let world = box.parent.getComponent(UITransform).convertToWorldSpaceAR(box.getPosition());
        let local = parent.getComponent(UITransform).convertToNodeSpaceAR(world);
        let topRandx = this.getRandomValue(local.x - box.getComponent(UITransform).width / 2, local.x + box.getComponent(UITransform).width / 2);
        let pos1 = v2(topRandx, box.position.y + box.getComponent(UITransform).height / 2);
        let pos2 = v2(topRandx, box.position.y - box.getComponent(UITransform).height / 2);
        let leftRandy = this.getRandomValue(local.y - box.getComponent(UITransform).height / 2, local.y + box.getComponent(UITransform).height / 2);
        let pos3 = v2(box.position.x - box.getComponent(UITransform).width / 2, leftRandy);
        let pos4 = v2(box.position.x + box.getComponent(UITransform).width / 2, leftRandy);
        return [pos1, pos2, pos3, pos4][this.getRandomValue(0, 4)];
    }

    /**
     * 两点之间的距离
     * @param start 
     * @param end 
     * @returns 
     */
    public getDistance(start: Vec2, end: Vec2): number {
        let pos = v2(start.x - end.x, start.y - end.y);
        let dis = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        return dis;
    }

    /**
     * 点和坐标原点的夹角
     * @param postion 
     * @returns 
     */
    public getDegrees(postion: Vec2): number {
        return misc.radiansToDegrees(Math.atan2(postion.y, postion.x));
    }

    /**
     * 获取两点连线夹角
     */
    public getAngle(p1: Vec3, p2: Vec3, offset = 0): number {
        let x = p2.x - p1.x;
        let y = p2.y - p1.y;
        let radian = Math.atan2(y, x);
        let angle = (180 * radian / Math.PI) % 360 + offset;
        return angle;
    }

    /**
     * 数字变动效果 （支持整数和小数滚动）
     * @param key 
     * @param strLabel 显示文字的 lable 组件
     * @param beginNum 开始数字
     * @param endNum 结束数字
     * @param delay 变化间隔
     * @param fixTime 是否固定变化时间
     * @param defaultScroller 默认变化几圈
     * @param decimalPlaces 小数位数，默认为 0
     * @param km 是否转化成 k、m
     * @param callback 完成回调
     * @returns 
     */
    private twkey: { [key: string]: any[] } = {};
    public textEffect(param: {
        key: string,
        strLabel: Label,
        beginNum: number,
        endNum: number,
        delay?: number,
        fixTime?: number,
        defaultScroller?: number,
        decimalPlaces?: number,
        km?: boolean,
        callback?: () => void,
    }): void {
        let label = param.strLabel;

        // 先清除 key
        if (this.twkey[param.key]?.length > 0) {
            this.twkey[param.key].forEach(obj => {
                Tween.stopAllByTarget(obj);
            })
            delete this.twkey[param.key];
        }

        let setString = (num: number) => {
            if (param.km) {
                label.string = this.formatAmountToKm({ amount: num, fixed: 2, decimalsZero: false });
            } else {
                label.string = num.toFixed(param.decimalPlaces ?? 0); // 保留指定小数位
            }
        }

        setString(param.beginNum); // 初始化显示数字
        let obj: any = {};
        obj.num = param.beginNum;

        let startTween = () => {
            let diff = Math.abs(param.endNum - param.beginNum);
            if (diff === 0) {
                setString(param.endNum);
                delete this.twkey[param.key];
                param.callback?.();
                return;
            }
            let duration = param.fixTime ?? (diff * (param.delay ?? 0.01));
            if (duration === 0) {
                setString(param.endNum);
                param.callback?.();
            } else {
                tween(obj)
                    .to(duration, { num: param.endNum }, {
                        progress: (start: number, end: number, current: number, ratio: number) => {
                            let value = start + (end - start) * ratio;
                            if (label.isValid) {
                                setString(value);
                            }
                            return value;
                        }
                    })
                    .call(() => {
                        delete this.twkey[param.key];
                        param.callback?.();
                    })
                    .start();
                let arr = this.twkey[param.key];
                if (!arr) arr = [];
                arr.push(obj);
                this.twkey[param.key] = arr;
            }
        }
        // 默认先滚动几圈
        if (param.defaultScroller > 0) {
            let obj2: any = {};
            obj2.num = 0;
            tween(obj2)
                .to(0.2, { num: 9 }, {
                    progress: (start: number, end: number, current: number, ratio: number) => {
                        let value = start + (end - start) * ratio;
                        if (value >= 9) {
                            obj2.num = 0;
                            value = 0;
                        }
                        if (label.isValid) {
                            setString(value);
                        }
                        return value;
                    }
                })
                .repeat(param.defaultScroller)
                .call(() => {
                    startTween();
                })
                .start();
            let arr = this.twkey[param.key];
            if (!arr) arr = [];
            arr.push(obj);
            this.twkey[param.key] = arr;
        } else {
            startTween();
        }
    }

    /**
    * @desc 三阶贝塞尔二次曲线
    * @param {number} duration 时间
    * @param {Vec3} p1 起点坐标
    * @param {Vec3} cp 控制点
    * @param {Vec3} p2 终点坐标
    * @param {object} opts 
    * @returns {any}
    */
    public bezierTo(target: any, duration: number, p1: Vec3, cp: Vec3, p2: Vec3, opts?: any): Tween<any> {
        opts = opts || Object.create(null);
        let twoBezier = (t: number, p1: Vec3, cp: Vec3, p2: Vec3) => {
            let x = (1 - t) * (1 - t) * p1.x + 2 * t * (1 - t) * cp.x + t * t * p2.x;
            let y = (1 - t) * (1 - t) * p1.y + 2 * t * (1 - t) * cp.y + t * t * p2.y;
            let z = (1 - t) * (1 - t) * p1.z + 2 * t * (1 - t) * cp.z + t * t * p2.z;
            return new Vec3(x, y, z);
        };
        opts.onUpdate = (_arg: Vec3, ratio: number) => {
            target.position = twoBezier(ratio, p1, cp, p2);
        };
        return tween(target).to(duration, {}, opts);
    }

    /**
     * @desc 三阶贝塞尔三次曲线
     * @param {number} duration 时间
     * @param {Vec3} p1 起点坐标
     * @param {Vec3} cp1 控制点一
     * @param {Vec3} cp2 控制点二
     * @param {Vec3} p2 终点坐标
     * @param {object} opts 
     * @returns {any}
     */
    public bezier3To(target: any, duration: number, p1: Vec3, cp1: Vec3, cp2: Vec3, p2: Vec3, opts?: any, scale: Vec3 = Vec3.ZERO): Tween<any> {
        opts = opts || Object.create(null);
        let threeBezier = (t: number, p1: Vec3, cp1: Vec3, cp2: Vec3, p2: Vec3) => {
            let x = (1 - t) * (1 - t) * (1 - t) * p1.x + 3 * t * (1 - t) * (1 - t) * cp1.x + 3 * t * t * (1 - t) * cp2.x + t * t * t * p2.x
            let y = (1 - t) * (1 - t) * (1 - t) * p1.y + 3 * t * (1 - t) * (1 - t) * cp1.y + 3 * t * t * (1 - t) * cp2.y + t * t * t * p2.y
            let z = (1 - t) * (1 - t) * (1 - t) * p1.z + 3 * t * (1 - t) * (1 - t) * cp1.z + 3 * t * t * (1 - t) * cp2.z + t * t * t * p2.z

            return new Vec3(x, y, z);
        };
        opts.onUpdate = (_arg: Vec3, ratio: number) => {
            target.position = threeBezier(ratio, p1, cp1, cp2, p2);
        };
        return tween(target).to(duration, { scale: scale }, opts);
    }

    /******************时间相关**********************/

    /**
     * 获取今天23:59:59
     */
    public getToDayEndTimestamp(): number {
        return new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1;
    }

    /**
     * 获取今天00:00:00
     */
    public getToDayStartTimestamp(): number {
        return new Date(new Date().toLocaleDateString()).getTime();
    }

    /**
     * 时间戳转00:00:00
     * @param timestamp ms
     * @returns 
     */
    public timestamp2HHmmss(timestamp: number): string {
        let s: string;
        let date: Date = new Date(timestamp);
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let seconds = date.getSeconds();
        s = (hours < 10 ? ('0' + hours) : hours) + ':' + (minutes < 10 ? ('0' + minutes) : minutes) + ':' + (seconds < 10 ? ('0' + seconds) : seconds);
        return s;
    }

    /**
     * 时间戳转00:00
     * @param timestamp ms
     * @returns 
     */
    public timestamp2HHmm(timestamp: number): string {
        let s: string;
        let date: Date = new Date(timestamp);
        let hours = date.getHours();
        let minutes = date.getMinutes();
        s = (hours < 10 ? ('0' + hours) : hours) + ':' + (minutes < 10 ? ('0' + minutes) : minutes);
        return s;
    }

    /**
    * 剩余时间转DD:HH:mm:ss格式
    * @param timestamp s
    * @param tag
    * @param dhmsTag
    * @param hideSeconds 不显示秒
    * @returns 
    */
    public leftTimestamp2DDHHmmss(timestamp: number, tag?: string, dhmsTag?: boolean, hideSeconds?: boolean): string {
        // 计算总分钟和秒数
        let totalMinutes = Math.trunc(timestamp / 60);
        let seconds = Math.trunc(timestamp % 60);
        // 计算小时和天
        let hours = Math.trunc(totalMinutes / 60);
        let days = Math.trunc(hours / 24);
        // 更新小时和分钟
        hours = hours % 24; // 剩余小时
        let minutes = totalMinutes % 60; // 剩余分钟
        if (tag == null) {
            tag = ':';
        }
        let timeStr: string;
        if (dhmsTag) {
            // 格式化为 1d 2h 3m 4s
            timeStr =
                (days > 0 ? (days + 'd ' + tag) : '') +
                String(hours).padStart(2, '0') + 'h ' + tag +
                String(minutes).padStart(2, '0') + 'm ' +
                (hideSeconds ? '' : + tag + String(seconds).padStart(2, '0') + 's');
        } else {
            // 格式化为 DD:HH:mm:ss
            timeStr =
                (days > 0 ? (days + 'd' + tag) : '') +
                String(hours).padStart(2, '0') + tag +
                String(minutes).padStart(2, '0') + tag +
                String(seconds).padStart(2, '0');
        }
        return timeStr;
    }

    /**
     * 剩余时间转HH:mm:ss格式
     * @param timestamp s
     * @returns 
     */
    public leftTimestamp2HHmmss(timestamp: number, tag?: string): string {
        let minute = Math.trunc(timestamp / 60);
        let second = Math.trunc(timestamp % 60);
        let hour = Math.trunc(minute / 60);
        let hour1 = hour;
        minute = minute % 60;

        let h = Math.trunc(hour1 / 10) + '' + hour1 % 10,
            m = Math.trunc(minute / 10) + '' + minute % 10,
            s = Math.trunc(second / 10) + '' + second % 10;
        let timeStr: string;
        if (tag == null) {
            return timeStr = h + ':' + m + ':' + s;
        } else {
            return [h, m, s].join(tag);
        }
    }

    /**
     * 时间戳转yy-mm-dd
     * @param timestamp ms
     * @param tag 指定连接符
     * @returns 
     */
    public timestamp2YYMMDD(timestamp: number, tag?: string): string {
        let date: Date = new Date(timestamp);
        let y: number = date.getFullYear();
        let m: number = date.getMonth() + 1;
        let strm: string = m + '';
        if (m < 10) {
            strm = '0' + m;
        }
        let d: number = date.getDate();
        let strd: string = d + '';
        if (d < 10) {
            strd = '0' + d;
        }
        if (tag == null) {
            return y + '-' + strm + '-' + strd + '';
        } else {
            return [y, strm, strd].join(tag);
        }
    }

    /**
    * 时间戳转yy-mm
    * @param timestamp ms
    * @param tag 指定连接符
    * @returns 
    */
    public timestamp2YYMM(timestamp: number, tag?: string): string {
        let date: Date = new Date(timestamp);
        let y: number = date.getFullYear();
        let m: number = date.getMonth() + 1;
        let strm: string = m + '';
        if (m < 10) {
            strm = '0' + m;
        }
        if (tag == null) {
            return y + '-' + strm;
        } else {
            return [y, strm].join(tag);
        }
    }

    /**
     * 时间戳转mm-dd
     * @param timestamp ms
     * @param tag 指定连接符
     * @returns 
     */
    public timestamp2MMDD(timestamp: number, tag?: string): string {
        let date: Date = new Date(timestamp);
        let y: number = date.getFullYear();
        let m: number = date.getMonth() + 1;
        let strm: string = m + '';
        if (m < 10) {
            strm = '0' + m;
        }
        let d: number = date.getDate();
        let strd: string = d + '';
        if (d < 10) {
            strd = '0' + d;
        }
        if (tag == null) {
            return strm + '-' + strd + '';
        } else {
            return [strm, strd].join(tag);
        }
    }

    private _initServerTime: number = 0; // 初始服务器时间
    private _initGameTime: number = 0; // 记录设置服务器时间时的游戏运行时间

    /**
     * 设置初始服务器时间
     * @param serverTime 服务器时间戳(毫秒)
     */
    public setServerTime(serverTime: number): void {
        this._initServerTime = serverTime;
        this._initGameTime = game.totalTime;
    }

    /**
     * 获取服务器时间
     * @returns 服务器当前时间戳(毫秒)
     */
    public getServerTime(): number {
        if (!this._initServerTime) {
            return Date.now();
        }
        return this._initServerTime + (game.totalTime - this._initGameTime);
    }

    /******************游戏相关**********************/

    public getGameNameByType(type: any): string {
        switch (type) {
            case 0:
                return '大厅';
            default:
                return '未知游戏';
        }
    }

    /**
     * 显示对话框
     */
    public showDialog(param: any): void {
        vv.ui.open(PopupName.Dialog, param);
    }

    /**
     * 关闭对话框
     * @param queue 关闭失败是否加入关闭队列中
     * @param duration 动画持续时间,传0就是无动画立即关闭
     */
    public removeDialog(queue: boolean = true, duration: number = undefined): void {
        vv.ui.close(PopupName.Dialog, queue, duration);
    }

    /**
     * 显示等待中
     */
    public showWaiting(msg?: string): void {
        vv.ui.open(PopupName.Waiting, msg);
    }

    /**
     * 关闭等待中
     */
    public removeWaiting(queue: boolean = true): void {
        vv.ui.close(PopupName.Waiting, queue);
    }

    /**
     * 显示提示
     */
    public showToast(msg: string | { msg: string, delay: number }): void {
        vv.ui.open(PopupName.Toast, msg);
    }

    /**
     * 显示code
     */
    public showToastCode(code: number, delay?: number): void {
        let text = vv.language.findLanguage(code);
        vv.ui.open(PopupName.Toast, { msg: text, delay: delay });
    }

    /**
     * 显示服务器返回的错误码
     */
    public showToastErrCode(code: number, args?: string): void {
        let text: string = ErrorCode[vv.pb.Enum.EErrorCode[code]]?.replace(/\\n/g, '\n');
        if (!text) {
            vv.logger.warn('code not find:' + code);
            return;
        }
        if (args) {
            text.replace(/{(\d+)}/g, function (match, index) {
                return args[index] ?? match;
            })
        }
        vv.ui.open(PopupName.Toast, text);
    }

    /**
     * 关闭提示
     */
    public removeToast(): void {
        vv.ui.close(PopupName.Toast);
    }

    /**
     * 账号登出
     */
    public logout(reason?: number): void {
        vv.network.disconnect(1000, 'Log out of account'); // 账号登出
        // 清空用户信息
        vv.storage.clearStorage();
        // 清除玩家信息
        vv.user.userData = null;
        // 回到登录
        SceneNavigator.go(Scene_name.Login, null, () => {
            switch (reason) {
                default:
                    break;
            }
        })
    }

    /**
     * 加载头像
     * @param index 
     * @param sprite 
     */
    public async loadAvatarSprite(index: string, sprite: Sprite): Promise<void> {
        index = index || '0';
        if (isNaN(+index)) {
            // 自定义头像
            let spriteFrame = await vv.asset.loadRemoteRes(index);
            if (sprite.isValid) {
                sprite.spriteFrame = spriteFrame;
            }
        } else {
            // 系统头像
            // if (+index > 52) index = '1';
            // vv.asset.loadRes(`head/img_${index}/spriteFrame`, SpriteFrame, (err, data) => {
            vv.asset.loadRes(`head/img_0/spriteFrame`, SpriteFrame, (err, data) => {
                if (err) {
                    sprite.spriteFrame = null;
                    return;
                }
                if (sprite.isValid) {
                    sprite.spriteFrame = data;
                }
            }, Bundle_name.Hall)
        }
    }

    /**
     * 加载筹码图片
     * @param index 
     * @param sprite 
     */
    public loadChipSprite(index: any, sprite: Sprite): void {

    }

    /**
     * 坐标转换
     * @param curr 当前节点
     * @param target 目标节点
     */
    public convertLocation(curr: Node, target: Node, pos?: Vec3): Vec3 {
        if (!curr.parent) {
            return
        }
        let world = curr.parent.getComponent(UITransform).convertToWorldSpaceAR(pos ?? curr.getPosition());
        let local = target.getComponent(UITransform).convertToNodeSpaceAR(world);
        return local;
    }

    /**
     * 货币比率换算
     * @param value 目标转化值
     * @param symbol 是否带金币符号
     * @param fixed 保留小数位数
     * @param km 是否转化成 k、m
     * @param decimalsZero km=true时 是否保留小数部分0
     * @returns 
     */
    public ratioConvert(value: number, symbol = false, fixed?: number, km?: boolean, decimalsZero?: boolean): any {
        if (!value) {
            return symbol ? (CurrencySymbol + 0) : 0;
        }
        let num = Number(value).div(Config.currency_rate);
        if (!symbol && !fixed && !km) { // 什么都不要就直接返回number
            return num;
        }
        let res: string = num.toString();
        if (fixed >= 0) {
            res = num.toFixed(fixed);
        }
        if (km) {
            res = this.formatAmountToKm({ amount: num, fixed: fixed, decimalsZero: decimalsZero });
        }
        if (symbol) {
            return CurrencySymbol + res;
        }
        return res;
    }

    /**
     * 货币比率换算
     * @param num 
     * @param goldSymbol 带金币符号
     * @param logicSymbol 带运算符号+-
     * @param dontAddSymbol 不带'+'运算符号
     * @returns number | string
     */
    public ratioConvertLogic(data: { value: number, goldSymbol: boolean, logicSymbol: boolean, fixed?: number, dontAddSymbol?: boolean }): any {
        let num = data.value / Config.currency_rate;
        let currency: number | string = num;
        if (data.fixed) {
            currency = Number(num.toFixed(data.fixed));
        }
        let str: string = '';
        if (data.logicSymbol) {
            if (data.dontAddSymbol) {
                str += currency >= 0 ? '' : '-';
            } else {
                str += currency >= 0 ? '+' : '-';
            }
        }
        if (data.goldSymbol) {
            str += CurrencySymbol;
        }
        return str + Math.abs(currency);
    }

    /**
     * 货币转化(以k、m单位)
     * @param amount 金额
     * @param fixed 保留小数位数 
     * @param decimalsZero 是否保留小数部分的0 
     * @returns 
     */
    public formatAmountToKm(param: { amount: number, fixed: number, decimalsZero: boolean }): string {
        let res: number;
        if (!param.fixed) {
            param.fixed = 2;
        }
        if (param.amount >= 1_000_000) {
            res = param.amount / 1_000_000;
            // 如果金额大于等于一百万，使用 m 表示
            if (!param.decimalsZero) {
                return +(res.toFixed(param.fixed)) + 'm';
            } else {
                return res.toFixed(param.fixed) + 'm';
            }
        } else if (param.amount >= 1_000) {
            res = param.amount / 1_000;
            // 如果金额大于等于一千，使用 k 表示
            if (!param.decimalsZero) {
                return +(res.toFixed(param.fixed)) + 'k';
            }
            return res.toFixed(param.fixed) + 'k';
        } else {
            res = param.amount;
            if (!param.decimalsZero) {
                return +(res.toFixed(param.fixed)) + '';
            } else {
                return res.toFixed(param.fixed);
            }
        }
    }

    /**
     * 高位补0
     * @param digits 
     * @param num 
     * @returns 
     */
    public padNumberWithZeros(digits: number, num: number): string {
        // 将数字转换为字符串
        let numStr = num.toString();
        // 计算需要补零的数量
        const zerosToAdd = digits - numStr.length;
        // 如果需要补零，则在前面添加零
        if (zerosToAdd > 0) {
            numStr = '0'.repeat(zerosToAdd) + numStr;
        }
        return numStr;
    }

    /**
     * 是否下载过游戏
     */
    public async isDownloadedGame(gameType: number): Promise<boolean> {
        if (!jsb || Config.testApk) {
            return true;
        }
        let version = await this.getVersion(gameType);
        return version !== '0.0.0.0';
    }

    /**
     * 获取版本号
     * @param gameType 0大厅 
     * @description 本地搜索路径 用户可写路径/remote-asset/gameType
     * @returns 
     */
    public async getVersion(gameType: number = 0): Promise<string> {
        return new Promise<string>(resolve => {
            let searchPaths: string = sys.localStorage.getItem('HotUpdateSearchPaths');
            let path: string = '';
            if (jsb && searchPaths) {
                let writablePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote-asset/';
                let target_path = writablePath + Config.hotupdateDirNameMap[gameType] + '/';
                if (JSON.parse(searchPaths).includes(target_path)) {
                    path = target_path + 'project.manifest';
                    assetManager.loadAny({ url: path }, (err, file) => {
                        if (err) {
                            vv.logger.forceLog(err);
                            resolve('0.0.0.0');
                            return;
                        }
                        let localInfo = JSON.parse(file);
                        vv.logger.log(Config.hotupdateDirNameMap[gameType] + ' writable path version: ' + localInfo.version);
                        resolve(localInfo.version);
                        return;
                    })
                }
            }
            if (!path) {
                // 加载包内manifest
                let dirname: string = Config.hotupdateDirNameMap[gameType];
                path = resources.getInfoWithPath(`/manifest/${dirname}/project`).path;
                resources.load(path, (err, data) => {
                    if (err) {
                        vv.logger.forceLog(err);
                        resolve('0.0.0.0');
                        return;
                    }
                    let localInfo = JSON.parse(data['_file']);
                    vv.logger.log(Config.hotupdateDirNameMap[gameType] + ' in app version: ' + localInfo.version);
                    resolve(localInfo.version);
                })
            }
        })
    }
}