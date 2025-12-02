import { _decorator } from 'cc';
import PopupBase from 'db://assets/frame/ui/PopupBase';
const { ccclass } = _decorator;

@ccclass
export class MahjongSetting extends PopupBase<void> {


    public async close(): Promise<void> {
        super.close();
        // todo更新
    }
}