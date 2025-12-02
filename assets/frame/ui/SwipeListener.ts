import { CCBoolean, Component, EventTouch, Node, ScrollView, UITransform, Vec2, _decorator, math } from 'cc';
import SwitchTab from '../component/SwitchTab';
import ToggleGroup from '../component/ToggleGroup';
const { ccclass, property } = _decorator;

@ccclass
export class SwipeListener extends Component {
    @property({ type: CCBoolean, tooltip: '左右滑动自动切换标签' }) autoSwitch: boolean;
    @property({ type: CCBoolean, tooltip: '阻止ScrollView滑动', visible: function () { return this.autoSwitch } }) cancelScrollView: boolean;
    @property({ type: ScrollView, tooltip: '', visible: function () { return this.autoSwitch && this.cancelScrollView } }) scrollView: ScrollView;

    @property({ type: SwitchTab, tooltip: '标签组件类型SwitchTab', visible: function () { return this.autoSwitch && !this.toggleGroup } }) switchTab: SwitchTab;
    @property({ type: ToggleGroup, tooltip: '标签组件类型ToggleGroup', visible: function () { return this.autoSwitch && !this.switchTab } }) toggleGroup: ToggleGroup;

    private startTouchPosition: Vec2 = new Vec2();
    private endTouchPosition: Vec2 = new Vec2();
    private swipeThreshold: number = 100; // 滑动阈值
    private boundingBoxs: math.Rect[] = [];// 排除节点的边界框

    private startTouchX: number = 0;
    private startTouchY: number = 0;
    private isHorizontalSwipe: boolean;

    protected onLoad(): void {
        if (this.autoSwitch) {
            this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
            this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
            this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
            this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
        }
    }

    protected onDestroy(): void {
        if (this.autoSwitch) {
            this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
            this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
            this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
            this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
        }
    }

    private onTouchStart(event: EventTouch): void {
        this.startTouchPosition = event.getUILocation();
        // 记录触摸开始时的坐标
        this.startTouchX = event.getLocationX();
        this.startTouchY = event.getLocationY();
    }

    private onTouchMove(event: EventTouch): void {
        if (!this.scrollView) { // 移动只针对有scrollView组件时
            return;
        }
        if (this.isHorizontalSwipe !== undefined) {
            return;
        }
        const currentTouchX = event.getLocationX();
        const currentTouchY = event.getLocationY();

        const deltaX = currentTouchX - this.startTouchX;
        const deltaY = currentTouchY - this.startTouchY;

        // 判断滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            this.isHorizontalSwipe = true; // 横向滑动
            if (this.scrollView) {
                this.scrollView.vertical = false;
            }
        } else {
            this.isHorizontalSwipe = false; // 纵向滑动
        }
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.autoSwitch) {
            return;
        }
        this.endTouchPosition = event.getUILocation();
        this.unschedule(this.toSwipe);

        if (this.scrollView) {
            if (this.isHorizontalSwipe === true) {
                this.handleSwipe();
            }
            this.scrollView.vertical = true;
            this.isHorizontalSwipe = undefined;
        } else {
            this.handleSwipe();
        }
    }

    // 排除节点 在此节点上滑动不触发事件
    protected excludeNode(nodes: Node[]): void {
        this.boundingBoxs.length = 0;
        nodes?.forEach(n => {
            const rect = n.getComponent(UITransform).getBoundingBoxToWorld(); // 获取节点的边界框
            this.boundingBoxs.push(rect);
        })
    }

    private handleSwipe() {
        const deltaX = this.endTouchPosition.x - this.startTouchPosition.x;

        if (Math.abs(deltaX) > this.swipeThreshold) {
            // 检查触摸位置是否在排除节点的边界内 
            for (let i = 0; i < this.boundingBoxs.length; i++) {
                const element = this.boundingBoxs[i];
                if (element.contains(this.startTouchPosition)) {
                    // 在排除节点的边界内，不派发自定义事件
                    return;
                }
            }
            // 是自定义滑动事件
            this.scheduleOnce(this.toSwipe.bind(this, deltaX));
        }
    }

    private toSwipe(deltaX: number): void {
        if (deltaX > 0) {
            this.switchTab?.onSwipeRight();
            this.toggleGroup?.onSwipeRight();
            this.onSwipeRight();
        } else {
            this.switchTab?.onSwipeLeft();
            this.toggleGroup?.onSwipeLeft();
            this.onSwipeLeft();
        }
    }

    // 子类继承以具体实现
    protected onSwipeRight() { }

    // 子类继承以具体实现
    protected onSwipeLeft() { }
}