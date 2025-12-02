import { AudioClip, AudioSource } from "cc";
import vv from "../Core";
import { Bundle_name } from "../config/Config";

/**
 * 音频播放
 */
export default class AudioPlayer {

    private _musicSource: AudioSource = null;
    private _effectSources: Map<string, AudioSource> = new Map(); // 用于存储音效和对应的AudioSource

    /**
     * 主音量
     */
    private _masterVolume: number = 1.0;
    public get masterVolume(): number { return this._masterVolume; }

    /**
     * 音乐音量
     */
    private _musicVolume: number = 1.0;
    public get musicVolume(): number { return this._musicVolume; }

    /**
     * 特效音量
     */
    private _effectVolume: number = 1.0;
    public get effectVolume(): number { return this._effectVolume; }

    /**
     * 震动
     */
    private _vibrationVolume: number = 1.0;
    public get vibrationVolume(): number { return this._vibrationVolume; }

    /**
     * 设置主音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public setMasterVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;
        this._masterVolume = value;
        this.setMusicVolume(this._musicVolume);
        this.setEffectVolume(this._effectVolume);
    }

    /**
     * 设置音乐音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public setMusicVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;
        this._musicVolume = value;
        let realVolume = this._masterVolume * value;
        if (this._musicSource) {
            this._musicSource.volume = realVolume;
        }
    }

    /**
     * 设置特效音量
     * @param value 音量值（0.0 ~ 1.0）
     */
    public setEffectVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;
        this._effectVolume = this._masterVolume * value;
    }

    /**
     * 震动
     * @param value 震动值（0.0 ~ 1.0）
     */
    public setVibrationVolume(value: number): void {
        if (value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;
        this._vibrationVolume = value;
    }

    /**
     * 播放音乐
     * @param clip 音频
     */
    public playMusic(paths: string, bundle: Bundle_name): void {
        vv.asset.loadRes(paths, AudioClip, (err: Error | null, clip: AudioClip) => {
            if (err) {
                vv.logger.warn(err);
                return;
            }
            if (!this._musicSource) this._musicSource = new AudioSource();
            this._musicSource.stop();
            this._musicSource.clip = clip;
            this._musicSource.loop = true;
            this._musicSource.volume = this._masterVolume * this._musicVolume;
            this._musicSource.play();
        }, bundle)
    }

    /**
     * 停止音乐
     * @param clip 音频
     */
    public stopMusic(): void {
        this._musicSource?.stop();
    }

    /**
     * 暂停音乐
     */
    public pauseMusic(): void {
        this._musicSource?.pause();
    }

    /**
     * 恢复音乐
     */
    public recoverMusic(): void {
        if (this._musicSource && !this._musicSource.playing) {
            this._musicSource.play();
        }
    }

    /**
     * 播放特效音频
     * @param clip 音频
     * @param bundle bundle
     * @param checkPlaying 允许在播放此音频
     */
    public playEffect(paths: string, bundle: Bundle_name, checkPlaying: boolean = true, loop: boolean = false): void {
        if (checkPlaying && this._effectSources.get(paths)?.playing) return;
        vv.asset.loadRes(paths, AudioClip, (err: Error | null, clip: AudioClip) => {
            if (err) {
                vv.logger.warn(err);
                return;
            }
            let source = this._effectSources.get(paths);
            if (source) {
                source.volume = this._masterVolume * this._effectVolume;
                source.play();
                return;
            }
            let effectSource = new AudioSource();
            effectSource.clip = clip;
            effectSource.loop = loop;
            effectSource.volume = this._masterVolume * this._effectVolume;
            effectSource.play();
            this._effectSources.set(paths, effectSource);
        }, bundle)
    }

    /**
     * 停止特定的特效音频
     * @param paths 音频路径
     */
    public stopEffect(paths: string): void {
        let effectSource = this._effectSources.get(paths);
        if (effectSource && effectSource.playing) {
            effectSource.stop();
            this._effectSources.delete(paths);
        }
    }

    /**
     * 静音
     */
    private _tempEffectVolume: number;
    public mute(): void {
        this._tempEffectVolume = this._effectVolume;
        this.setMasterVolume(0.0);
        this._updateVolume();
    }

    /**
     * 取消静音
     */
    public cancelMute(): void {
        this._effectVolume = this._tempEffectVolume ?? this._effectVolume;
        this.setMasterVolume(1.0);
        this._updateVolume();
    }

    /**
     * 更新音量
     */
    private _updateVolume(): void {
        for (const key in this._effectSources) {
            if (Object.prototype.hasOwnProperty.call(this._effectSources, key)) {
                const element: AudioSource = this._effectSources[key];
                element.volume = this._masterVolume * this._effectVolume;
            }
        }
    }
}