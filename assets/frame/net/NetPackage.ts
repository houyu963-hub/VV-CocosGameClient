import vv from "../Core";

export default class NetPackage {

    /*
     * 编码基础消息格式（只需传msgName和msgData，自动生成msgBody）
     * @param msgName 消息名称 格式："包名.消息类型"
     * @param msgData 业务数据对象（会自动序列化为PB）
     * @param traceInfo 链路追踪信息对象
     * @returns ArrayBuffer
     */
    public static encodeBuffer(msgName: string, msgData: any, traceInfo?: any): ArrayBuffer {
        // 自动生成PB序列化后的msgBody
        const [pkg, type] = msgName.split('.');
        const msgBody = vv.pb[pkg][type].encode(vv.pb[pkg][type].create(msgData || {})).finish();

        // 构造BaseMsg
        const baseMsg = vv.pb.Base.BaseMsg.create({
            MsgName: msgName,
            MsgBody: msgBody,
            TraceInfo: traceInfo || null
        });
        const baseMsgBuffer = vv.pb.Base.BaseMsg.encode(baseMsg).finish();

        // 加长度头
        const totalLength = baseMsgBuffer.length;
        const resultBuffer = new Uint8Array(totalLength + 2);
        resultBuffer[0] = (totalLength >> 8) & 0xff;
        resultBuffer[1] = totalLength & 0xff;
        resultBuffer.set(baseMsgBuffer, 2);

        return resultBuffer.buffer;
    }

    /*
     * 解码基础消息格式（带长度头）
     * @param buffer ArrayBuffer
     * @returns { msgName: string, msgBody: Uint8Array, traceInfo: any }
     */
    public static decodeDataBuffer(buffer: ArrayBuffer): { msgName: string, msgBody: any, traceInfo: any } {
        const uint8Arr = new Uint8Array(buffer);
        const totalLength = (uint8Arr[0] << 8) | uint8Arr[1];
        const baseMsgBuffer = uint8Arr.subarray(2, 2 + totalLength);
        const baseMsg = vv.pb.Base.BaseMsg.decode(baseMsgBuffer);

        // 反序列化业务消息体
        let msgBodyObj = null;
        if (baseMsg.MsgName && baseMsg.MsgBody) {
            const [pkg, type] = baseMsg.MsgName.split('.');
            msgBodyObj = vv.pb[pkg][type].decode(baseMsg.MsgBody);
        }

        return {
            msgName: baseMsg.MsgName,
            msgBody: msgBodyObj,
            traceInfo: baseMsg.TraceInfo
        };
    }
}
