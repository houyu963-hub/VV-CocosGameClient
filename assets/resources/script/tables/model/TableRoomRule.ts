import TableReader from "../core/TableReader"

export default class TableRoomRule {
	/**
	 * ID
	 */
	public ID: number
	/**
	 * 房间数量
	 */
	public RoomCount: number[] = []
	/**
	 * 默认房间数量
	 */
	public DefaultRoomCount: number
	/**
	 * 底分
	 */
	public BaseScore: number[] = []
	/**
	 * 默认底分
	 */
	public DefaultBaseScore: number
	/**
	 * 局数
	 */
	public RoundCount: number[] = []
	/**
	 * 默认局数
	 */
	public DefaultRoundCount: number
	/**
	 * 默认封顶
	 */
	public DefaultCapRule: number
	/**
	 * 默认自摸规则
	 */
	public DefaultSelfDrawRule: number
	/**
	 * 默认点杠规则
	 */
	public DefaultDianGangRule: number
	/**
	 * 防作弊
	 */
	public AntiCheat: boolean
	/**
	 * 默认游戏类型
	 */
	public DefaultGameType: number
	/**
	 * 默认胡牌规则
	 */
	public DefaultHuCardTypes: number[] = []
	/**
	 * 默认番型
	 */
	public DefaultFanxing: number[] = []
	/**
	 * 默认托管
	 */
	public DefaultAutoPlayTimeout: number
	/**
	 * 默认查大叫
	 */
	public DefaultCallRule: number

	public static parse = (bytes: ArrayBuffer): Map<number, TableRoomRule> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableRoomRule> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableRoomRule();

			data.ID = reader.readInt64()
			data.RoomCount = reader.readInt64Array()
			data.DefaultRoomCount = reader.readInt64()
			data.BaseScore = reader.readInt64Array()
			data.DefaultBaseScore = reader.readInt64()
			data.RoundCount = reader.readInt64Array()
			data.DefaultRoundCount = reader.readInt64()
			data.DefaultCapRule = reader.readInt64()
			data.DefaultSelfDrawRule = reader.readInt64()
			data.DefaultDianGangRule = reader.readInt64()
			data.AntiCheat = reader.readBoolean()
			data.DefaultGameType = reader.readInt64()
			data.DefaultHuCardTypes = reader.readInt64Array()
			data.DefaultFanxing = reader.readInt64Array()
			data.DefaultAutoPlayTimeout = reader.readInt64()
			data.DefaultCallRule = reader.readInt64()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}