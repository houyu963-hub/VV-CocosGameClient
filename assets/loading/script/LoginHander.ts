import { sys } from "cc";
import { Config, Scene_name } from "../../frame/config/Config";
import { LoginPlatform, Platform } from "../../frame/config/Define";
import vv from "../../frame/Core";
import Thirdparty from "../../frame/system/Thirdparty";
import SceneNavigator from "../../frame/ui/SceneNavigator";
import { PreLobby } from "../../resources/pbjs";
import { AuthRequest, AuthResponse } from "./AuthClientWithSignature";

export default class LoginHander {

    private loginIds: NodeJS.Timeout[] = [];
    private login_platform: number = 0
    private last_login_platform: number = -1
    public static readonly KeyLastLoginPlatform = "KeyLastLoginPlatform"
    public static readonly KeyTicket = "KeyTicket"
    public static readonly KeyCustomAccount = "KeyCustomAccount"

    constructor() {
        vv.event.on(vv.eventType.gameShow, this.autoLogin, this);
        vv.event.on(vv.eventType.autoLogin, this.autoLogin, this);
        vv.event.on(vv.eventType.onNetworkChange, this.onNetworkChange, this);

        let value = sys.localStorage.getItem(LoginHander.KeyLastLoginPlatform) || ""
        if (value != "") {
            let valueInt = parseInt(value)
            if (!isNaN(valueInt)) {
                this.last_login_platform = valueInt
            }
        }
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
            // 账号
            let account: string
            // 签名
            let ticket: string
            // 上次登录记录
            let lastLoginMode = this.login_platform

            if (-1 == this.last_login_platform) {
                SceneNavigator.go(Scene_name.Login);
                resolve(false)
                return
            }
            switch (Config.platform) {
                case Platform.Android:
                case Platform.IOS:
                case Platform.Wechat:
                    ticket = sys.localStorage.getItem(LoginHander.KeyTicket);
                    break
                case Platform.Web:
                    account = Thirdparty.browser_params?.account; // 从地址栏获取用户id
                    break
            }
            switch (lastLoginMode) {
                case LoginPlatform.Dev:
                    if (null == account || "" == account) {
                        account = sys.localStorage.getItem(LoginHander.KeyCustomAccount);
                    }
                    break
                // 微信平台没有ticket就返回登录
                case LoginPlatform.WechatApp:
                case LoginPlatform.Wechat:
                    if (null == ticket || "" == ticket) {
                        SceneNavigator.go(Scene_name.Login);
                        resolve(false)
                        return
                    }
                    break
            }
            this.toAutoLogin({ login_platform: lastLoginMode, account: account, ticket: ticket, resolve: resolve });
        })
    }

    public toWechatLogin = () => {
        const wx = window['wx']
        vv.logger.log("wechat login")
        let self = this
        vv.logger.log("lixinpengrrr --> toWechatLogin")
        wx.login({
            success(res) {
                vv.logger.log("login success:" + JSON.stringify(res))
                // login success:{"errMsg":"login:ok","code":"0d3yitll2KADKg4mSGnl2yHLof1yitlH"}
                vv.logger.log("login errMsg = " + res.errMsg)
                if (res.errMsg == "login:ok") {
                    vv.logger.log("login toAutoLogin.")
                    self.toAutoLogin({
                        login_platform: LoginPlatform.Wechat, account: "", ticket: res.code
                    })
                }
                else {
                    vv.logger.log("login toAutoLogin failed.")
                }
            },
            fail(err) {
                vv.logger.error("login fail:" + err)
            },
            complete(e) {
                vv.logger.log("login complete:" + e)
            }
        })
    }
    /**
     * 自动登陆
     * @param data account:用户id ticket:签名
     * @returns 
     */
    private toAutoLogin(data: { login_platform: number, account: string, ticket: string, resolve?: (value: boolean | PromiseLike<boolean>) => void }): void {
        if (!data.account && !data.ticket) {
            data.resolve?.(false);
            SceneNavigator.go(Scene_name.Login);
            return
        }
        vv.logger.log("LoginHandler --> toAutoLogin")
        this.login({ login_platform: data.login_platform, account: data.account, ticket: data.ticket }).then((res) => {
            data.resolve?.(res);
            vv.logger.log(`LoginHandler --> result --> ${JSON.stringify(res)}`)
            if (res) {
                let userData = vv.user.userData;
                let roomInfo = userData.RoomInfo;
                roomInfo['PlayerVote'] = userData.PlayerVote; // 服务端返回的玩家投票数据 应放在 RoomInfo 中却没有放在 RoomInfo 中 这里自行组装下
                if (roomInfo && JSON.stringify(roomInfo) !== '{}') { // 进入游戏房间
                    import('../../common/script/RoomModel') // 优先级Loading包在Common包前 动态引入避免运行跨bundle错误 
                        .then((module) => {
                            const model = module.default.instance;
                            model.enterGameRoom(roomInfo);
                        })
                } else {
                    SceneNavigator.go(Scene_name.Hall);
                }
            } else {
                SceneNavigator.go(Scene_name.Login);
            }
        })
    }

    /**
     * 请求登陆
     * @param data account:用户id ticket:签名
     * @returns 
     */
    public async login(data: { login_platform: number, account: string, ticket: string }): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            // 认证
            this.authPlayer({ login_platform: data.login_platform, account: data.account, ticket: data.ticket }).then((auth_res) => {
                if (!auth_res) {
                    resolve(false);
                    return;
                }
                // 连接服务器
                let server_host = auth_res.AccessPointInfo.APList[0].APAddress
                if (!server_host.startsWith("ws")) {
                    server_host = "ws://" + server_host
                }
                vv.network.connectServer(server_host, (succ: boolean) => {
                    if (!succ) {
                        vv.utils.removeWaiting();
                        vv.utils.showToast('连接服务器失败，请检查网络后重试!');
                        resolve(false);
                        return;
                    }
                    // 请求登陆
                    let param: PreLobby.IReqLogin = {
                        PlatformID: vv.pb.Enum.EPlatformType.PLATFORM_NONE,
                        AccountID: data.account,
                        AuthSecret: auth_res.SecretKey
                    }
                    vv.network.send('PreLobby.ReqLogin', 'PreLobby.RspLogin', param, (res: PreLobby.IRspLogin) => {
                        let getRoleBaseData = () => { // 获取玩家基础数据
                            this.reqGetRoleBaseData(undefined, (data: PreLobby.IRspGetRoleBaseData) => {
                                if (!data) {
                                    resolve(false);
                                    return;
                                }
                                resolve(true);
                            })
                        }
                        if (res.ErrorCode === vv.pb.Enum.EErrorCode.Succeed && !res.RoleUID) {
                            // 创建角色
                            let createRoleParam: PreLobby.IReqCreateRole = {
                                PlatformType: vv.pb.Enum.EPlatformType.PLATFORM_NONE,
                                RoleName: data.account,
                            }
                            vv.network.send('PreLobby.ReqCreateRole', 'PreLobby.RspCreateRole', createRoleParam, (res: PreLobby.IRspCreateRole) => {
                                getRoleBaseData();
                            })
                            return;
                        } else {
                            getRoleBaseData();
                        }
                    })
                })
            })
        })
    }

    /**
     * 认证
     * @param data account:用户id ticket:签名
     * @returns 
     */
    private async authPlayer(data: { login_platform: number, account: string, ticket: string }): Promise<AuthResponse> {
        this.login_platform = this.login_platform
        // 无签名验证
        let param: AuthRequest = {
            userid: data.account,
            ticket: data.ticket,
            platform: data.login_platform,
            version: "1.0.0",
        }
        let res = await vv.http.post('/auth_player', param);
        if (!res) {
            return null;
        }
        let obj = JSON.parse(res);
        if (obj.ErrorCode !== 0) {
            vv.utils.showToast(obj.ErrorDesc);
            return null;
        }
        // 保存鉴权密钥
        sys.localStorage.setItem(LoginHander.KeyTicket, obj.SecretKey);
        return obj;
        // 带签名验证
        // let headers = AuthClientWithSignature.instance.getAuthPlayerWithSignature(param);
        // let res = await vv.http.post('/auth_player', param, headers);
    }

    /**
     * 请求用户数据
     * @param param 
     * @param callback 
     */
    private reqGetRoleBaseData(param: PreLobby.IReqGetRoleBaseData, callback: (data: PreLobby.IRspGetRoleBaseData) => void): void {
        vv.network.send('PreLobby.ReqGetRoleBaseData', 'PreLobby.RspGetRoleBaseData', param, (data: PreLobby.IRspGetRoleBaseData) => {
            if (data.ErrorCode !== vv.pb.Enum.EErrorCode.Succeed) {
                vv.utils.showToastErrCode(data.ErrorCode);
                callback?.(null);
            }
            vv.memmory.isCanSendMessage = true;
            vv.user.userData = data;
            vv.event.emit(vv.eventType.onConnected);
            callback?.(data);
        })
    }
}