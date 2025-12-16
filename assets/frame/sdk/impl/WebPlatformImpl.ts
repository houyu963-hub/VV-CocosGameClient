import vv from "../../Core";
import { IPlatformApi, OrderInfo, PlatformFeature, PlatformResponse, ShareInfo } from "../PlatformApi";

export class WebPlatformImpl implements IPlatformApi {
    private static readonly PLATFORM_NAME = 'WebPlatform';

    isFeatureSupported(feature: PlatformFeature): boolean {
        // throw new Error("Method not implemented.");
        return;
    }
    login(): Promise<PlatformResponse<{ token: string; userId: string; }>> {
        // throw new Error("Method not implemented.");
        return;
    }
    pay(orderInfo: OrderInfo): Promise<PlatformResponse<{ transactionId?: string; }>> {
        // throw new Error("Method not implemented.");
        return;
    }
    share(shareInfo: ShareInfo): Promise<PlatformResponse> {
        // throw new Error("Method not implemented.");
        return;
    }
    exitApp(): void {
        // throw new Error("Method not implemented.");
        return;
    }
    closeSplash(): void {
        // throw new Error("Method not implemented.");
        return;
    }
    copyStr(str: string): Promise<PlatformResponse<{ content: string; }>> {
        return new Promise(resolve => {
            let textarea = document.createElement('textarea');
            textarea.textContent = str;
            document.body.appendChild(textarea);
            textarea.readOnly = true;
            textarea.select();
            textarea.setSelectionRange(0, textarea.textContent.length);
            try {
                const flag = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (flag) {
                    vv.utils.showToast('复制成功');
                    resolve({ code: 'SUCCESS', message: '复制成功' })
                } else {
                    vv.utils.showToast('复制失败');
                    resolve({ code: 'FAILED', message: '复制失败' })
                }
            } catch (err) {
                vv.utils.showToast('复制失败');
                resolve({ code: 'FAILED', message: '复制失败' })
            }
        });
    }

}