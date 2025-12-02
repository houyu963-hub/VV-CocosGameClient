import { Label, RichText, _decorator } from 'cc';
import LocalizationBase from './LocalizationBase';
const { ccclass, menu } = _decorator;

@ccclass('LanguageLabel')
@menu('Custom/LocalizationLabel')
export class LocalizationLabel extends LocalizationBase {

    protected updateContent(): void {
        if (this.node.getComponent(Label)) {
            this.node.getComponent(Label).string = this.findLanguage(this.id);
        } else if (this.node.getComponent(RichText)) {
            this.node.getComponent(RichText).string = this.findLanguage(this.id);
        }
    }
}

