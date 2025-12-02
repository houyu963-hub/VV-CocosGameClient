const jsb = (<any>window).jsb;

import { Asset, Button, JsonAsset, Label, ProgressBar, _decorator, sys } from "cc";
import { Bundle_name, Config, Scene_name } from "../../frame/config/Config";
import vv from "../../frame/Core";
import Thirdparty, { NativeEventId } from "../../frame/system/Thirdparty";
import { SceneBase } from "../../frame/ui/SceneBase";
import SceneNavigator from "../../frame/ui/SceneNavigator";
import root from "../../resources/pbjs.js";
import TableManager from "../../resources/script/tables/TableManager";
import { HotUpdate } from "./HotUpdate";
import LoginHander from "./LoginHander";
const { ccclass, property } = _decorator;
@ccclass
export default class Loading extends SceneBase {
    @property(Asset) hall_manifest: Asset = null!;

    private hotUpdate: HotUpdate = null;

    protected onLoad(): void {
        this.scheduleOnce(() => {
            Thirdparty.callThirdparty(NativeEventId.CloseSplash);
        }, 0.05)
        // 热更新通知
        vv.event.on(vv.eventType.already_up_to_date, this.already_up_to_date, this);
        vv.event.on(vv.eventType.new_version_found, this.new_version_found, this);
        vv.event.on(vv.eventType.update_failed, this.update_failed, this);

        SceneNavigator.curScene = Scene_name.Loading;
        this.showVersion();
        if (!jsb) {
            vv.logger.forceLog('web跳过热更新');
            this.loadRes();
            return;
        }
        if (Config.testApk) {
            vv.logger.forceLog('测试包跳过热更新');
            this.loadRes();
            return;
        }
        // 检查大厅热更
        this.hotUpdate = this.getComponent(HotUpdate);
        this.hotUpdate.manifest = this.hall_manifest;
        this.hotUpdate.init(0);
        this.hotUpdate.checkUpdate();
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private already_up_to_date(gameType: number): void {
        if (gameType === 0) {
            this.loadRes();
        }
    }

    private async new_version_found(gameType: number): Promise<void> {
        if (gameType === 0) {
            this.hotUpdate.hotUpdate();
        }
    }

    private async update_failed(gameType: number): Promise<void> {
        if (gameType === 0) {
            this.$('_btFix').active = true;
        }
    }

    private async showVersion(): Promise<void> {
        let version = await vv.utils.getVersion();
        this.$('_version', Label).string = `版本:${version}`;
    }

    /**
     * 加载大厅资源
     */
    private async loadRes(): Promise<void> {
        // 加载bundle
        let fialReason: any;
        let arr = [
            vv.asset.loadBundle(Bundle_name.Common),
            vv.asset.loadBundle(Bundle_name.Hall),
        ]
        await Promise.all(arr).catch((error) => {
            fialReason = error;
        })
        this.initGlobalVariable();

        let cconfig: JsonAsset = await vv.asset.loadRes("config/config", JsonAsset, null, Bundle_name.Resources).catch((error) => {
            return null
        })
        if (null != cconfig) {
            Config.hash = cconfig.json.hash || "";
            let needAssign = true;
            if ((sys.platform == sys.Platform.MOBILE_BROWSER || sys.platform == sys.Platform.DESKTOP_BROWSER) && null != Thirdparty.browser_params) {
                needAssign = false;
            }
            if (needAssign) {
                Object.assign(Config, cconfig.json)
            }
            console.warn(`needAssign --> ${needAssign}, cconfig --> ${JSON.stringify(cconfig.json)}`)
        }

        console.log('Loading --> Config value -->:', JSON.stringify(Config));

        if (fialReason) {
            console.log('asset load catch:' + fialReason);
            this.$('_tipsLabel', Label).string = '资源加载失败';
            this.$('_btFix').active = true;
            return;
        }
        await TableManager.instance.init()
        this.$('_ProgressBar', ProgressBar).progress = 1;
        this.$('_tipsLabel', Label).string = '正在登陆...';
        await LoginHander.instance.autoLogin();
    }

    // 初始化全局变量
    private initGlobalVariable(): void {
        vv.pb = root;
    }

    // 修复资源
    private _onBtFix(): void {
        this.$('_btFix', Label).string = '修复资源...';
        this.$('_btFix', Button).interactable = false;
        this.hotUpdate.repairClient(0);
    }

}