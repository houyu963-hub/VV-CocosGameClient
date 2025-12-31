import { Color, Component, Label, Node, _decorator, director } from "cc";
import vv from "../../frame/Core";
import { Config } from "../../frame/config/Config";

const { ccclass, property } = _decorator;
@ccclass
export default class PersistRootNode extends Component {
    @property(Label) ping: Label;
    @property(Label) hash: Label;
    @property(Node) blockInput: Node;

    protected onLoad(): void {
        director.addPersistRootNode(this.node);
        this.ping.node.active = Config.debug;
        this.hash.node.active = Config.debug;

        vv.event.on(vv.eventType.ping, this.onPing, this);
        vv.event.on(vv.eventType.blockInput, this.onBlockInput, this);
    }

    protected start(): void {
        this.hash.string = Config.hash?.slice(0, 7);
    }

    protected onDestroy(): void {
        vv.event.removeAllByTarget(this);
    }

    private onPing(value: number): void {
        this.ping.string = 'Ping:' + value;
        if (value <= 60) {
            this.ping.color = Color.GREEN;
        } else if (value > 60 && value <= 120) {
            this.ping.color = Color.YELLOW;
        } else if (value > 120) {
            this.ping.color = Color.RED;
        }
    }

    private onBlockInput(value: boolean): void {
        vv.logger.log('BlockInput:' + value);
        this.blockInput.active = value;
    }
}