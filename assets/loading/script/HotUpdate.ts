const jsb = (<any>window).jsb;

import { Asset, Component, game, Label, ProgressBar, _decorator } from 'cc';
import { Config } from 'db://assets/frame/config/Config';
import vv from 'db://assets/frame/Core';
const { ccclass, property } = _decorator;

@ccclass('HotUpdate')
export class HotUpdate extends Component {
    @property(Label) info: Label = null!;
    @property(ProgressBar) fileProgress: ProgressBar = null!;

    public manifest: Asset = null;
    private versionCompareHandle: (versionA: string, versionB: string) => number = null!;
    private new_version_found = false;

    private _gameType: number = 0;
    private _updating = false;
    private _storagePath = '';
    private _am: jsb.AssetsManager = null!;
    private _failCount = 0;

    protected onDestroy(): void {
        this._am?.setEventCallback(null!);
    }

    // 修复逻辑
    public repairClient(gameType: number): void {
        // 删除本地热更新目录
        if (jsb.fileUtils) {
            const hotUpdatePath = `${jsb.fileUtils.getWritablePath()}remote-asset/${Config.hotupdateDirNameMap[gameType]}`;
            if (jsb.fileUtils.isDirectoryExist(hotUpdatePath)) {
                jsb.fileUtils.removeDirectory(hotUpdatePath);
            }
            // 重启游戏，重新走热更新检查
            game.restart();
        }
    }


    // use this for initialization
    public init(gameType: number): void {
        // Hot update is only available in Native build
        if (!jsb) {
            return;
        }
        if ((!this._gameType && this._gameType !== 0) || this._gameType < 0) {
            console.log('game type uninit');
            return;
        } 
        this._gameType = gameType;
        this._storagePath = `${jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/'}remote-asset/${Config.hotupdateDirNameMap[this._gameType]}`;
        console.log('Storage path for remote asset : ' + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA: string, versionB: string) {
            console.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            if (vA.length > vB.length) {
                return 1;
            } else if (vA.length < vB.length) {
                return -1;
            }
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || '0');
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            return 0;
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, this.versionCompareHandle);

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this._am.setVerifyCallback((path: string, asset: any) => {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                // if (this.info) this.info.string = "Verification passed : " + relativePath;
                return true;
            }
            else {
                // if (this.info) this.info.string = "Verification passed : " + relativePath + ' (' + expectedMD5 + ')';
                return true;
            }
        });
        // if(this.info)this.info.string = 'Hot update is ready, please check or directly update.';
    }

    // 检测是否热更
    public checkUpdate(): void {
        if (!jsb) {
            return;
        }
        if (this._updating) {
            if (this.info) this.info.string = 'Checking or updating ...';
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            let url = this.manifest.nativeUrl;
            this._am.loadLocalManifest(url);
            if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
                if (this.info) this.info.string = 'Failed to load local manifest ...';
                return;
            }
            this._am.setEventCallback(this.checkCb.bind(this));

            this._am.checkUpdate();
            this._updating = true;
        }
    }

    // 开始热更
    public hotUpdate(): void {
        if (!jsb) {
            return;
        }
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                let url = this.manifest.nativeUrl;
                this._am.loadLocalManifest(url);
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        }
    }

    // 检测更新回调处理函数
    private checkCb(event: any): void {
        // console.log('check hotupdate callback code: ' + event.getEventCode());
        let gameName = vv.utils.getGameNameByType(this._gameType);
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("checkCb: No local manifest file found, hot update skipped." + '[' + gameName + ']');
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("checkCb: Fail to download manifest file, hot update skipped." + '[' + gameName + ']');
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("checkCb: Already up to date with the latest remote version." + '[' + gameName + ']');
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                console.log('checkCb: New version found, please try to update. (' + Math.ceil(this._am.getTotalBytes() / 1024) + 'kb)' + '[' + gameName + ']');
                this.new_version_found = true;
                break;
            default:
                return;
        }
        this._am.setEventCallback(null!);
        this._updating = false;
        if (this.new_version_found) {
            vv.event.emit(vv.eventType.new_version_found, this._gameType);
        } else {
            vv.event.emit(vv.eventType.already_up_to_date, this._gameType);
        }
    }

    // 更新回调处理函数
    private updateCb(event: any): void {
        let needRestart = false;
        let failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log('updateCb: No local manifest file found, hot update skipped.' + '[' + this._gameType + ']');
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                if (this.fileProgress) {
                    this.fileProgress.progress = event.getPercent();
                }
                // 文件数
                // if(this.info)this.info.string = event.getDownloadedFiles() + ' / ' + event.getTotalFiles();
                // 字节数
                // let totalBytes = Math.ceil(event.getTotalBytes() / 1024);
                // let downloadedBytes = Math.ceil(event.getDownloadedBytes() / 1024);
                // if (this.info) this.info.string = `${downloadedBytes}kb/${totalBytes}kb`;
                // 百分比
                if (this.info) {
                    let percent = event.getPercent();
                    if (percent >= 0) {
                        this.info.string = `updating:${(percent * 100).toFixed(2)}%`;
                    }
                }
                vv.event.emit(vv.eventType.update_progression, { gameType: this._gameType, progress: event.getPercentByFile() });
                var msg = event.getMessage();
                if (msg) {
                    // if(this.info)this.info.string = 'Updated file: ' + msg;
                    // cc.log(event.getPercent()/100 + '% : ' + msg);
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log('updateCb: Fail to download manifest file, hot update skipped.' + '[' + this._gameType + ']');
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log('updateCb: Already up to date with the latest remote version.' + '[' + this._gameType + ']');
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                if (this.info) this.info.string = 'update finished';
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                if (this.info) this.info.string = 'update failed';
                console.log('updateCb: Asset update failed: ' + event.getAssetId() + ', ' + event.getMessage() + '[' + this._gameType + ']');
                failed = !this.retry();
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                if (this.info) this.info.string = 'error updating';
                console.log('updateCb: Asset update error: ' + event.getAssetId() + ', ' + event.getMessage() + '[' + this._gameType + ']');
                failed = !this.retry();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                if (this.info) this.info.string = 'error decompress';
                // if (this.info) this.info.string = event.getMessage();
                console.log('updateCb: Asset decompress failed.')
                failed = true;
                break;
            default:
                break;
        }
        if (failed) {
            this._am.setEventCallback(null);
            this._updating = false;
            vv.event.emit(vv.eventType.update_failed, this._gameType);
        }
        // 更新完成 设置搜索路径并重启游戏
        if (needRestart) {
            this._am.setEventCallback(null!);
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            newPaths.forEach(path => {
                if (!searchPaths.includes(path)) {
                    Array.prototype.unshift.apply(searchPaths, path);
                }
            })
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            console.log('updateCb: hotupdate succeed. set hotUpdateSearchPaths:' + JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            // restart game.
            if (this._gameType === 0) {
                setTimeout(() => {
                    game.restart();
                }, 1000)
            } else {
                vv.event.emit(vv.eventType.update_finished, this._gameType);
            }
        }
    }

    // 更新失败重试
    private retry(): boolean {
        this._failCount++;
        if (this._failCount <= 3) { // 重试3次
            if (this.info) this.info.string = 'retry failed assets...x' + this._failCount;
            this._am.downloadFailedAssets();
            return true;
        } else {
            this._failCount = 0;
            return false;
        }
    }
}