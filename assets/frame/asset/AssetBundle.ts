const jsb = (<any>window).jsb;

import { Asset, AssetManager, Constructor, ImageAsset, Node, Prefab, Sprite, SpriteFrame, Texture2D, assetManager, isValid, resources } from "cc";
import vv from "../Core";
import { Config } from "../config/Config";
import { Bundle_name } from "../config/Define";

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
            // web
            if (!jsb) {
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
                    vv.logger.error(error);
                    resolve(null);
                } else {
                    if (res.isValid) {
                        // 缓存资源
                        this.cached_res.set(paths, res);
                        // 执行回调
                        onComplete?.(null, res);
                        resolve(res);
                    } else {
                        onComplete?.(error, res);
                        vv.logger.error(error);
                        resolve(null);
                    }
                }
            }
            if (bundleName === 'resources') {
                resources.load(paths, type, callback);
            } else {
                // 检查bd是否加载
                if (!assetManager.getBundle(bundleName)) {
                    vv.logger.error('bundle unloaded:' + bundleName);
                    resolve(null);
                    return;
                }
                assetManager.getBundle(bundleName).load(paths, type, callback);
            }
        })
    }

    /**
     * 加载远程图片
     * @param path 路径
     * @param callback 回调
     * @param spriteNode 节点 如果有节点则设置节点的SpriteFrame并适配宽高
     * @param ext 扩展名 默认 { ext: '.png' }
     * @returns 
     */
    public async loadRemoteRes(path: string, callback?: (spriteFrame: SpriteFrame) => void, spriteNode?: Node, ext = { ext: '.png' }): Promise<SpriteFrame> {
        // 添加加载缓存，避免重复加载同一张图片
        if (this.cached_res.has(path)) {
            const cachedFrame = this.cached_res.get(path);
            if (cachedFrame && isValid(cachedFrame)) {
                this.applySpriteFrame(cachedFrame, spriteNode, callback);
                return Promise.resolve(cachedFrame);
            }
        }

        return new Promise(resolve => {
            assetManager.loadRemote<ImageAsset>(path, ext, (err, data) => {
                if (err) {
                    vv.logger.error(`Load remote resource failed: ${path}`);
                    callback?.(null);
                    resolve(null);
                    return;
                }
                try {
                    // 数据验证
                    if (!data || !data.isValid) {
                        vv.logger.error(`Loaded remote resource is invalid: ${path}`);
                        callback?.(null);
                        resolve(null);
                        return;
                    }
                    // 创建纹理和精灵帧
                    let spriteFrame = new SpriteFrame();
                    let texture = new Texture2D();
                    texture.image = data;
                    spriteFrame.texture = texture;

                    // 缓存资源
                    this.cached_res.set(path, spriteFrame);

                    // 应用到节点
                    this.applySpriteFrame(spriteFrame, spriteNode, callback);
                    resolve(spriteFrame);
                } catch (error) {
                    vv.logger.warn(`apply remote resource failed: ${error}`);
                }
            });
        });
    }

    private applySpriteFrame(spriteFrame: SpriteFrame, spriteNode?: Node, callback?: (spriteFrame: SpriteFrame) => void): void {
        if (spriteNode && spriteNode.isValid && spriteNode.active) {
            const spriteComponent = spriteNode.getComponent(Sprite);
            if (spriteComponent) {
                spriteComponent.spriteFrame = spriteFrame;

                // TODO保持图片比例
                // const uiTransform = spriteNode.getComponent(UITransform);
                // if (uiTransform && spriteFrame) {
                //     const designWidth = uiTransform.width;
                //     const designHeight = uiTransform.height;
                //     const realWidth = spriteFrame.width;
                //     const realHeight = spriteFrame.height;

                //     // 计算缩放比例，保持图片完整显示
                //     const scaleX = designWidth / realWidth;
                //     const scaleY = designHeight / realHeight;
                //     const scale = Math.min(scaleX, scaleY); // 取较小的比例确保图片完整显示

                //     spriteNode.scale = v3(scale, scale, 1);
                // }
            }
        }
        callback?.(spriteFrame);
    }

}