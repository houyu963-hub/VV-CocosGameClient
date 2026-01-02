import { native, sys } from "cc";
import { IPlatformApi, LoginInfo, MessageInfo, OrderInfo, Orientation, PlatformFeature, PlatformResponse, ShareInfo } from "../PlatformApi";

export class NativePlatformImpl implements IPlatformApi {
    private static readonly PLATFORM_NAME = 'NativePlatform';
    private callbackMap: Map<string, (response: string) => void> = new Map();

    constructor() {
        // 定义全局回调函数供原生代码调用
        (window as any).__nativePlatformCallback = (callbackId: string, jsonResult: string) => {
            console.log(`Received callback from ${NativePlatformImpl.PLATFORM_NAME}:`, callbackId, jsonResult);
            const callback = this.callbackMap.get(callbackId);
            if (callback) {
                callback(jsonResult);
                this.callbackMap.delete(callbackId);
            }
        };
    }

    isFeatureSupported(feature: PlatformFeature): boolean {
        return true; // 所有功能都支持
    }
    login(loginInfo: LoginInfo): Promise<PlatformResponse<{ token: string; userId: string; }>> {
        return this.callNativeMethod('login', null);
    }
    pay(orderInfo: OrderInfo): Promise<PlatformResponse<{ transactionId?: string; }>> {
        return this.callNativeMethod('pay', JSON.stringify(orderInfo));
    }
    share(shareInfo: ShareInfo): Promise<PlatformResponse> {
        return this.callNativeMethod('share', JSON.stringify(shareInfo));
    }
    exitApp(): void {
        this.callNativeMethod('exitApp', undefined);
    }
    closeSplash(): void {
        this.callNativeMethod('closeSplash', undefined);
    }
    copyStr(str: string): Promise<PlatformResponse<{ content: string; }>> {
        return this.callNativeMethod('copyStr', str);
    }
    networkAvailable?(): Promise<PlatformResponse<{ available: boolean; }>> {
        return this.callNativeMethod('networkAvailable', null);
    }
    netCheck?(): Promise<PlatformResponse<{ state: 'DO_WIFI' | 'DO_MOBILE' | 'NO_CONNECTION'; }>> {
        return this.callNativeMethod('netCheck', null);
    }
    sendMessage(messageInfo: MessageInfo): Promise<PlatformResponse<{ message: MessageInfo; }>> {
        return this.callNativeMethod('sendMessage', JSON.stringify(messageInfo));
    }
    setOrientation(orientationInfo: Orientation): Promise<PlatformResponse<{ orientation: Orientation }>> {
        return this.callNativeMethod('orientation', JSON.stringify(orientationInfo));
    }
    vibrator(): void {
        this.callNativeMethod('vibrator', null);
    }
    getDeviceId(): Promise<PlatformResponse<{ androidId: string; }>> {
        return this.callNativeMethod('getDeviceId', null);
    }
    getPackageName(): Promise<PlatformResponse<{ packageName: string; }>> {
        return this.callNativeMethod('getPackageName', null);
    }
    networkChangeReceiver(): Promise<PlatformResponse<{ state: 'DO_WIFI' | 'DO_MOBILE' | 'NO_CONNECTION'; }>> {
        return this.callNativeMethod('onNetworkStateChange', null);
    }

    // 调用原生方法的通用函数
    private callNativeMethod(methodName: string, params: string | null): Promise<PlatformResponse> {
        return new Promise((resolve, reject) => {
            const callbackId = 'cb_' + methodName + '_' + Date.now() + '_' + Math.random().toString(36).substr(2);
            // 存储回调
            this.callbackMap.set(callbackId, (jsonResult: string) => {
                try {
                    const result: PlatformResponse = JSON.parse(jsonResult);
                    if (result.code === 'SUCCESS') {
                        resolve(result);
                    } else {
                        reject(new Error(result.message || `Platform ${methodName} failed`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse platform response: ${jsonResult}`));
                }
            });

            // 调用 Cocos JSB 桥接
            try {
                if (sys.isNative && sys.os === sys.OS.ANDROID) {
                    // Android 平台
                    native.reflection.callStaticMethod(
                        'com/cocos/sdkbridge/PlatformBridge',
                        methodName,
                        '(Ljava/lang/String;Ljava/lang/String;)V',
                        callbackId,
                        params || ''
                    );
                } else if (sys.isNative && sys.os === sys.OS.IOS) {
                    // iOS 平台 
                    // oc.callStaticMethod(className, methodName, ...);
                } else {
                    reject(new Error('Native platform not detected'));
                }
            } catch (error) {
                this.callbackMap.delete(callbackId);
                reject(error);
            }
        });
    }
}