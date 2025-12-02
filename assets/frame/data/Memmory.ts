
/**
 * 临时储存
 */
export default class Memmory {
    // 全局公共
    public isCanSendMessage: boolean = false;                    // 是否可以向服务器发送消息
    // 大厅
    public hallbanner: string = '';                              // 大厅广告位数据
    // 游戏公共
    public gameClient: any = null;                               // 当前游戏处理类
    public room_id: string = '';                                 // 房间ID
    // 屏幕                          
    public screen_w: number = 0;                                 // 屏幕实际宽
    public screen_h: number = 0;                                 // 屏幕实际高
    // 热更
    public hotUpdate_map: { [key: number]: any } = {};          // 子游戏热更组件
    public need_hotUpdate_map: { [key: number]: boolean } = {}; // 子游戏是否需要热更

    // 清除房间数据
    public clearRoomData(): void {
        this.room_id = '';
        this.gameClient = null;
    }
}