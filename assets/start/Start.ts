import { _decorator, assetManager, Component, director } from "cc";

/**
 * 初始启动场景
 */
const { ccclass, property } = _decorator;
@ccclass
export default class Start extends Component {

    protected onLoad(): void {
        assetManager.loadBundle('loading', async (err, bundle) => {
            director.loadScene('Loading');
        })
    }
}