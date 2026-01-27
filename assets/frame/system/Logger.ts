import { sys } from "cc";
import { ChannelConfig } from "../config/ChannelConfig";

export default class Logger {
    public log(args: any, color?: string): void {
        this.print('log', args, color);
    }

    public forceLog(args: any): void {
        console.log(args);
    }

    public warn(args: any): void {
        this.print('warn', args);
    }

    public error(args: any): void {
        this.print('error', args);
    }

    public time(args: any): void {
        this.print('time', args);
    }

    public timeEnd(args: any): void {
        this.print('timeEnd', args);
    }

    public logSend(args: any): void {
        this.print('logSend', args);
    }

    public logRecieve(args: any): void {
        this.print('logRecieve', args);
    }

    private print(level: string, args: any, color?: string): void {
        if (!ChannelConfig.debug) return;
        if (sys.isNative) {
            if (typeof (args) === 'object') {
                console.log(JSON.stringify(args));
            } else {
                console.log(args);
            }
        } else {
            if (level === 'logSend') {
                console.log(`%c=========================${args}=========================`, 'background:SaddleBrown;color:#ffffff');
            } else if (level === 'logRecieve') {
                console.log(`%c=========================${args}=========================`, 'background:DarkGreen;color:#ffffff');
            } else {
                if (color) {
                    console[level](`%c=========================${args}=========================`, `color:${color}`);
                } else {
                    console[level](args);
                }
            }
        }
    }
}
