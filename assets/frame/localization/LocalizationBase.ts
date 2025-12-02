import { CCInteger, Component, Enum, JsonAsset, _decorator, sys } from 'cc';
import { EDITOR } from 'cc/env';
import { Bundle_name, Config } from 'db://assets/frame/config/Config';
import vv from '../Core';
const { ccclass, property, executeInEditMode } = _decorator;

/** 
 * 语言更改事件
 */
export const LANG_CHANGED = 'lang-change';

/** 
 * 支持的语言
 */
export enum Lang {
    Chinese,
}
export const LangText = {
    [Lang.Chinese]: 'Chinese',
}

@ccclass('LocalizationBase')
@executeInEditMode(true)
export default class LocalizationBase extends Component {

    @property({ type: CCInteger }) id: number;
    @property({ type: Enum(Lang) }) language = Lang.Chinese;

    public languageMap: object = {};
    private _lastLanguage: number = 0;
    private _lastId: number = 0;

    protected onLoad(): void {
        vv.event.on(LANG_CHANGED, this.langChanged, this);
        if (EDITOR) {
            this._lastId = this.id;
        } else {
            this.updateContent();
        }
    }

    protected onDestroy(): void {
        vv.event.off(LANG_CHANGED, this.langChanged, this);
    }

    protected update(): void {
        if (EDITOR) {
            if (this.id != this._lastId) {
                this._lastId = this.id;
                this.updateContent();
            } else if (this.language != this._lastLanguage) {
                this._lastLanguage = this.language;
                this.updateContent();
            }
        }
    }

    private langChanged(lang: Lang): void {
        this.language = lang;
        this.updateContent();
    }

    /**
     * 语言更改回调（子类重写该函数以具体实现）
     */
    protected updateContent(): void { }

    /**
     * 加载配置文件
     */
    public async init(): Promise<void> {
        let res = await vv.asset.loadRes('language', JsonAsset, null, Bundle_name.Resources);
        Config.languageMap = res.json;
    }

    /**
     * 查找文本
     * @param id 
     * @returns 
     */
    public findLanguage(id: number): string {
        if (Config.languageMap[id]) {
            let curLanguage = sys.localStorage.getItem('language');
            if (!EDITOR) {
                if (!curLanguage) {
                    curLanguage = Lang.Chinese.toString();
                }
            } else {
                curLanguage = this.language;
            }

            return Config.languageMap[id][LangText[curLanguage]]?.replace(/\\n/g, '\n');
        } else {
            return id.toString();
        }
    }

    /**
     * 格式化多语言方法
     * 适用与'测试{0},测试{1}'
     * @param messageId 
     * @param args 
     * @returns 
     */
    public format(messageId: number, ...args: string[]): string {
        let s = this.findLanguage(messageId);
        if (!s) {
            vv.logger.warn('messageId not find:' + messageId);
            return messageId.toString();
        }
        if (args) {
            return s.replace(/{(\d+)}/g, function (match, index) {
                return args[index] ?? match;
            })
        }
        return s;
    }

    /**
     * 含参文本替换
     * 适用与'测试{0},测试{1}'
     * @param messageId 
     * @param args 
     * @returns 
     */
    public formatText(s: string, ...args: string[]): string {
        if (!s) {
            return s;
        }
        if (args) {
            return s.replace(/{(\d+)}/g, function (match, index) {
                return args[index] ?? match;
            })
        }
        return s;
    }
}

