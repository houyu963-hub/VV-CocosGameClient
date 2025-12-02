import { PreLobby } from "../../resources/pbjs";

/**
 * 用户数据
 */
export default class UserData {
    public userData: PreLobby.IRspGetRoleBaseData = null;
    public settingData: { [k: string]: string } = null;
}