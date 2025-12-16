import { IPlatformApi, OrderInfo, PlatformFeature, PlatformResponse, ShareInfo } from "../PlatformApi";

export class WebPlatformImpl implements IPlatformApi {
    private static readonly PLATFORM_NAME = 'WebPlatform';

    isFeatureSupported(feature: PlatformFeature): boolean {
        return; // throw new Error("Method not implemented.");
    }
    login(): Promise<PlatformResponse<{ token: string; userId: string; }>> {
        return; // throw new Error("Method not implemented.");
    }
    pay(orderInfo: OrderInfo): Promise<PlatformResponse<{ transactionId?: string; }>> {
        return; // throw new Error("Method not implemented.");
    }
    share(shareInfo: ShareInfo): Promise<PlatformResponse> {
        return; // throw new Error("Method not implemented.");
    }
    exitApp(): void { // throw new Error("Method not implemented.");
        return; // throw new Error("Method not implemented.");
    }
    closeSplash(): void {
        return; // throw new Error("Method not implemented.");
    }
    copyStr(str: string): Promise<PlatformResponse<{ content: string; }>> {
        return; // throw new Error("Method not implemented.");
    }

}