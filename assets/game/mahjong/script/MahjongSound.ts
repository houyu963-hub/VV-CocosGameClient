import { Bundle_name } from 'db://assets/frame/config/Define';
import vv from '../../../frame/Core';

/**
 * 音乐音效
 */
export default class MahjongSound {
    private static _path = '/mahjong/audio/'; // 音效路径

    // 背景音乐
    public static playMusic(): void {
        vv.audio.playMusic(this._path + this.soundList.youxibeij, Bundle_name.Common);
    }

    // 播放特效音效 checkPlaying:是否检查是否在播放 sex: -1public资源 0男 1女
    public static playEffect(audioName: string, loop: boolean = false, checkPlaying: boolean = true, sex: number = -1): void {
        let path = this._path;
        if (sex >= 0) {
            let Ltype = '0';
            path += `${Ltype === '0' ? 'sichuan/' : 'putong/'}${sex === 0 ? 'man/' : 'woman/'}`;
        }
        vv.audio.playEffect(path + audioName, Bundle_name.Common, checkPlaying, loop);
    }

    // 停止特效音效
    public static stopEffect(audioName: string): void {
        vv.audio.stopEffect(`${this._path}${audioName}`);
    }

    // 停止所有特效音效
    public static stopAllSound(): void {
        for (const iterator in this.soundList) {
            this.stopEffect(iterator);
        }
    }

    // 音效列表
    public static soundList = {
        // 打牌中
        youxibeij: 'public/youxibeij',           // 游戏背景音乐
        daojishi: 'public/daojishi',             // 倒计时5s
        paijujieshu: 'public/paijujieshu',       // 牌局结束
        shibai: 'public/shibai',                 // 失败
        shengli: 'public/shengli',               // 胜利
        guafeng: 'public/guafeng',               // 刮风
        xiayu: 'public/xiayu',                   // 下雨
        liuju: 'public/liuju',                   // 流局
        feique: 'public/feique',                 // 飞缺
        kaishiyouxi: 'public/kaishiyouxi',       // 开始游戏
        huanpai: 'public/huanpai',               // 换牌
        tuijianhuanpai: 'public/tuijianhuanpai', // 推荐换牌
        pengpai: 'public/pengpai',               // 碰牌
        tanpai: 'public/tanpai',                 // 摊牌
        gangpai: 'public/gangpai',               // 杠牌
        // 快捷语
        phrase_1: 'phrase/phrase_1',
        phrase_2: 'phrase/phrase_2',
        phrase_3: 'phrase/phrase_3',
        phrase_4: 'phrase/phrase_4',
        phrase_5: 'phrase/phrase_5',
        phrase_6: 'phrase/phrase_6',

        /****************************************四川话****************************************/
        peng: 'mj/peng',      // 碰
        gang: 'mj/gang',      // 杠[刮阵风]
        hu: 'mj/hu',          // 胡
        sc_gang: 'mj/sc_gang',// 杠
        zimo: 'mj/zimo',      // 自摸
        // 1-9万
        mj1: 'mj/mjt1_1',
        mj2: 'mj/mjt1_2',
        mj3: 'mj/mjt1_3',
        mj4: 'mj/mjt1_4',
        mj5: 'mj/mjt1_5',
        mj6: 'mj/mjt1_6',
        mj7: 'mj/mjt1_7',
        mj8: 'mj/mjt1_8',
        mj9: 'mj/mjt1_9',
        // 1-9条
        mj11: 'mj/mjt3_1',
        mj12: 'mj/mjt3_2',
        mj13: 'mj/mjt3_3',
        mj14: 'mj/mjt3_4',
        mj15: 'mj/mjt3_5',
        mj16: 'mj/mjt3_6',
        mj17: 'mj/mjt3_7',
        mj18: 'mj/mjt3_8',
        mj19: 'mj/mjt3_9',
        // 1-9筒 
        mj21: 'mj/mjt2_1',
        mj22: 'mj/mjt2_2',
        mj23: 'mj/mjt2_3',
        mj24: 'mj/mjt2_4',
        mj25: 'mj/mjt2_5',
        mj26: 'mj/mjt2_6',
        mj27: 'mj/mjt2_7',
        mj28: 'mj/mjt2_8',
        mj29: 'mj/mjt2_9',
        /****************************************四川话****************************************/
    }

}