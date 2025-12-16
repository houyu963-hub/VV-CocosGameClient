
import { Camera, Component, ImageAsset, Label, Node, RenderTexture, Size, Sprite, SpriteFrame, Texture2D, UITransform, _decorator, assetManager, error, log, native, sys, view } from 'cc';
import { Canvas2Image } from './Canvas2Image';
const { ccclass, property } = _decorator;

@ccclass('Screenshot2D')
export class Screenshot2D extends Component {

    public onSavedCallback: (filePath: string) => void; // 截图完成

    @property(Camera) copyCamera: Camera = null!;
    @property(Node) targetNode: Node = null!;
    @property(Node) copyNode: Node = null!;
    @property(Label) tips: Label = null!;

    private rt: RenderTexture = null;
    private _canvas: HTMLCanvasElement = null!;
    private _buffer: ArrayBufferView = null!;
    private canvas2image: Canvas2Image = null!;

    public saveImageToGallery(onSavedCallback: (filePath: string) => void): void {
        // 截图完成回调
        this.onSavedCallback = onSavedCallback;

        this.canvas2image = Canvas2Image.getInstance();
        this.rt = new RenderTexture();
        this.rt.reset({
            width: view.getVisibleSize().width,
            height: view.getVisibleSize().height,
        })
        this.copyCamera.targetTexture = this.rt;
        this.scheduleOnce(() => {
            this.capture();
            this.save();
        })
    }

    private capture(): void {
        this.copyRenderTex();
    }

    private copyRenderTex(): void {
        let width = this.targetNode.getComponent(UITransform).width;
        let height = this.targetNode.getComponent(UITransform).height;
        let worldPos = this.targetNode.getWorldPosition();
        // this._buffer = this.rt.readPixels(Math.round(worldPos.x), Math.round(worldPos.y), width, height);
        this._buffer = this.rt.readPixels(Math.round(worldPos.x - width / 2), Math.round(worldPos.y - height / 2), width, height);
        this.showImage(width, height);
    }

    private showImage(width: number, height: number) {
        let img = new ImageAsset();
        img.reset({
            _data: this._buffer,
            width: width,
            height: height,
            format: Texture2D.PixelFormat.RGBA8888,
            _compressed: false
        });
        let texture = new Texture2D();
        texture.image = img;
        let sf = new SpriteFrame();
        sf.texture = texture;
        sf.packable = false;
        this.copyNode!.getComponent(Sprite).spriteFrame = sf;
        this.copyNode!.getComponent(Sprite).spriteFrame.flipUVY = true;
        if (sys.isNative && (sys.os === sys.OS.IOS || sys.os === sys.OS.OSX)) {
            this.copyNode!.getComponent(Sprite).spriteFrame.flipUVY = false;
        }
        this.copyNode?.getComponent(UITransform)?.setContentSize(new Size(width, height));
        this.tips.string = `截图成功`;
    }

    private savaAsImage(width: number, height: number, arrayBuffer: ArrayBufferView): void {
        if (sys.isBrowser) {
            if (!this._canvas) {
                this._canvas = document.createElement('canvas');
                this._canvas.width = width;
                this._canvas.height = height;
            } else {
                this.clearCanvas();
            }
            let ctx = this._canvas.getContext('2d')!;
            let rowBytes = width * 4;
            for (let row = 0; row < height; row++) {
                let sRow = height - 1 - row;
                let imageData = ctx.createImageData(width, 1);
                let start = sRow * width * 4;
                for (let i = 0; i < rowBytes; i++) {
                    imageData.data[i] = arrayBuffer[start + i];
                }
                ctx.putImageData(imageData, 0, row);
            }
            //@ts-ignore
            this.canvas2image.saveAsPNG(this._canvas, width, height);
            this.tips.string = `保存图片成功`;
            this.onSavedCallback?.('');
        } else if (sys.isNative) {
            let filePath = native.fileUtils.getWritablePath() + 'render_to_sprite_image.png';
            //@ts-ignore
            if (jsb.saveImageData) {
                // andriod数据重新排序
                let rtBuffer = new Uint8Array(width * height * 4);
                for (var i = height - 1; i >= 0; i--) {
                    for (var j = 0; j < width; j++) {
                        rtBuffer[((height - 1 - i) * (width) + j) * 4 + 0] = this._buffer[(i * width + j) * 4 + 0];
                        rtBuffer[((height - 1 - i) * (width) + j) * 4 + 1] = this._buffer[(i * width + j) * 4 + 1];
                        rtBuffer[((height - 1 - i) * (width) + j) * 4 + 2] = this._buffer[(i * width + j) * 4 + 2];
                        rtBuffer[((height - 1 - i) * (width) + j) * 4 + 3] = this._buffer[(i * width + j) * 4 + 3];
                    }
                }
                this._buffer = rtBuffer;
                //@ts-ignore
                jsb.saveImageData(this._buffer, width, height, filePath).then(() => {
                    assetManager.loadRemote<ImageAsset>(filePath, (err, imageAsset) => {
                        if (err) {
                            console.log("show image error")
                        } else {
                            // 不需要展示
                            // let newNode = instantiate(this.showNode);
                            // newNode.setPosition(new Vec3(-newNode.position.x, newNode.position.y, newNode.position.z));
                            // this.showNode.parent.addChild(newNode);

                            // const spriteFrame = new SpriteFrame();
                            // const texture = new Texture2D();
                            // texture.image = imageAsset;
                            // spriteFrame.texture = texture;
                            // newNode.getComponent(Sprite).spriteFrame = spriteFrame;
                            // spriteFrame.packable = false;
                            // spriteFrame.flipUVY = true;
                            // if (sys.isNative && (sys.os === sys.OS.IOS || sys.os === sys.OS.OSX)) {
                            //     spriteFrame.flipUVY = false;
                            // }

                            this.tips.string = `成功保存在设备目录并加载成功: ${filePath}`;
                        }
                    });
                    log("save image data success, file: " + filePath);
                    this.tips.string = `成功保存在设备目录: ${filePath}`;
                    this.onSavedCallback?.(filePath);
                }).catch(() => {
                    error("save image data failed!");
                    this.tips.string = `保存图片失败`;
                });
            }
        } else if (sys.platform === sys.Platform.WECHAT_GAME) {
            if (!this._canvas) {
                //@ts-ignore
                this._canvas = wx.createCanvas();
                this._canvas.width = width;
                this._canvas.height = height;
            } else {
                this.clearCanvas();
            }
            let ctx = this._canvas.getContext('2d');

            let rowBytes = width * 4;

            for (let row = 0; row < height; row++) {
                let sRow = height - 1 - row;
                let imageData = ctx.createImageData(width, 1);
                let start = sRow * width * 4;

                for (let i = 0; i < rowBytes; i++) {
                    imageData.data[i] = arrayBuffer[start + i];
                }

                ctx.putImageData(imageData, 0, row);
            }
            //@ts-ignore
            this._canvas.toTempFilePath({
                x: 0,
                y: 0,
                width: this._canvas.width,
                height: this._canvas.height,
                destWidth: this._canvas.width,
                destHeight: this._canvas.height,
                fileType: "png",
                success: (res) => {
                    //@ts-ignore
                    wx.showToast({
                        title: "截图成功"
                    });
                    this.tips.string = `截图成功`;
                    //@ts-ignore
                    wx.saveImageToPhotosAlbum({
                        filePath: res.tempFilePath,
                        success: (res) => {
                            //@ts-ignore              
                            wx.showToast({
                                title: "成功保存到设备相册",
                            });
                            this.tips.string = `成功保存在设备目录: ${res.tempFilePath}`;
                        },
                        fail: () => {
                            this.tips.string = `保存图片失败`;
                        }
                    })
                },
                fail: () => {
                    //@ts-ignore
                    wx.showToast({
                        title: "截图失败"
                    });
                    this.tips.string = `截图失败`;
                }
            })
        }
        this.clearCanvas();
    }

    private clearCanvas(): void {
        if (this._canvas) {
            let ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
    }

    // 保存图片
    public save(): void {
        let width = this.targetNode.getComponent(UITransform).width;
        let height = this.targetNode.getComponent(UITransform).height;
        this.savaAsImage(width, height, this._buffer);
    }
}