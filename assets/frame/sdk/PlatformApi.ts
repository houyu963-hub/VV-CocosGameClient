// 平台接口
export interface IPlatformApi {
    isFeatureSupported(feature: PlatformFeature): boolean;                                                  // 检测功能支持
    login(): Promise<PlatformResponse<{ token: string; userId: string }>>;                                  // 登录
    pay(orderInfo: OrderInfo): Promise<PlatformResponse<{ transactionId?: string }>>;                       // 支付
    share(shareInfo: ShareInfo): Promise<PlatformResponse>;                                                 // 分享
    exitApp(): void;                                                                                        // 退出 (原生平台可能需要)
    closeSplash(): void;                                                                                    // 关闭启动屏 (原生平台可能需要)
    copyStr(str: string): Promise<PlatformResponse<{ content: string }>>;                                   // 复制文本
    networkAvailable?(): Promise<PlatformResponse<{ available: boolean }>>;                                 // 检测网络可用
    netCheck?(): Promise<PlatformResponse<{ state: 'DO_WIFI' | 'DO_3G' | 'NO_CONNECTION' }>>;               // 检测网络可用类型
    sendMessage?(messageInfo: MessageInfo): Promise<PlatformResponse<{ message: MessageInfo }>>;            // 调用系统短信
    setOrientation?(orientationInfo: Orientation): Promise<PlatformResponse<{ orientation: Orientation }>>; // 设置屏幕方向
    vibrator?(): void;                                                                                      // 震动
    getDeviceId?(): Promise<PlatformResponse<{ androidId: string }>>;                                       // 获取设备ID
    getPackageName?(): Promise<PlatformResponse<{ packageName: string }>>;                                  // 获取应用包名
}

// 平台能力枚举 (可按需扩展)
export enum PlatformFeature {
    LOGIN = 'login',
    PAY = 'pay',
    SHARE = 'share',
    EXITAPP = 'exitApp',
    CLOSESPLASH = 'closeSplash',
    COPYSTR = 'copyStr',
    NETWORKAVAILABLE = 'networkAvailable',
    NETCHECK = 'netCheck',
    SENDMESSAGE = 'sendMessage',
    ORIENTATION = 'orientation',
    VIBRATOR = 'vibrator',
    GETDEVICEID = 'getDeviceId',
    GETPACKAGENAME = 'getPackageName',
}

// 统一响应结构
export interface PlatformResponse<T = any> {
    code: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';
    message?: string;
    data?: T;
}

// 订单信息 (支付用)
export interface OrderInfo {
    orderId: string;
    amount: number; // 单位: 分
    productName: string;
    extra?: string; // 平台特定参数 (JSON字符串)
}

// 分享信息
export interface ShareInfo {
    title: string;
    desc?: string;
    imageUrl?: string;
    url?: string;
    shareType?: 'friend' | 'timeline'; // 好友或朋友圈
}

// 消息信息
export interface MessageInfo {
    phoneNumber: string;
    smsContent: string;
}

// 屏幕方向
export interface Orientation {
    orientation: 'portrait' | 'landscape',
}