import { _decorator, Color, Label } from "cc";
import ActiveSprite from "db://assets/frame/component/ActiveSprite";
import List from "db://assets/frame/component/List";
import vv from "db://assets/frame/Core";
import PopupBase from "db://assets/frame/ui/PopupBase";
import { Enum } from "db://assets/resources/pbjs";

export interface ListItemData {
    type: string,            // 类型
    multiplier: number,      // 倍率
    seat: string,            // 座位
    score: number,           // 分数
}

const { ccclass } = _decorator;

@ccclass
export class MahjongCoinFlow extends PopupBase<{ record: ListItemData[], roomType: Enum.RoomType }> {
    private _win_color: Color = new Color('AB0700');
    private _lose_color: Color = new Color('26497C');

    protected onDisable(): void {
        this.resetView();
    }

    protected init(options: { record: ListItemData[]; roomType: Enum.RoomType; }): void {
        this.$('_title', ActiveSprite).index = options.roomType === vv.pb.Enum.RoomType.ROOM_TYPE_GOLD ? 0 : 1;
    }

    protected onShow(options: { record: ListItemData[], roomType: Enum.RoomType }): void {
        this.updateView(options.record);
    }

    protected onNotifyInstantSettlement(options: ListItemData[]): void {
        this.updateView(options);
    }

    public updateView(record: ListItemData[]): void {
        this.$('_none').active = record.length === 0;
        let total = record.reduce((pre, cur) => pre + cur.score, 0);
        this.$('_total', Label).string = total > 0 ? `+${total}` : total.toString();
        this.$('_list', List).setList(record, (js, da, index, node) => {
            js.$('_type', Label).string = da.type;
            js.$('_multiplier', Label).string = da.multiplier.toString();
            js.$('_seat', Label).string = da.seat;
            js.$('_score', Label).string = da.score > 0 ? `+${da.score}` : da.score.toString();

            let color: Color = da.score > 0 ? this._win_color : this._lose_color;
            js.$('_type', Label).color = color;
            js.$('_multiplier', Label).color = color;
            js.$('_seat', Label).color = color;
            js.$('_score', Label).color = color;
        })
    }

    private resetView(): void {
        this.$('_total', Label).string = '';
        this.$('_list').children.forEach(v => v.active = false);
    }
}