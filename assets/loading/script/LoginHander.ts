import vv from "../../frame/Core";

export default class LoginHander {

    private loginIds: number[] = [];
    private login_platform: number = 0
    private last_login_platform: number = -1
    public static readonly KeyLastLoginPlatform = "KeyLastLoginPlatform"
    public static readonly KeyTicket = "KeyTicket"
    public static readonly KeyCustomAccount = "KeyCustomAccount"

    constructor() {
        vv.event.on(vv.eventType.gameShow, this.autoLogin, this);
        vv.event.on(vv.eventType.autoLogin, this.autoLogin, this);
        vv.event.on(vv.eventType.onNetworkChange, this.onNetworkChange, this);
    }

    private static _instance: LoginHander = null;

    public static get instance(): LoginHander {
        return LoginHander._instance ?? (LoginHander._instance = new LoginHander);
    }

    // @param data.networkType  0无可用网络 1WIFI 2移动数据
    private onNetworkChange(data: { networkType: string }): void {
        if (Number(data.networkType) > 0) {
            if (!vv.network.isGameConnected) {
                // 清除之前的重连登陆计时器
                this.loginIds.forEach(id => {
                    if (id) {
                        clearTimeout(id);
                        id = null;
                    }
                })
                this.loginIds.length = 0;
                // 重连登陆
                let id = setTimeout(() => {
                    this.autoLogin();
                }, 100);
                this.loginIds.push(id);
            }
        }
    }

    /**
     * 自动登陆
     */
    public async autoLogin(): Promise<boolean> {
        return new Promise<boolean>(resolve => {
        })
    }

    /**
     * 请求登陆
     * @param data account:用户id ticket:签名
     * @returns 
     */
    public async login(data: { login_platform: number, account: string, ticket: string }): Promise<boolean> {
        return new Promise<boolean>(resolve => { })
    }

}