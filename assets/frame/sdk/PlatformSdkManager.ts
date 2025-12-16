import { Config } from '../config/Config';
import { Platform } from '../config/Define';
import { NativePlatformImpl } from './impl/NativePlatformImpl';
import { WebPlatformImpl } from './impl/WebPlatformImpl';
import { WechatMiniGamePlatformImpl } from './impl/WechatMiniGamePlatformImpl';
import { IPlatformApi } from './PlatformApi';

export class PlatformSdkManager {
    private static _instance: PlatformSdkManager;
    private currentPlatform: IPlatformApi | null = null;

    public static getInstance(): PlatformSdkManager {
        return PlatformSdkManager._instance ?? (PlatformSdkManager._instance = new PlatformSdkManager());
    }

    // 初始化 (游戏启动时)
    public initialize(): void {
        if (this.currentPlatform) return;
        let platform = Config.platform;
        switch (platform) {
            case Platform.Android:
            case Platform.IOS:
                this.initNativePlatform(); // 原生平台 (Android/iOS)
                break;
            case Platform.Web:
                this.initWebPlatform(); // Web平台
                break;
            case Platform.Wechat: // 微信小游戏环境
                this.initWechatMiniGame();
                break;
            default:
                break;
        }
    }

    // 获取当前平台实例
    public getPlatform(): IPlatformApi {
        if (!this.currentPlatform) {
            throw new Error('Platform SDK not initialized. Call initialize() first.');
        }
        return this.currentPlatform;
    }

    // =============== 私有方法 ===============
    private initWechatMiniGame(): void {
        console.log('[PlatformSDK] 检测到微信小游戏环境');
        this.currentPlatform = new WechatMiniGamePlatformImpl();
    }

    private initNativePlatform(): void {
        console.log('[PlatformSDK] 检测到原生平台环境');
        // 创建代理对象，所有调用都通过 JSB 桥接到原生
        this.currentPlatform = new NativePlatformImpl();
    }

    private initWebPlatform(): void {
        console.log('[PlatformSDK] 检测到Web平台环境');
        this.currentPlatform = new WebPlatformImpl();
    }

}