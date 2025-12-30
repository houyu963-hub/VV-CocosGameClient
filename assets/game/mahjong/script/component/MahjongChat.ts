import { _decorator, instantiate, Label, Node, Sprite, SpriteFrame } from 'cc';
import List from 'db://assets/frame/component/List';
import { Bundle_name } from 'db://assets/frame/config/Define';
import vv from 'db://assets/frame/Core';
import BaseClass from 'db://assets/frame/ui/BaseClass';
import PopupBase from 'db://assets/frame/ui/PopupBase';
import { Battle } from 'db://assets/resources/pbjs';

const Phrases = [ // 快捷语
    '快点吧，我等到花儿都谢了！&&phrase_1',
    '你的牌打的太好了&&phrase_2',
    '还让不让我摸牌了！&&phrase_3',
    '打一个来碰噻&&phrase_4',
    '你这样以后没朋友&&phrase_5',
    '哎呀，一不小心就胡了&&phrase_6',
];
const { ccclass } = _decorator;

@ccclass
export class MahjongChat extends PopupBase<void> {

    protected async onLoad(): Promise<void> {
        // 初始化快捷语
        this.$('_phrasesList', List).setList(Phrases, (js, da, index, node) => {
            js.$('_text', Label).string = da.split('&&')[0];
        })
        // 初始化表情
        let parent = this.$('_emojiList');
        let node = this.$('_btEmoji');

        for (let i = 0; i < 30; i++) {
            let data = await vv.asset.loadRes(`png/emoji/chat_face_${i}/spriteFrame`, SpriteFrame, undefined, Bundle_name.Common);
            let item = instantiate(node);
            item.active = true;
            let ts = item.getComponent(BaseClass);
            ts.$('_emojiSprite', Sprite).spriteFrame = data;
            parent.addChild(item);
            ts.saveData(data.name);
        }
    }

    private _onBtText(evt: TouchEvent): void {
        let node = evt.target as unknown as Node;
        let data = this.getCustomData(node);
        let param: Battle.IReqSendQuickMessage = {
            Type: vv.pb.Enum.QuickMessageType.QUICK_MESSAGE_TEXT,
            Content: data,
        }
        this.reqSendQuickMessage(param);
        this.close();
    }

    private _onBtEmoji(evt: TouchEvent): void {
        let node = evt.target as unknown as Node;
        let data = this.getCustomData(node);
        let param: Battle.IReqSendQuickMessage = {
            Type: vv.pb.Enum.QuickMessageType.QUICK_MESSAGE_EMOJI,
            Content: data,
        }
        this.reqSendQuickMessage(param);
        this.close();
    }

    // 发送快捷语/表情请求
    public reqSendQuickMessage(param: Battle.IReqSendQuickMessage, callback?: (success: boolean) => void): void {
        vv.network.send('Battle.ReqSendQuickMessage', 'Battle.RspSendQuickMessage', param, (res: Battle.IRspSendQuickMessage) => {
            if (res.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToast(res.Message);
                callback?.(false);
                return;
            }
            callback?.(true);
        })
    }
}