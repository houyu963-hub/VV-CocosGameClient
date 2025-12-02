import { Component, Label, Mask, Node, Tween, UITransform, _decorator, instantiate, tween, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NumberScroller')
export class NumberSlider extends Component {
    @property(Node)
    digitPrefab: Node = null; // 数字预制体

    @property(Node)
    container: Node = null; // 存放数字的容器

    private targetNumber: string = "000000000"; // 目标数字
    private lastTargetNumber: string = ""; // 上次滚动的目标数字 直接设置的不回记录
    private scrolling: boolean = false; // 是否正在滚动
    private isInit = false;

    private _Width: number; // 数字的宽的一半
    private _height: number; // 数字的高的一半

    start() {
        this.initializeDigits();
    }

    // 初始化数字显示
    initializeDigits() {
        this.isInit = true;
        this._Width = this.digitPrefab.getComponent(UITransform).width;
        this._height = this.digitPrefab.getComponent(UITransform).height;

        this.node.addComponent(Mask);
    }

    // 创建容器
    createContainer() {
        const numberCount = this.targetNumber.length;
        this.node.removeAllChildren();

        // 计算容器总宽度
        const totalWidth = numberCount * this.container.getComponent(UITransform).width;

        for (let index = 0; index < numberCount; index++) {
            let container = instantiate(this.container);
            this.node.addChild(container);

            let ui = this.container.getComponent(UITransform)
            // 计算每个容器的具体位置，使其在父节点中居中
            const xPosition = index * ui.width - totalWidth / 2 + ui.width / 2;
            container.setPosition(xPosition, 0, 0); // 设置容器位置

            // 向容器添加'.'和0~9的数字
            for (let i = -1; i <= 9; i++) {
                const digitNode = instantiate(this.digitPrefab);
                digitNode.parent = container;

                const label = digitNode.getComponent(Label);
                label.string = i == -1 ? "." : i.toString(); // 第一位初始数字为小数点 其他初始数字为0
                digitNode.setPosition(0, -(i + 1) * this._height, 0); // 设置每个数字的初始位置
            }
        }

        this.node.getComponent(UITransform).width = totalWidth;
    }

    /**
     * 开始滚动数字
     * @param newNumber 
     * @param isContinue 是否接着上次滚动
     */
    startScrolling(newNumber: number, isContinue = true) {
        this.targetNumber = newNumber.toString(); // 将目标数字转换为字符串
        if (!this.isInit) {
            this.initializeDigits();
        }
        if (!this.scrolling) {
            this.scrolling = true;
            this.createContainer();

            if (isContinue && this.lastTargetNumber) { // 接着上一次目标数字滚动
                this.setContainerPosition(this.lastTargetNumber);
            }
            // 开始滚动容器
            for (let index = 0; index < this.node.children.length; index++) {
                const element = this.node.children[index];
                this.scrollDigits(element, index);
            }
        }
    }

    // 逐位滚动容器
    scrollDigits(container: Node, containerIndex: number) {
        let digit = Number(this.targetNumber[containerIndex]);
        if (isNaN(digit)) {
            digit = 0;
        } else {
            digit += 1; // 因为有小数点
        }
        Tween.stopAllByTarget(container);
        tween(container)
            .to(0.5, { position: v3(container.position.x, digit * this._height) }, { easing: "quadInOut" })
            .call(() => {
                if (containerIndex === this.targetNumber.length - 1) {
                    this.scrolling = false; // 最后一个数字滚到结束
                    this.lastTargetNumber = this.targetNumber;
                }
            })
            .start();
    }

    // 直接设置数字
    setDigits(newNumber: number) {
        this.targetNumber = newNumber.toString(); // 将目标数字转换为字符串
        this.lastTargetNumber = this.targetNumber;
        if (!this.isInit) {
            this.initializeDigits();
        }
        this.createContainer();
        this.setContainerPosition(this.targetNumber);
    }

    // 设置每个容器的位置
    private setContainerPosition(newNumber: string) {
        const containers = this.node.children;
        for (let i = 0; i < containers.length; i++) {
            let digit = Number(newNumber[i]);
            if (isNaN(digit)) {
                digit = 0;
            } else {
                digit += 1; // 因为有小数点
            }
            let c = containers[i];
            c.setPosition(v3(c.position.x, digit * this._height));
        }
    }
}