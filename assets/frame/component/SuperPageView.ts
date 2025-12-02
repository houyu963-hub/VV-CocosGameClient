import { EventTouch, Node, PageView, UITransform, _decorator, v3 } from "cc";

const { ccclass, property, menu } = _decorator;
@ccclass('SuperPageView')
@menu('Custom/SuperPageView')
export default class SuperPageView extends PageView {
    @property({ tooltip: '是否开启自动滚动' }) auto: boolean = true;
    @property({ tooltip: '自动滚动延迟时间', visible() { return this.auto } }) scroll_delay: number = 4;

    private _allPages: Node[] = [];

    public onLoad(): void {
        super.onLoad();
        let copy: Node[] = [];
        this._pages.forEach(p => { copy.push(p) });
        this.removeAllPages();
        copy.forEach(p => { this.addPage(p) });
    }

    // overwrite
    public onEnable(): void {
        super.onEnable();
        this._pages.forEach((p, i) => { p.attr({ indicator_index: i }) });
        this._autoScroll();
        this.node.on('scrolling', this.hidePage, this);
    }

    // overwrite
    public onDisable(): void {
        super.onDisable();
        this._stopScroll();
        this.node.off('scrolling', this.hidePage, this);
    }

    // overwrite
    public addPage(page: Node): void {
        let node = this.pushEmptyNode(page);
        super.addPage(node);
        node.attr({ indicator_index: this._pages.length - 1 });
        this._allPages.push(page);
        this.hidePage();
    }

    // push 一个空的节点
    private pushEmptyNode(page: Node): Node {
        let node = new Node();
        let uiTransform = node.addComponent(UITransform);
        let uiTransform_page = page.getComponent(UITransform);
        uiTransform.width = uiTransform_page.width;
        uiTransform.height = uiTransform_page.height;
        return node;
    }

    // overwrite
    public get curPageIdx(): number {
        let curr_page = this._pages[this._curPageIdx];
        const idx = curr_page['indicator_index'] ?? 0;
        return idx;
    }

    // overwrite
    protected _onTouchMoved(event: EventTouch, captureListeners: any) {
        super._onTouchMoved(event, captureListeners);
        this._stopScroll();
        if (this._curPageIdx !== 0 && this._curPageIdx !== this._pages.length - 1) return;
        let item_node = this.content.children[this._curPageIdx];
        let delta_x = event.getDeltaX();
        if (delta_x < 0) {
            if (this._curPageIdx === this._pages.length - 1) {
                item_node.setSiblingIndex(0);
                this._changIndex(item_node, true);
                this.scrollToPage(0, 0);
            }
        } else if (delta_x > 0) {
            if (this._curPageIdx === 0) {
                item_node.setSiblingIndex(this._pages.length - 1);
                this._changIndex(item_node, false);
                this.scrollToPage(this._pages.length - 1, 0);
            }
        }
    }

    // overwrite
    protected _onTouchEnded(event: EventTouch, captureListeners: any) {
        super._onTouchEnded(event, captureListeners);
        this._autoScroll();
    }

    // overwrite
    protected _onTouchCancelled(event: EventTouch, captureListeners: any) {
        super._onTouchCancelled(event, captureListeners);
        this._autoScroll();
    }

    // overwrite
    public scrollToPage(idx: number, timeInSecond = 0.3): void {
        super.scrollToPage(idx, timeInSecond);
        this.hidePage();
    }

    // 降低drawcall
    private hidePage(): void {
        let curr_show_index = this.content.children.findIndex(page => { return page['indicator_index'] === this.curPageIdx });
        if (curr_show_index === -1) return;

        // 计算前一页和后一页的索引（循环）
        const total = this._pages.length;
        const prev_index = (curr_show_index - 1 + total) % total;
        const next_index = (curr_show_index + 1) % total;

        this._pages.forEach((p, i) => {
            if (i === curr_show_index) {
                p.addChild(this._allPages[this.curPageIdx]);
            } else if (i === prev_index) {
                // 前一页
                const prevPageIdx = (this.curPageIdx - 1 + this._allPages.length) % this._allPages.length;
                p.addChild(this._allPages[prevPageIdx]);
            } else if (i === next_index) {
                // 后一页
                const nextPageIdx = (this.curPageIdx + 1) % this._allPages.length;
                p.addChild(this._allPages[nextPageIdx]);
            } else {
                p.removeAllChildren();
            }
            if (p.children.length > 1) {
                debugger;
            }
            p.children[0]?.setPosition(v3(0, 0, 0));
        })
    }

    /**
     * 滚到上一个
     */
    public scrollToLast(): void {
        if (this._curPageIdx === 0) {
            let item_node = this.content.children[this._curPageIdx];
            item_node.setSiblingIndex(this._pages.length - 1);
            this._changIndex(item_node, false);
            this.scrollToPage(this._pages.length - 1, 0);
        }
        this.scrollToPage(this._curPageIdx - 1);
    }

    /**
     * 滚到下一个
     */
    public scrollToNext(): void {
        this._startScroll();
    }

    /**
     * 自动滚动
     */
    private _autoScroll(): void {
        if (this.auto) {
            // this.schedule(this._startScroll, this.scroll_delay);
        }
    }

    /**
     * 停止滚动
     */
    private _stopScroll(): void {
        this.unschedule(this._startScroll);
    }

    private _startScroll(): void {
        if (this._curPageIdx == this._pages.length - 1) {
            let item_node = this.content.children[this._curPageIdx];
            item_node.setSiblingIndex(0);
            this._changIndex(item_node, true);
            this.scrollToPage(0, 0);
            this.scrollToPage(1);
        } else {
            this.scrollToPage(this._curPageIdx + 1);
        }
    }

    private _changIndex(node: Node, unshift: boolean): void {
        let index = this._pages.findIndex(p => { return p['indicator_index'] === node['indicator_index'] })
        if (index !== -1) {
            this._pages.splice(index, 1);
            if (unshift) {
                this._pages.unshift(node);
            } else {
                this._pages.push(node);
            }
        }
    }
}