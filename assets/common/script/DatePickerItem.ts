import { Component, Label, _decorator } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export class DatePickerItem extends Component {
    public data: { value: any, index: number };

    public updata(data: { value: any, index: number }): void {
        this.data = data;
        this.node.getChildByName('Label').getComponent(Label).string = data.value.toString();
    }
}