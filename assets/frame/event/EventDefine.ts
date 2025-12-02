/**
 * 事件定义
 */
export enum EventDefine {
    // network
    onSocketColse = 'onSocketColse',                // socket关闭
    onSocketOpen = 'onSocketOpen',                  // socket连接成功
    onSocketMsg = 'onSocketMsg',                    // socket数据返回
    onReceiveMsg = 'onReceiveMsg',                  // 数据返回
    onNetError = 'onNetError',                      // 网络错误
    onConnected = 'onConnected',                    // 连接上服务器
    ping = 'ping',                                  // ping
    autoLogin = 'autoLogin',                        // 登陆

    // hall
    gameShow = 'gameShow',                          // 游戏进入前台
    gameHide = 'gameHide',                          // 游戏进入后台
    blockInput = 'blockInput',                      // 阻止点击
    updatePlayerInfo = 'updatePlayerInfo',          // 更新玩家信息

    // hotUpdate
    already_up_to_date = 'already_up_to_date',               // 已是最新
    new_version_found = 'new_version_found',                 // 发现新版本
    update_progression = 'update_progression',               // 更新进度
    update_finished = 'update_finished',                     // 热更结束
    update_failed = 'update_failed',                         // 热更失败
    update_state_value_change = 'update_state_value_change', // 子游戏更新状态值改变

    // native
    onNative2cocos = 'onNative2cocos',              // 全局native消息
    onNativeBack = 'onNativeBack',                  // 原生返回
    onNativeGameShow = 'onNativeGameShow',          // 进入游戏前台
    onNativeGameHide = 'onNativeGameHide',          // 进入游戏后台
    onAppUpdate = 'onAppUpdate',                    // app版本有更新
    onNetworkChange = 'onNetworkChange',            // 网络状态改变

    onWxLoginSucc = 'onWxLoginSucc',                // 微信登录成功
}