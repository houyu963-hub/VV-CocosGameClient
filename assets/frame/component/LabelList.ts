import { _decorator, CCString, Component, Label, TextAsset } from "cc";
import vv from "../Core";
import List from "./List";

const { ccclass, property, requireComponent } = _decorator;

@ccclass
@requireComponent(Label)
@requireComponent(List)
export default class LabelList extends Component {
    @property({ type: CCString, displayName: '.txt文件路径' }) txtName: string;

    protected async onLoad(): Promise<void> {
        let label = this.getComponent(Label);
        let maxLength = label.string.length; // 获取Label的最大显示长度

        let res = await vv.asset.loadRes(this.txtName, TextAsset);
        let str = res.text;

        let lines: string[] = [];
        let paragraphs = str.split('\n'); // 按段落分割

        for (let paragraph of paragraphs) {
            let wrappedLines = this.wrapText(paragraph, maxLength);
            lines.push(...wrappedLines);
        }

        this.getComponent(List).setList(lines, (js, data) => {
            let label = js.getComponent(Label);
            label.string = data;
            // 居中判断逻辑
            let center = data.includes('center');
            if (center) {
                label.string = data.slice(6);
            }
            label.horizontalAlign = center ? Label.HorizontalAlign.CENTER : Label.HorizontalAlign.LEFT;
        });
    }

    // 行计算
    private wrapText(text: string, maxWidth: number): string[] {
        const chars = Array.from(text);
        let lines: string[] = [];
        let currentLine = '';
        let currentWidth = 0;

        for (let char of chars) {
            let charWidth = this.getCharacterDisplayWidth(char);

            if (currentWidth + charWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = char;
                currentWidth = charWidth;
            } else {
                currentLine += char;
                currentWidth += charWidth;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    private getCharacterDisplayWidth(char: string): number {
        // 宽度计算
        const code = char.charCodeAt(0);
        // 中文字符通常显示宽度为英文字母的2倍
        if (code > 127) {
            return 2;
        }
        return 1;
    }
}