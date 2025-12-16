import { Color, Component, Graphics, UITransform, _decorator } from "cc";

const { ccclass } = _decorator;
@ccclass
export default class UIQRCode extends Component {

    public url(url: string): void {
        // 注意 最好把qrImage与qrcode的节点长宽设置为2的倍数。不然可能会出现无法识别二维码

        let ctx = this.node.getComponent(Graphics);
        if (!ctx) {
            ctx = this.node.addComponent(Graphics); // 添加绘画组件
        }
        if (typeof (url) !== 'string') {
            console.log('url is not string', url);
            return;
        }
        this.QRCreate(ctx, url);
    }

    private QRCreate(ctx: Graphics, url: string): void {
        let qrcode = new window["QRCode"](-1, 1);
        qrcode.addData(url);
        qrcode.make();

        ctx.fillColor = Color.BLACK;
        //块宽高
        let tileW = this.node.getComponent(UITransform).width / qrcode.getModuleCount();
        let tileH = this.node.getComponent(UITransform).height / qrcode.getModuleCount();

        // draw in the Graphics
        for (let row = 0; row < qrcode.getModuleCount(); row++) {
            for (let col = 0; col < qrcode.getModuleCount(); col++) {
                if (qrcode.isDark(row, col)) {
                    // ctx.fillColor = cc.Color.BLACK;
                    let w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
                    let h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
                    ctx.rect(Math.round(col * tileW), Math.round(row * tileH), w, h);
                    ctx.fill();
                }
            }
        }
    }
}