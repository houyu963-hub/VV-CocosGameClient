import { Enum, Sprite, SpriteFrame, _decorator, assetManager, sys } from 'cc';
import { EDITOR } from 'cc/env';
import { Bundle_name } from 'db://assets/frame/config/Define';
import vv from '../Core';
import LocalizationBase, { Lang } from './LocalizationBase';
const BUNDLE_ENUM = createBundleEnum();
const { ccclass, property, executeInEditMode, menu, requireComponent } = _decorator;

@ccclass('LanguageSprite')
@executeInEditMode(true)
@requireComponent(Sprite)
@menu('Custom/LocalizationSprite')
export class LocalizationSprite extends LocalizationBase {
    @property({ type: Enum(BUNDLE_ENUM) }) bundle: number;

    protected async updateContent(): Promise<void> {
        let imgName = this.findLanguage(this.id);
        let spriteFrame = null;
        if (EDITOR) {
            spriteFrame = await this.loadMessageSpriteInEditor(imgName);
        } else {
            spriteFrame = await this.loadMessageSprite(imgName);
        }
        this.node.getComponent(Sprite).spriteFrame = spriteFrame;
    }

    // 运行时加载
    private async loadMessageSprite(imgName: string): Promise<SpriteFrame> {
        let curLanguage = sys.localStorage.getItem('language');
        if (!curLanguage) {
            curLanguage = Lang.Chinese.toString();
        }
        let folder = Lang[curLanguage];
        let spriteFrame = await vv.asset.loadRes(`pngLanguage/${folder}/${imgName}/spriteFrame`, SpriteFrame, null, BUNDLE_ENUM[this.bundle]);
        return spriteFrame;
    }

    // 编辑器加载
    private async loadMessageSpriteInEditor(imgName: string): Promise<SpriteFrame> {
        let dir_name = this.getDirPath();
        let folder = Lang[this.language];
        vv.logger.log('foler ->' + folder + ', imgName -> ' + imgName);
        let uuid = await Editor.Message.request('asset-db', 'query-uuid', `db://assets/${dir_name}/pngLanguage/${folder}/${imgName}.png/spriteFrame`);
        return new Promise((resolve, reject) => {
            assetManager.loadAny(uuid, (err: any, spriteFrame: SpriteFrame) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(spriteFrame);
            })
        })
    }

    // 获取加载路径
    private getDirPath(): string {
        let dir_name: string = '';
        switch (BUNDLE_ENUM[this.bundle]) {
            case Bundle_name.Resources:
                dir_name = 'resources';
                break;
            case Bundle_name.Hall:
                dir_name = 'hall';
                break;
            default:
                break;
        }
        return dir_name;
    }
}

function createBundleEnum(): object {
    let obj = {}, index = 0;
    for (let i in Bundle_name) {
        obj[Bundle_name[i]] = index;
        index++;
    }
    return obj;
}