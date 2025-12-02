import { _decorator, Slider, Toggle } from 'cc';
import { EDITOR } from 'cc/env';
import PopupBase from 'db://assets/frame/ui/PopupBase';
import { Client } from 'db://assets/hall/script/Client';
import { LanguageDefine, SettingProperty } from 'db://assets/hall/script/Define';
import { SettingLogic } from 'db://assets/hall/script/SettingLogic';
const { ccclass } = _decorator;

@ccclass
export class MahjongSetting extends PopupBase<void> {

    private _setting_logic: SettingLogic;

    protected onEnable(): void {
        this._setting_logic = Client.instance.Setting;
        this.$('_slider_music', Slider).progress = Number(this._setting_logic.getSettingPropertyByName(SettingProperty.MusicVolumeValue));
        this.$('_slider_voice', Slider).progress = Number(this._setting_logic.getSettingPropertyByName(SettingProperty.EffectVolumeValue));

        let isLocal = this._setting_logic.getSettingPropertyByName(SettingProperty.Language) === LanguageDefine.Local;
        this.$('_local', Toggle).isChecked = isLocal;
        this.$('_mandarin ', Toggle).isChecked = !isLocal;
    }

    // 滑动音乐
    private onSliderMusic(slider: Slider) {
        this._setting_logic.setSettingProperty(SettingProperty.MusicVolumeValue, slider.progress.toString());
    }

    // 滑动声音
    private onSliderVoice(slider: Slider) {
        this._setting_logic.setSettingProperty(SettingProperty.EffectVolumeValue, slider.progress.toString());
    }

    // 语言改变
    private onToggleContainer(): void {
        if (EDITOR) return;
        let str = this.$('_local', Toggle).isChecked ? LanguageDefine.Local : LanguageDefine.International
        this._setting_logic.setSettingProperty(SettingProperty.Language, str);
    }

    public async close(): Promise<void> {
        super.close();
        this._setting_logic.updateSettings(); // 请求更新
    }
}