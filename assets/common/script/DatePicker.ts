import { CCInteger, Component, Node, ScrollView, UIOpacity, UITransform, _decorator } from 'cc';
import { SuperLayout } from '../../frame/component/SuperLayout';
import { DatePickerItem } from './DatePickerItem';
const { ccclass, property } = _decorator;

/**
 * 日期选择器
 */
@ccclass
export class DatePicker extends Component {
    @property(ScrollView) yearScrollView: ScrollView = null;
    @property(ScrollView) monthScrollView: ScrollView = null;
    @property(ScrollView) dayScrollView: ScrollView = null;

    @property({ type: CCInteger, tooltip: '相对view的参照点y坐标,越远离此点越透明' }) centralAxisPos: number = 0;

    private currentYear: number = new Date().getFullYear();
    private currentMonth: number = new Date().getMonth() + 1;
    private currentDay: number = new Date().getDate();

    private years: number[] = [];
    private months: string[] = [];
    private days: number[] = [];

    private lastScrollPos: number = 0;
    private lastScrollTime: number = 0;

    protected start(): void {
        this.populateYears();
        this.populateMonths();
        this.populateDays();

        this.yearScrollView.node.on('scrolling', this.onScrolling.bind(this, this.yearScrollView));
        this.monthScrollView.node.on('scrolling', this.onScrolling.bind(this, this.monthScrollView));
        this.dayScrollView.node.on('scrolling', this.onScrolling.bind(this, this.dayScrollView));

        this.choiceToday();
    }

    private populateYears(): void {
        this.years.length = 0;
        for (let i = this.currentYear - 10; i <= this.currentYear + 10; i++) {
            this.years.push(i);
        }
        this.yearScrollView.content.getComponent(SuperLayout).total(this.years.length);
    }

    private populateMonths(): void {
        for (let i = 1; i <= 12; i++) {
            let strm: string = i + '';
            if (i < 10) {
                strm = '0' + i;
            }
            this.months.push(strm);
        }
        this.monthScrollView.content.getComponent(SuperLayout).total(this.months.length);
    }

    private populateDays(): void {
        const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
        for (let i = 1; i <= daysInMonth; i++) {
            this.days.push(i);
        }
        this.dayScrollView.content.getComponent(SuperLayout).total(this.days.length);
    }

    private getDaysInMonth(year: number, month: number): number {
        return new Date(year, month, 0).getDate();
    }

    public choiceToday(): void {
        let date: Date = new Date();
        let y: number = date.getFullYear();
        let m: number = date.getMonth() + 1;
        let d: number = date.getDate();
        let y_index: number = this.years.indexOf(y);
        let strm: string = m + '';
        if (m < 10) {
            strm = '0' + m;
        }
        let m_index: number = this.months.indexOf(strm);
        let d_index: number = this.days.indexOf(d);
        this.yearScrollView.content.getComponent(SuperLayout).scrollToIndex(y_index, 0.001);
        this.monthScrollView.content.getComponent(SuperLayout).scrollToIndex(m_index, 0.001);
        this.dayScrollView.content.getComponent(SuperLayout).scrollToIndex(d_index, 0.001);
    }

    private onRefreshEventYY(item: Node, index: number) {
        item.getComponent(DatePickerItem).updata({ value: this.years[index], index: index });
    }

    private onRefreshEventMM(item: Node, index: number) {
        item.getComponent(DatePickerItem).updata({ value: this.months[index], index: index });
    }

    private onRefreshEventDD(item: Node, index: number) {
        item.getComponent(DatePickerItem).updata({ value: this.days[index], index: index });
    }

    private onScrolling(scrollView: ScrollView): void {
        this.calculateOopacity(scrollView);
    }

    // 计算节点透明度
    private calculateOopacity(scrollView: ScrollView): void {
        const content = scrollView.content;
        const children = content.children;
        children.forEach(child => {
            const childPos = child.parent.getComponent(UITransform).convertToWorldSpaceAR(child.getPosition());
            const viewPos = scrollView.view.convertToNodeSpaceAR(childPos);
            const childDistance = Math.abs(viewPos.y - this.centralAxisPos);
            // 根据距离计算透明度（示例：距离越近透明度越高）
            const maxDistance = 160; // 设置最大影响距离
            let opacity = 1 - (childDistance / maxDistance); // 计算透明度
            opacity = Math.max(0, Math.min(1, opacity)); // 限制透明度在 0 到 1 之间

            // 设置文本的透明度
            let uiOpacity = child.getComponent(UIOpacity);
            if (!uiOpacity) {
                uiOpacity = child.addComponent(UIOpacity);
            }
            uiOpacity.opacity = opacity * 155;
        })
    }

    // 计算速度
    private calculateScrolSpeed(scrollView: ScrollView): number {
        let speed: number = 0;
        const currentScrollPos = scrollView.getScrollOffset().y;
        const currentTime = Date.now();

        if (this.lastScrollTime !== 0) {
            const distance = Math.abs(this.lastScrollPos - currentScrollPos); // 计算移动距离
            const timeElapsed = currentTime - this.lastScrollTime; // 计算时间差

            speed = distance / timeElapsed; // 计算速度（单位：像素/毫秒）
            // console.log(`滚动速度: ${speed}`); // 输出速度
        }

        // 更新上一个位置和时间
        this.lastScrollPos = currentScrollPos;
        this.lastScrollTime = currentTime;

        return speed;
    }

    // 获取内容
    private findCentralAxisData(scrollView: ScrollView): { value: any, index: number } {
        const content = scrollView.content;
        const children = content.children;
        let minimum: number = Infinity;
        let data: { value: any, index: number };
        children.forEach((child, i) => {
            const childPos = child.parent.getComponent(UITransform).convertToWorldSpaceAR(child.getPosition());
            const viewPos = scrollView.view.convertToNodeSpaceAR(childPos);
            const childDistance = Math.abs(viewPos.y - this.centralAxisPos);
            if (childDistance < minimum) {
                minimum = childDistance;
                data = child.getComponent(DatePickerItem).data;
            }
        })
        return data;
    }

    // 获取距离中线最近的索引
    public getCentralAxisData(): number[] {
        this.yearScrollView.stopAutoScroll();
        this.monthScrollView.stopAutoScroll();
        this.dayScrollView.stopAutoScroll();
        let data_y = this.findCentralAxisData(this.yearScrollView);
        let data_m = this.findCentralAxisData(this.monthScrollView);
        let data_d = this.findCentralAxisData(this.dayScrollView);
        this.yearScrollView.content.getComponent(SuperLayout).scrollToIndex(data_y.index, 0);
        this.monthScrollView.content.getComponent(SuperLayout).scrollToIndex(data_m.index, 0);
        this.dayScrollView.content.getComponent(SuperLayout).scrollToIndex(data_d.index, 0);
        return [data_y.value, data_m.value, data_d.value];
    }
}