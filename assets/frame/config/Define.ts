// 货币符号
export const CurrencySymbol = '￥';

// 服务器返回的错误码
export enum ErrorCode {
    OK = '',               // 成功
    Failed = '失败',       // 失败
    Auth_Invalid_Params = '无效参数',              // 无效参数
    Auth_Invalid_Ticket = '无效票据',              // 无效票据
    Auth_Expired_Ticket = '票据过期',              // 票据过期
    Auth_Platform_Error = '平台错误',              // 平台错误
    Auth_Hub_Not_Outward = '认证中心不可用',       // 认证中心不可用
}

// 登录品泰
export const LoginPlatform = {
    Dev: 0,
    WechatApp: 1,
    Wechat: 2
}
// 平台
export const Platform = {
    Android: "Android",
    IOS: "IOS",
    Web: "Web",
    Wechat: "Wechat"
}

// 渠道
export const ChannelType = {
    Dev: "dev",
    Public: "public"
}