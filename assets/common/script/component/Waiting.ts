import { Label, _decorator } from "cc";
import PopupBase from 'db://assets/frame/ui/PopupBase';

const { ccclass } = _decorator;
@ccclass
export class Waiting extends PopupBase<string> {

    protected init(): void {
        this.$('_text', Label).string = this.options ?? '';
    }
}