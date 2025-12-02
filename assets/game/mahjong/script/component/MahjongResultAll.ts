import { _decorator } from "cc";
import PopupBase from "db://assets/frame/ui/PopupBase";

const { ccclass, property } = _decorator;

@ccclass
export class MahjongResultAll extends PopupBase<{ backCallback: () => void }> {

    public async close(): Promise<void> {
        super.close();
        this.options.backCallback?.();
    }
}