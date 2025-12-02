import { _decorator, Node, RichText } from 'cc';
import CircleScrollLine from 'db://assets/frame/component/CircleScrollLine';
import vv from 'db://assets/frame/Core';
import BaseClass from 'db://assets/frame/ui/BaseClass';
import { Marquee } from 'db://assets/resources/pbjs';
import { CommonDefine } from '../CommonDefine';
import CommonListener from '../CommonListener';


const { ccclass, property } = _decorator;
@ccclass
export default class Marquees extends BaseClass {
    @property({ type: CircleScrollLine }) circleScrollLine: CircleScrollLine;

    protected onLoad(): void {
        vv.event.on(CommonDefine.startMarQuee, this.startMarQuee, this);
    }

    protected start(): void {
        this.circleScrollLine.startRoll(CommonListener.marquees);
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private startMarQuee(): void {
        this.circleScrollLine.startRoll(CommonListener.marquees);
    }

    // 刷新跑马灯item数据
    private onRefreshMarqueesEvent(item: Node, data: Marquee.INotifyMarquee) {
        if (!data) return;
        let node = item.getChildByName('_btText');
        this.setCustomData(node, data);
        let text = node.getComponent(RichText);
        text.string = data.Content;
    }

    // 点击跑马灯
    private _onBtText(event: TouchEvent): void {
        let target = event.target as unknown as Node;
        let data = this.getCustomData(target);
        vv.logger.log('点击跑马灯', data);
    }
}