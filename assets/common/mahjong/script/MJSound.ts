import { Bundle_name } from 'db://assets/frame/config/Define';
import vv from '../../../frame/Core';

/**
 * 音乐音效
 */
export default class MJSound {
    private static _path = '/mahjong/audio/'; // 音效路径

    // 播放特效音效 checkPlaying:是否检查是否在播放
    public static playEffect(audioName: string, loop: boolean = false, checkPlaying: boolean = true): void {
        vv.audio.playEffect(this._path + audioName, Bundle_name.Common, checkPlaying, loop);
    }

    // 停止特效音效
    public static stopEffect(audioName: string): void {
        vv.audio.stopEffect(this._path + audioName);
    }

    // 停止所有特效音效
    public static stopAllSound(): void {
        for (const iterator in this.soundList) {
            this.stopEffect(iterator);
        }
    }

    // 音效列表
    public static soundList = {
        dianjipai: 'public/dianjipai',           // 点击牌
        mapai: 'public/mapai',                   // 码牌
        chupai: 'public/chupai',                 // 出牌
        chapaimoca: 'public/chapaimoca',         // 插入牌
    }

}