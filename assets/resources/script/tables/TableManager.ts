import { assetManager, AssetManager, TextAsset } from "cc"

import TableGuildConfig from "./model/TableGuildConfig"
import TableAvatar from "./model/TableAvatar"
import TableBotNames from "./model/TableBotNames"
import TableCoinLobby from "./model/TableCoinLobby"
import TableDiscreteConfig from "./model/TableDiscreteConfig"
import TableDuobaoRewardTiers from "./model/TableDuobaoRewardTiers"
import TableDuobaoSystemModules from "./model/TableDuobaoSystemModules"
import TableMailTemplate from "./model/TableMailTemplate"
import TableMatchmakingConfig from "./model/TableMatchmakingConfig"
import TableRoomCreationConfig from "./model/TableRoomCreationConfig"
import TableRoomRule from "./model/TableRoomRule"
import TableRoomRuleCall from "./model/TableRoomRuleCall"
import TableRoomRuleCaprule from "./model/TableRoomRuleCaprule"
import TableRoomRuleDiangang from "./model/TableRoomRuleDiangang"
import TableRoomRuleFanxing from "./model/TableRoomRuleFanxing"
import TableRoomRuleHucardTypes from "./model/TableRoomRuleHucardTypes"
import TableRoomRuleSelfdraw from "./model/TableRoomRuleSelfdraw"
import TableRoomRuleTrusteeship from "./model/TableRoomRuleTrusteeship"
import TableShop from "./model/TableShop"
import TableStrings from "./model/TableStrings"
import TableTest from "./model/TableTest"


export default class TableManager {
    private static _instance: TableManager = null
    public static get instance(): TableManager {
        if (this._instance == null) {
            this._instance = new TableManager()
        }
        return this._instance
    }
    private _inited: boolean = false


    private _mapGuildConfig: Map<number, TableGuildConfig> = new Map()
    public get mapGuildConfig(): Map<number, TableGuildConfig> {
        return this._mapGuildConfig
    }
    public getGuildConfigByID(id: number): TableGuildConfig {
        return this._mapGuildConfig.get(id)
    }
		
    private _mapAvatar: Map<number, TableAvatar> = new Map()
    public get mapAvatar(): Map<number, TableAvatar> {
        return this._mapAvatar
    }
    public getAvatarByID(id: number): TableAvatar {
        return this._mapAvatar.get(id)
    }
		
    private _mapBotNames: Map<number, TableBotNames> = new Map()
    public get mapBotNames(): Map<number, TableBotNames> {
        return this._mapBotNames
    }
    public getBotNamesByID(id: number): TableBotNames {
        return this._mapBotNames.get(id)
    }
		
    private _mapCoinLobby: Map<number, TableCoinLobby> = new Map()
    public get mapCoinLobby(): Map<number, TableCoinLobby> {
        return this._mapCoinLobby
    }
    public getCoinLobbyByID(id: number): TableCoinLobby {
        return this._mapCoinLobby.get(id)
    }
		
    private _mapDiscreteConfig: Map<number, TableDiscreteConfig> = new Map()
    public get mapDiscreteConfig(): Map<number, TableDiscreteConfig> {
        return this._mapDiscreteConfig
    }
    public getDiscreteConfigByID(id: number): TableDiscreteConfig {
        return this._mapDiscreteConfig.get(id)
    }
		
    private _mapDuobaoRewardTiers: Map<number, TableDuobaoRewardTiers> = new Map()
    public get mapDuobaoRewardTiers(): Map<number, TableDuobaoRewardTiers> {
        return this._mapDuobaoRewardTiers
    }
    public getDuobaoRewardTiersByID(id: number): TableDuobaoRewardTiers {
        return this._mapDuobaoRewardTiers.get(id)
    }
		
    private _mapDuobaoSystemModules: Map<number, TableDuobaoSystemModules> = new Map()
    public get mapDuobaoSystemModules(): Map<number, TableDuobaoSystemModules> {
        return this._mapDuobaoSystemModules
    }
    public getDuobaoSystemModulesByID(id: number): TableDuobaoSystemModules {
        return this._mapDuobaoSystemModules.get(id)
    }
		
    private _mapMailTemplate: Map<number, TableMailTemplate> = new Map()
    public get mapMailTemplate(): Map<number, TableMailTemplate> {
        return this._mapMailTemplate
    }
    public getMailTemplateByID(id: number): TableMailTemplate {
        return this._mapMailTemplate.get(id)
    }
		
    private _mapMatchmakingConfig: Map<number, TableMatchmakingConfig> = new Map()
    public get mapMatchmakingConfig(): Map<number, TableMatchmakingConfig> {
        return this._mapMatchmakingConfig
    }
    public getMatchmakingConfigByID(id: number): TableMatchmakingConfig {
        return this._mapMatchmakingConfig.get(id)
    }
		
    private _mapRoomCreationConfig: Map<number, TableRoomCreationConfig> = new Map()
    public get mapRoomCreationConfig(): Map<number, TableRoomCreationConfig> {
        return this._mapRoomCreationConfig
    }
    public getRoomCreationConfigByID(id: number): TableRoomCreationConfig {
        return this._mapRoomCreationConfig.get(id)
    }
		
    private _mapRoomRule: Map<number, TableRoomRule> = new Map()
    public get mapRoomRule(): Map<number, TableRoomRule> {
        return this._mapRoomRule
    }
    public getRoomRuleByID(id: number): TableRoomRule {
        return this._mapRoomRule.get(id)
    }
		
    private _mapRoomRuleCall: Map<number, TableRoomRuleCall> = new Map()
    public get mapRoomRuleCall(): Map<number, TableRoomRuleCall> {
        return this._mapRoomRuleCall
    }
    public getRoomRuleCallByID(id: number): TableRoomRuleCall {
        return this._mapRoomRuleCall.get(id)
    }
		
    private _mapRoomRuleCaprule: Map<number, TableRoomRuleCaprule> = new Map()
    public get mapRoomRuleCaprule(): Map<number, TableRoomRuleCaprule> {
        return this._mapRoomRuleCaprule
    }
    public getRoomRuleCapruleByID(id: number): TableRoomRuleCaprule {
        return this._mapRoomRuleCaprule.get(id)
    }
		
    private _mapRoomRuleDiangang: Map<number, TableRoomRuleDiangang> = new Map()
    public get mapRoomRuleDiangang(): Map<number, TableRoomRuleDiangang> {
        return this._mapRoomRuleDiangang
    }
    public getRoomRuleDiangangByID(id: number): TableRoomRuleDiangang {
        return this._mapRoomRuleDiangang.get(id)
    }
		
    private _mapRoomRuleFanxing: Map<number, TableRoomRuleFanxing> = new Map()
    public get mapRoomRuleFanxing(): Map<number, TableRoomRuleFanxing> {
        return this._mapRoomRuleFanxing
    }
    public getRoomRuleFanxingByID(id: number): TableRoomRuleFanxing {
        return this._mapRoomRuleFanxing.get(id)
    }
		
    private _mapRoomRuleHucardTypes: Map<number, TableRoomRuleHucardTypes> = new Map()
    public get mapRoomRuleHucardTypes(): Map<number, TableRoomRuleHucardTypes> {
        return this._mapRoomRuleHucardTypes
    }
    public getRoomRuleHucardTypesByID(id: number): TableRoomRuleHucardTypes {
        return this._mapRoomRuleHucardTypes.get(id)
    }
		
    private _mapRoomRuleSelfdraw: Map<number, TableRoomRuleSelfdraw> = new Map()
    public get mapRoomRuleSelfdraw(): Map<number, TableRoomRuleSelfdraw> {
        return this._mapRoomRuleSelfdraw
    }
    public getRoomRuleSelfdrawByID(id: number): TableRoomRuleSelfdraw {
        return this._mapRoomRuleSelfdraw.get(id)
    }
		
    private _mapRoomRuleTrusteeship: Map<number, TableRoomRuleTrusteeship> = new Map()
    public get mapRoomRuleTrusteeship(): Map<number, TableRoomRuleTrusteeship> {
        return this._mapRoomRuleTrusteeship
    }
    public getRoomRuleTrusteeshipByID(id: number): TableRoomRuleTrusteeship {
        return this._mapRoomRuleTrusteeship.get(id)
    }
		
    private _mapShop: Map<number, TableShop> = new Map()
    public get mapShop(): Map<number, TableShop> {
        return this._mapShop
    }
    public getShopByID(id: number): TableShop {
        return this._mapShop.get(id)
    }
		
    private _mapStrings: Map<number, TableStrings> = new Map()
    public get mapStrings(): Map<number, TableStrings> {
        return this._mapStrings
    }
    public getStringsByID(id: number): TableStrings {
        return this._mapStrings.get(id)
    }
		
    private _mapTest: Map<number, TableTest> = new Map()
    public get mapTest(): Map<number, TableTest> {
        return this._mapTest
    }
    public getTestByID(id: number): TableTest {
        return this._mapTest.get(id)
    }
		

    private _bundle: AssetManager.Bundle

    private loadBundle = async (): Promise<AssetManager.Bundle> => {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle("resources", (err: Error, bundle: AssetManager.Bundle) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(bundle)
            })
        })
    }

    init = async () => {
        if(this._inited) {
            return
        }
        this._inited = true
		this._bundle = await this.loadBundle()

        this._mapGuildConfig = await this.load("GuildConfig").then((bytes) => {
            return TableGuildConfig.parse(bytes)
        })
		
        this._mapAvatar = await this.load("avatar").then((bytes) => {
            return TableAvatar.parse(bytes)
        })
		
        this._mapBotNames = await this.load("bot_names").then((bytes) => {
            return TableBotNames.parse(bytes)
        })
		
        this._mapCoinLobby = await this.load("coin_lobby").then((bytes) => {
            return TableCoinLobby.parse(bytes)
        })
		
        this._mapDiscreteConfig = await this.load("discrete_config").then((bytes) => {
            return TableDiscreteConfig.parse(bytes)
        })
		
        this._mapDuobaoRewardTiers = await this.load("duobao_reward_tiers").then((bytes) => {
            return TableDuobaoRewardTiers.parse(bytes)
        })
		
        this._mapDuobaoSystemModules = await this.load("duobao_system_modules").then((bytes) => {
            return TableDuobaoSystemModules.parse(bytes)
        })
		
        this._mapMailTemplate = await this.load("mail_template").then((bytes) => {
            return TableMailTemplate.parse(bytes)
        })
		
        this._mapMatchmakingConfig = await this.load("matchmaking_config").then((bytes) => {
            return TableMatchmakingConfig.parse(bytes)
        })
		
        this._mapRoomCreationConfig = await this.load("room_creation_config").then((bytes) => {
            return TableRoomCreationConfig.parse(bytes)
        })
		
        this._mapRoomRule = await this.load("room_rule").then((bytes) => {
            return TableRoomRule.parse(bytes)
        })
		
        this._mapRoomRuleCall = await this.load("room_rule_call").then((bytes) => {
            return TableRoomRuleCall.parse(bytes)
        })
		
        this._mapRoomRuleCaprule = await this.load("room_rule_caprule").then((bytes) => {
            return TableRoomRuleCaprule.parse(bytes)
        })
		
        this._mapRoomRuleDiangang = await this.load("room_rule_diangang").then((bytes) => {
            return TableRoomRuleDiangang.parse(bytes)
        })
		
        this._mapRoomRuleFanxing = await this.load("room_rule_fanxing").then((bytes) => {
            return TableRoomRuleFanxing.parse(bytes)
        })
		
        this._mapRoomRuleHucardTypes = await this.load("room_rule_hucard_types").then((bytes) => {
            return TableRoomRuleHucardTypes.parse(bytes)
        })
		
        this._mapRoomRuleSelfdraw = await this.load("room_rule_selfdraw").then((bytes) => {
            return TableRoomRuleSelfdraw.parse(bytes)
        })
		
        this._mapRoomRuleTrusteeship = await this.load("room_rule_trusteeship").then((bytes) => {
            return TableRoomRuleTrusteeship.parse(bytes)
        })
		
        this._mapShop = await this.load("shop").then((bytes) => {
            return TableShop.parse(bytes)
        })
		
        this._mapStrings = await this.load("strings").then((bytes) => {
            return TableStrings.parse(bytes)
        })
		
        this._mapTest = await this.load("test").then((bytes) => {
            return TableTest.parse(bytes)
        })
		

        this._bundle = null
    }

    async load(tableName: string): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>((resolve) => {
            this._bundle.load("config_bin/" + tableName, (err, data: TextAsset) => {
                if (err) {
                    console.error("TableBase load error " + err)
                    resolve(null)
                    return
                }
                else {
                    let buffer = data._nativeAsset as ArrayBuffer
                    if (null != buffer) {
                        resolve(buffer)
                    }
                    else {
                        resolve(null)
                    }
                }
            })
        })
    }
}