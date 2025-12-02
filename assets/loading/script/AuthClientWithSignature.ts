import { GMd5 } from "../../frame/utils/Md5";

// 认证请求参数接口
export interface AuthRequest {
    userid: string;         // 用户唯一标识
    ticket: string;         // 认证票据，由平台提供
    platform: number;       // 平台标识，固定为 "0"
    version: string;        // 客户端版本号
}

// 认证响应接口
export interface AuthResponse {
    ErrorCode: number;      // 0成功 非0失败
    ErrorDesc: string;      // 错误描述
    SecretKey: string;      // 鉴权密钥
    AccessPointInfo: {      // 接入点信息
        LastAPId: number;   // 上次接入点ID
        APList: Array<{     // 接入点列表
            APAddress: string;
            Name: string;
        }>;
    };
}

// 签名验证请求头接口
interface AuthHeaders {
    secretid?: string;
    signature?: string;
    nonce?: string;
    utctimestamp?: string;
}

export class AuthClientWithSignature {
    private secretId: string;  // 密钥ID
    private secretKey: string; // 签名

    private static _instance: AuthClientWithSignature = null;

    public static get instance(): AuthClientWithSignature {
        return AuthClientWithSignature._instance ?? (AuthClientWithSignature._instance = new AuthClientWithSignature);
    }

    /**
     * 获取带签名的认证请求
     */
    public getAuthPlayerWithSignature(data: AuthRequest): AuthHeaders {
        const requestData: AuthRequest = {
            userid: data.userid,
            ticket: data.ticket,
            platform: 0,
            version: '1.0.0',
        };

        // 生成签名参数
        const nonce = this.generateNonce();
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = this.generateSignature(requestData, nonce);

        const headers: AuthHeaders = {
            secretid: this.secretId,
            signature: signature,
            nonce: nonce,
            utctimestamp: timestamp
        };
        return headers;
    }

    /**
     * 生成签名
     */
    private generateSignature(params: AuthRequest, nonce: string): string {
        // 1. 参数排序
        const sortedKeys = Object.keys(params).sort();

        // 2. 构建签名字符串
        let signString = '';
        sortedKeys.forEach(key => {
            if (key !== 'signature') { // 排除signature字段
                signString += key + params[key as keyof AuthRequest];
            }
        });

        // 3. 添加密钥和随机数
        signString += this.secretKey + nonce;

        // 4. MD5加密
        return GMd5(signString);
    }

    /**
     * 生成随机字符串
     */
    private generateNonce(length: number = 10): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}