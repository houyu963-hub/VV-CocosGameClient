export const Config = {
    // hash值 用于构建更新
    hash: '',
    // 测试模式
    debug: true,
    // 渠道
    channel_type: "dev",
    // 平台  Android/IOS/Web/Wechat
    platform: "Wechat",
    // 测试包 =true时不会走热更新 一般用于打全量包的时候 在构建更新包时务必设置为false
    testApk: false,
    // 设计分辨率
    design_width: 1624,
    design_height: 750,
    // 服务器地址
    server_http_address: 'http://192.168.1.101:3001',
    // 公告地址
    public_http_address: 'http://192.168.1.104',
    // ws请求超时时间
    timeout_socket: 10000,
    // 心跳时间间隔
    heartbeat_interval: 50000,
    // 需要过滤的日志
    exclude_msgId: ['Base.ReqHeartbeat', 'Base.RspHeartbeat'],
    // 多语言配置表
    languageMap: {},
    // 货币比率
    currency_rate: 100,
    // 远程资源服、包内manifest文件夹、本地热更存储位置. 统一文件夹名
    hotupdateDirNameMap: {
        0: 'hall',
    },
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
    Resources = 'resources',
    Loading = 'loading',
    Common = 'common',
    Hall = 'hall',
    Mahjong = 'mahjong',
}