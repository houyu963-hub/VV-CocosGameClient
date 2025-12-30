// 游戏参数配置
export const Config = {
    hash: '',
    design_width: 1624,
    design_height: 750,
    timeout_socket: 10000,    // ws请求超时时间
    heartbeat_interval: 2000, // 心跳时间间隔
    exclude_msgId: ['Base.ReqHeartbeat', 'Base.RspHeartbeat'], // 需要过滤的日志
    languageMap: {},          // 多语言配置表
    currency_rate: 100,       // 货币比率
    hotupdateDirNameMap: {    // 远程资源服、包内manifest文件夹、本地热更存储位置. 统一文件夹名
        0: 'hall',
    },

}