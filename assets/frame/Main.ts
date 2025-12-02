import { Game, JsonAsset, assetManager, game, sys, view } from "cc";
import { EDITOR } from "cc/env";
import { Config } from "db://assets/frame/config/Config";
import vv from "./Core";
import ThirdpartyListener from "./listener/ThirdpartyListener";
import Thirdparty from "./system/Thirdparty";

class Main {
    constructor() {
        // 初始化
        let music_mute = sys.localStorage.getItem('music_mute');
        let volume_mute = sys.localStorage.getItem('volume_mute');
        vv.audio.setMusicVolume(music_mute === 'true' ? 0 : 1);
        vv.audio.setEffectVolume(volume_mute === 'true' ? 0 : 1);
        // 启动服务
        vv.services.add(ThirdpartyListener);
        vv.services.init();

        Thirdparty.initBrowserParam();
        // 设置帧率
        game.frameRate = 120;
        // 切换前后台监听
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
        game.on(Game.EVENT_HIDE, this.onGameHide, this);
        // 屏幕宽高
        vv.memmory.screen_w = view.getVisibleSize().width;
        vv.memmory.screen_h = view.getVisibleSize().height;
    }

    private onGameShow(): void {
        vv.logger.log('## 游戏进入前台');
        vv.event.emit(vv.eventType.gameShow, false);
    }

    private onGameHide(): void {
        vv.logger.log('## 游戏进入后台');
        vv.event.emit(vv.eventType.gameHide);
        vv.network.disconnect(1000, '游戏进入后台');
    }
}

/**
 * 只在编辑器中运行
 */
class EditorMain {
    constructor() {
        // 加载多语言配置
        // this.loadTMessageConfig();
    }
    private async loadTMessageConfig(): Promise<void> {
        let uuid = await Editor.Message.request('asset-db', 'query-uuid', 'db://assets/resources/language.json');
        assetManager.loadAny(uuid, (err, res: JsonAsset) => {
            if (err) {
                vv.logger.error(err);
                return;
            }
            const jsonData: any = res.json;
            Config.languageMap = jsonData;
            vv.logger.log('multi-language load finished!');
        })
    }
}

if (!EDITOR) {
    // 激活启动类 
    new Main();
    // 全局变量
    window['vv'] = window['vv'] || vv;
    // 注册全局事件
    window['callCocos'] = (json: string) => {
        vv.logger.forceLog(`from android callback: ${json}`);
        vv.event.emit(vv.eventType.onNative2cocos, json);
    }
} else {
    new EditorMain();
}