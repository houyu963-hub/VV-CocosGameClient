const jsb = (<any>window).jsb;

import { Asset, AssetManager, Constructor, ImageAsset, Prefab, SpriteFrame, Texture2D, assetManager, isValid, resources } from "cc";
import vv from "../Core";
import { Bundle_name, Config } from "../config/Config";

/**
 * 资源加载
 */
export default class AssetBundle {

    /**
     * 缓存的资源
     */
    public cached_res: Map<string, any> = new Map<string, any>();

    /**
     * 加载bd包
     * @param bundleName 包名
     */
    public async loadBundle(bundleName: Bundle_name, gameType?: number): Promise<AssetManager.Bundle> {
        if (assetManager.getBundle(bundleName)) {
            return assetManager.getBundle(bundleName);
        }
        return new Promise((resolve, reject) => {
            let dirPath: string = bundleName;

            let loadBundle = (path: string) => {
                assetManager.loadBundle(path, async (err, bundle) => {
                    if (err) {
                        vv.logger.forceLog(`load bundle ${path} err`);
                        vv.logger.forceLog(err);
                        return reject(err);
                    }
                    resolve(bundle);
                })
            }
            // web和测试包直接加载包内的
            if (!jsb || Config.testApk) {
                loadBundle(dirPath);
                return;
            }
            // 原生加载玩家本地下载的
            if (gameType > 0) { // 加载子游戏
                let path = this.getResDirPath(gameType);
                dirPath = `${jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/'}remote-asset/${path}`;
            } else { // 加载hall hall包含【login、hall、mahjong】全部资源
                dirPath = `${jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/'}remote-asset/hall/assets/${bundleName}`;
            }
            // if (jsb.fileUtils.isDirectoryExist(dirPath)) {
            //     // 从用户目录加载
            //     loadBundle(dirPath);
            // } else {
            // 从包内加载
            loadBundle(bundleName);
            // } 
        })
    }

    /**
     * 获取子游戏资源文件夹路径
     */
    private getResDirPath(gameType: number): string {
        let dirPath = Config.hotupdateDirNameMap[gameType];
        return dirPath;
    }

    /**
     * 释放bd包资源
     * @param bundleName 包名
     */
    public releaseBundle(bundleName: Bundle_name): void {
        assetManager.getBundle(bundleName).releaseAll();
    }

    /**
     * 预加载文件夹下的Prefab
     * @param name 
     * @param progressCallback 
     * @returns 
     */
    public preloadPrefab(name: Bundle_name, progressCallback?: (completedCount: number, totalCount: number, item: any) => void, gameType?: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let now = Date.now();
            this.loadBundle(name, gameType).then((bundle) => {
                bundle.preloadDir('./', Prefab, progressCallback, (err: Error, pre) => {
                    if (err) {
                        vv.logger.forceLog('bundle load err: ' + name);
                        vv.logger.forceLog(err);
                        reject(err);
                        return;
                    }
                    vv.logger.log(`Preload ${name} In Time: ${Date.now() - now}ms`);
                    resolve();
                })
            }).catch((reason: any) => { })
        })
    }

    /**
     * 加载单个资源
     * @param paths 路径
     * @param type 资源类型
     * @param onComplete 加载完成回调
     * @param bundleName 包名
     * @returns 
     */
    public async loadRes<T extends Asset>(paths: string, type: Constructor<T>, onComplete?: (err: Error | null, data: T) => void, bundleName?: string) {
        return new Promise<T>((resolve, reject) => {
            // 先看看缓存里有没有
            const res: T = this.cached_res.get(paths);
            if (res && isValid(res, true)) {
                if (onComplete) onComplete(null, res);
                resolve(res);
                return;
            }
            const callback = (error: Error, res: T) => {
                if (error) {
                    if (onComplete) onComplete(error, res);
                    reject(error);
                } else {
                    if (res.isValid) {
                        // 缓存资源
                        this.cached_res.set(paths, res);
                        // 执行回调
                        onComplete?.(null, res);
                        resolve(res);
                    } else {
                        onComplete?.(error, res);
                        reject(error);
                    }
                }
            }
            if (bundleName === 'resources') {
                resources.load(paths, type, callback);
            } else {
                // 检查bd是否加载
                if (!assetManager.getBundle(bundleName)) {
                    vv.logger.warn('bundle unloaded:' + bundleName);
                    resolve(null);
                    return;
                }
                assetManager.getBundle(bundleName).load(paths, type, callback);
            }
        })
    }

    /**
     * 加载远程资源
     * @param path 路径
     * @returns 
     */
    public async loadRemoteRes(path: string, callback?: (spriteFrame: SpriteFrame) => void): Promise<SpriteFrame> {
        return new Promise(resolve => {
            assetManager.loadRemote<ImageAsset>(path, (err, data) => {
                if (err) {
                    vv.logger.error(err.message || err);
                    callback?.(null);
                    resolve(null);
                    return;
                }
                let texture = new Texture2D();
                texture.image = data;
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                callback?.(spriteFrame);
                resolve(spriteFrame);
            })
        })
    }

}