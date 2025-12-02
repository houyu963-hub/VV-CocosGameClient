import { _decorator, Label, sp, tween, Tween, v3 } from 'cc';
import ActiveSprite from 'db://assets/frame/component/ActiveSprite';
import BaseClass from 'db://assets/frame/ui/BaseClass';
import { Battle } from 'db://assets/resources/pbjs';
const { ccclass, property } = _decorator;

/**
 * 玩家信息
 */
@ccclass
export class MahjongPlayer extends BaseClass {
    private _data: Enum.IPlayerInfo;
    public score: number; // 分数

    // 设置玩家数据
    public setPlayerData(data: Enum.IPlayerInfo, player?: Battle.IPlayerInfo): void {
        this._data = data;
        // vv.utils.loadAvatarSprite(data.head_url, this.$('_avatar', Sprite));
        this.$('_nickName', Label).string = data.RoleName;
        this.updateScore(data.Gold);
        if (player) {
            this.$('_color').active = true;
            this.$('_color', ActiveSprite).index = player.LackColor;
            this.$('_banker').active = player.IsBanker;
        }
    }

    // 更新分数
    public updateScore(score: number): void {
        this.score = score;
        this.$('_score', Label).string = score.toString();
    }

    // 显示定的缺
    public showDingque(color: number): void {
        this.$('_color').active = true;
        this.$('_color', ActiveSprite).index = color;
    }

    // 播放庄家动画
    public showBanker(): void {
        this.$('_banker').active = true;
        let ske = this.$('_ske_banker', sp.Skeleton);
        ske.node.active = true;
        ske.setAnimation(0, 'feizhuang', false);
    }

    // 显示等待光圈
    public showWait(boo: boolean): void {
        let ske = this.$('_ske_touxiangjishu', sp.Skeleton);
        if (boo) {
            ske.node.active = true;
            ske.setAnimation(0, 'touxiangjishi1', true);
        } else {
            ske.node.active = false;
        }
    }

    // 显示及时结算分
    public showScore(data: number): void {
        let isWin = data >= 0;
        let node = isWin ? this.$('_score_win') : this.$('_score_lose');
        Tween.stopAllByTarget(node);
        node.active = true;
        node.getComponent(Label).string = isWin ? `+${data}` : data.toString();
        tween(node)
            .to(0.5, { position: v3(0, 20, 0) })
            .delay(2)
            .set({ active: false })
            .call(() => { node.setPosition(v3(0, -40, 0)); })
            .start()
    }

    // 显示已准备
    public setReady(value: boolean): void {
        this.$('_ready').active = value;
    }

    // 显示已托管
    public showAutoPlay(value: boolean): void {
        this.$('_autoPlay').active = value;
    }

    // 播放快捷语
    public showQuickTalk(data: string): void {
        this.$('_text', Label).string = data.split('&&')[0];
        let node = this.$('_textNode');
        node.active = true;
        Tween.stopAllByTarget(node);
        tween(node)
            .delay(3)
            .set({ active: false })
            .start()
    }

    // 播放表情
    public showFace(data: string): void {
        let ske = this.$('_ske_emoji', sp.Skeleton);
        this.playSpineAnimation(ske, data);
    }

    // 播放spine动画
    private playSpineAnimation(ske: sp.Skeleton, animationName: string): void {
        ske.node.active = true;
        ske.setAnimation(0, animationName, false);
        ske.setCompleteListener(() => {
            ske.node.active = false;
            ske.setCompleteListener(null);
        })
    }

    // 重置view
    public resetView(): void {
        this.$('_color').active = false;
        this.$('_banker').active = false;
        this.$('_ske_touxiangjishu').active = false;
        this.$('_textNode').active = false;
        this.$('_ske_emoji').active = false;
        this.$('_score_win').active = false;
        this.$('_score_lose').active = false;
        this.$('_score_win').setPosition(v3(0, -40, 0));
        this.$('_score_lose').setPosition(v3(0, -40, 0));
        this.$('_ready').active = false;
        this.$('_autoPlay').active = false;
    }

    // 清理view
    public clearView(): void {
        this.resetView();
        this.$('_nickName', Label).string = '';
        this.$('_score', Label).string = '';
        this.node.active = false;
        this._data = null;
        this.score = null;
    }
}