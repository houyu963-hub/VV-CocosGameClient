import AssetBundle from "db://assets/frame/asset/AssetBundle";
import AudioPlayer from "db://assets/frame/audio/AudioPlayer";
import Memmory from "db://assets/frame/data/Memmory";
import Storage from "db://assets/frame/data/Storage";
import UserData from "db://assets/frame/data/UserData";
import { EventDefine } from "db://assets/frame/event/EventDefine";
import EventManager from "db://assets/frame/event/EventManager";
import LocalizationBase from "db://assets/frame/localization/LocalizationBase";
import HeartbeatController from "db://assets/frame/net/Heartbeat";
import Http from "db://assets/frame/net/Http";
import Services from "db://assets/frame/services/Services";
import Logger from "db://assets/frame/system/Logger";
import PopupManager from "db://assets/frame/ui/PopupManager";
import type root from "../resources/pbjs";
import Network from "./net/Network";
import CommonUtils from "./utils/CommonUtils";

/**
 * 框架核心模块入口
 */
export default class vv {
    /** 事件名称 */
    static eventType = EventDefine;
    /** 日志打印 */
    static logger = new Logger();
    /** 音频模块 */
    static audio = new AudioPlayer();
    /** 资源加载模块 */
    static asset = new AssetBundle();
    /** 全局消息 */
    static event = new EventManager();
    /** WS心跳 */
    static heartbeat = new HeartbeatController();
    /** WS网络 */
    static network = new Network();
    /** 弹窗管理 */
    static ui = new PopupManager();
    /** 工具类 */
    static utils = new CommonUtils();
    /** http */
    static http = new Http();
    /** 用户模块 */
    static user = new UserData();
    /** 多语言模块 */
    static language = new LocalizationBase();
    /** 协议定义类型 */
    static pb: typeof root;
    /** 本地储存 */
    static storage = new Storage();
    /** 临时储存 */
    static memmory = new Memmory();
    /** 服务类 */
    static services = new Services();
}

