import { _decorator, resources } from "cc";
import vv from "../../frame/Core";
import { Config } from "../../frame/config/Config";
import { HotUpdate } from "./HotUpdate";

const { ccclass } = _decorator;
@ccclass
export default class CheckGameUpdate {

    public init(): void {
        vv.event.on(vv.eventType.already_up_to_date, this.already_up_to_date, this);
        vv.event.on(vv.eventType.new_version_found, this.new_version_found, this);
        this.checkSubgamesUpdate();
    }

    // 检测子游戏更新
    private checkSubgamesUpdate(): void {
        Object.keys(Config.hotupdateDirNameMap).forEach(async key => {
            let type = +key;
            if (type) {
                let hotJs = new HotUpdate();
                hotJs.manifest = await this.loadManifest(type);
                vv.memmory.hotUpdate_map[type] = hotJs;
                hotJs.init(type);
                hotJs.checkUpdate();
            }
        })
    }

    // 加载包内manifest
    private loadManifest(gameType: number): Promise<any> {
        return new Promise<any>(resolve => {
            let dirname: string = Config.hotupdateDirNameMap[gameType];
            let path = resources.getInfoWithPath(`/manifest/${dirname}/project`).path;
            resources.load(path, (err, data) => {
                if (err) {
                    vv.logger.forceLog(err);
                    return;
                }
                resolve(data);
            })
        })
    }

    // 发现新版本
    private async new_version_found(gameType: number): Promise<void> {
        vv.memmory.need_hotUpdate_map[gameType] = true;
        vv.event.emit(vv.eventType.update_state_value_change, gameType);
    }

    // 已经是最新版本了
    private already_up_to_date(gameType: number): void {
        vv.memmory.need_hotUpdate_map[gameType] = false;
        vv.event.emit(vv.eventType.update_state_value_change, gameType);
    }
}