import { Label, RichText, _decorator } from 'cc';
import PopupBase from 'db://assets/frame/ui/PopupBase';

export enum BTNSTYLE {
    ONLY_CONFIRM = 0,     // 仅确定
    ONLY_CLOSE = 1,       // 仅关闭
    CONFIRM_CLOSE = 2,    // 确定/关闭
    CANCEL_CONFIRM = 3,   // 取消/确定
    ALL = 4,              // 取消/确定/关闭
    HIDEALL = 5,          // 隐藏所有操作按钮(一般用于强制提示：系统维护)
}

export interface IDialogParam {
    title?: string,          // 标题
    content: string,         // 内容
    closeCb?: Function,      // 关闭cb
    confirmCb?: Function,    // 确定cb
    cancelCb?: Function,     // 取消cb
    cancelText?: string,     // 取消文字
    confirmText?: string,    // 确定文字
    btnStyle?: BTNSTYLE,     // 按钮样式
    confirmNoClose?: boolean,// 确后不关闭

    other?: any,
}
/**
 * 对话框
 */
const { ccclass } = _decorator;
@ccclass
export default class Dialog extends PopupBase<IDialogParam> {

    protected onDisable(): void {
        this.$('_title', Label).string = '提示';
        this.$('_text', RichText).string = '';
        this.$('_text_leftAlign', RichText).string = '';
        this.$('_cancelText', Label).string = '取消';
        this.$('_confirmText', Label).string = '确定';
    }

    protected init(options: IDialogParam): void {
        this.$('_btCancel').active = false;
        this.$('_btConfirm').active = false;
        this.$('_btClose').active = false;

        if (options.title) {
            this.$('_title', Label).string = options.title;
        }
        if (options.content) {
            if (options.other === 'server_maintain') { // 服务器维护
                this.$('_text_leftAlign', RichText).string = options.content;
            } else {
                this.$('_text', RichText).string = options.content;
            }
        }
        if (options.cancelText) {
            this.$('_cancelText', Label).string = options.cancelText;
        }
        if (options.confirmText) {
            this.$('_confirmText', Label).string = options.confirmText;
        }
        switch (options.btnStyle) {
            case BTNSTYLE.ONLY_CONFIRM:
                this.$('_btConfirm').active = true;
                break;
            case BTNSTYLE.ONLY_CLOSE:
                this.$('_btClose').active = true;
                break;
            case BTNSTYLE.CONFIRM_CLOSE:
                this.$('_btConfirm').active = true;
                this.$('_btClose').active = true;
                break;
            case BTNSTYLE.CANCEL_CONFIRM:
                this.$('_btCancel').active = true;
                this.$('_btConfirm').active = true;
                break;
            case BTNSTYLE.HIDEALL:
                break;
            case BTNSTYLE.ALL:
            default:
                this.$('_btCancel').active = true;
                this.$('_btConfirm').active = true;
                this.$('_btClose').active = true;
                break;
        }
    }

    protected _onBtClose(): void {
        super._onBtClose();
        this.options.cancelCb?.();
        this.options.closeCb?.();
    }

    protected _onBtConfirm(): void {
        if (!this.options.confirmNoClose) {
            super._onBtClose();
        }
        this.options.confirmCb?.();
    }

    protected _onBtCancel(): void {
        super._onBtClose();
        this.options.cancelCb?.();
    }

}

