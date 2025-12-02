import { Component, Label, Layout, Node, _decorator, instantiate } from 'cc';
import vv from 'db://assets/frame/Core';
const { ccclass, property } = _decorator;

@ccclass()
export class NumberScroller extends Component {
    @property(Node) digitPrefab: Node = null;     // 数字预制体
    @property(Node) container: Node = null;       // 存放数字的容器

    private targetNumber: string = '0.00';

    /**
     * 直接设置数字
     */
    public setNumber(data: { newNumber: string | number }): void {
        data.newNumber = data.newNumber + '';
        this.targetNumber = data.newNumber;
        this.initializeDigits(data.newNumber.length);
        for (let i = 0; i < this.container.children.length; i++) {
            const element = this.container.children[i];
            let label = element.getComponent(Label);
            label.string = this.targetNumber[i];
        }
    }

    /**
     * 开始滚动数字
     * @param newNumber 结果数字
     * @param maxLength 最大位数 不足时高位补零 默认newNumber的长度
     * @param delay 单个数字变化的时间间隔 越小变化得越快 默认0.01
     * @param defaultScroller 单个数字变化前 先默认变化几圈 一圈=0~9 默认3圈
     */
    public startScrolling(data: {
        newNumber: string | number,
        maxLength?: number,
        delay?: number,
        defaultScroller?: number,
        callback?: () => void
    }): void {
        data.newNumber = data.newNumber + '';
        if (this.targetNumber === data.newNumber) {
            data.callback?.();
            return;
        }
        data.maxLength ?? (data.maxLength = data.newNumber.length);
        data.delay ?? (data.delay = 0.01);
        data.defaultScroller ?? (data.defaultScroller = 3);
        this.initializeDigits(data.maxLength);
        this.targetNumber = data.newNumber.padStart(data.maxLength, '0');
        this.scrollDigits(data.delay, data.defaultScroller, data.callback);
    }

    // 初始化数字显示的位数
    private initializeDigits(maxLength: number = 11): void {
        for (let i = 0; i < maxLength; i++) {
            let node = this.container.children[i];
            if (!node) {
                node = instantiate(this.digitPrefab);
            }
            node.parent = this.container;
            node.active = true;
        }
        for (let i = maxLength; i < this.container.children.length; i++) {
            this.container.children[i].active = false;
        }
        this.container.getComponent(Layout).updateLayout();
    }

    // 逐位滚动数字
    public scrollDigits(delay: number, defaultScroller: number, callback?: () => void): void {
        const digits = this.container.children;

        for (let i = 0; i < digits.length; i++) {
            if (!this.container.children[i].active) {
                if (i === digits.length - 1) {
                    callback?.();
                }
                continue;
            }
            let label = digits[i].getComponent(Label);
            if (this.targetNumber[i] === '.') {
                label.string = '.';
                if (i === digits.length - 1) {
                    callback?.();
                }
                continue;
            }
            const targetDigit = this.targetNumber[i] || '0'; // 获取目标数字，默认 '0'
            vv.utils.textEffect({
                key: this.node.uuid + i,
                strLabel: label,
                beginNum: 0,
                endNum: Number(targetDigit),
                delay: delay,
                defaultScroller: defaultScroller ?? i,
                callback: () => {
                    if (i === digits.length - 1) {
                        callback?.();
                    }
                }
            })
        }
    }
}