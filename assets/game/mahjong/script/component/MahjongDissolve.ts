import { _decorator, Label } from "cc";
import ActiveNode from "db://assets/frame/component/ActiveNode";
import Timer from "db://assets/frame/component/Timer";
import vv from "db://assets/frame/Core";
import PopupBase from "db://assets/frame/ui/PopupBase";

export enum DissolvePopupType {
    Dissolve = 0,          // 提示确认解散
    OwnerDissolve = 1,     // 房主解散房间
    MemberExit = 2,        // 成员退出房间
    VoteOwnerDissolve = 3, // 表决房主解散房间
    VoteMemberExit = 4,    // 表决成员退出房间
}

const { ccclass } = _decorator;

@ccclass
export class MahjongDissolve extends PopupBase<{ type: DissolvePopupType, data: { playerName: string, leftTime: number }, callback: (confirm: boolean) => void }> {

    protected init(options: {
        type: DissolvePopupType,
        data: {
            playerName: string, // 玩家名称
            leftTime: number  // 剩余时间s
        },
        callback: (confirm: boolean) => void
    }): void {
        this.$('_type', ActiveNode).index = options.type;
        if (options.type === DissolvePopupType.VoteMemberExit) {
            // vv.utils.loadAvatarSprite(data.head_url, this.$('_avatar', Sprite));
            this.$('_name', Label).string = options.data.playerName;
            let timer = this.$('_timer_exit', Timer);
            this.startTime(timer);
        } else if (options.type === DissolvePopupType.VoteOwnerDissolve) {
            let timer = this.$('_timer_dissolve', Timer);
            this.startTime(timer);
        }
    }

    private startTime(timer: Timer): void {
        timer.startTimer(this.options.data.leftTime, () => {
            timer.node.getComponent(Label).string = '(00s)';
        }, (current: string) => {
            let num = Number(current);
            timer.node.getComponent(Label).string = `(${vv.utils.padNumberWithZeros(2, num)}s)`;
        })
    }

    private _onBtCancel(): void {
        this.options.callback(false);
        this.close();
    }

    private _onBtConfirm(): void {
        this.options.callback(true);
        this.close();
    }
}