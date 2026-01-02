// 货币符号
export const CurrencySymbol = '￥';

// 登录平台
export const LoginPlatform = {
    Dev: 0,
    WechatApp: 1,
    Wechat: 2
}

// 平台
export const Platform = {
    Android: "android",
    IOS: "ios",
    Web: "web",
    Mini: "Mini"
}

// 渠道
export const ChannelType = {
    Dev: "dev",
    Public: "public"
}

/**
 * 场景名称
 */
export enum Scene_name {
    Loading = 'Loading', // 加载页
    Login = 'Login',     // 登录页
    Hall = 'Hall',       // 大厅
    Mahjong = 'Mahjong', // 麻将游戏
}

/** 
 * 自定义bd名称
 */
export enum Bundle_name {
    // Internal = 'internal',   // 引擎自带 internal包。包含引擎模块内置的一些默认资源
    Resources = 'resources',    // 引擎自带 resources 包。 加载优先级8
    // Main = 'main',           // 引擎自带（主包）包含框架代码、启动场景。 加载优先级7
    Loading = 'loading',        // 自定义 loading 包, 主要处理热更逻辑、资源加载。 加载优先级6
    Common = 'common',          // 自定义 common 包, 包含公共资源。 加载优先级5
    Hall = 'hall',              // 自定义 hall 包, 包含大厅相关资源。 加载优先级4
    Mahjong = 'mahjong',        // 自定义 mahjong 包, 包含麻将游戏相关资源。 加载优先级1
}