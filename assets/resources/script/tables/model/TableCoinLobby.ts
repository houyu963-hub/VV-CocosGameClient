import TableReader from "../core/TableReader"

export default class TableCoinLobby {
	/**
	 * ID
	 */
	public ID: number
	/**
	 * 
	 */
	public RoomType: number
	/**
	 * 金币下限
	 */
	public Min: number
	/**
	 * 金币上限
	 */
	public Max: number
	/**
	 * 
	 */
	public Desc: string
	/**
	 * 
	 */
	public BaseScore: number
	/**
	 * 
	 */
	public RoomLevel: string
	/**
	 * 
	 */
	public BaseScoreDesc: string
	/**
	 * 
	 */
	public LimitDesc: string
	/**
	 * 每局固定抽成
	 */
	public FixedRoundFee: number
	/**
	 * N局的奖励
	 */
	public RoundRewardRules: number[] = []

	public static parse = (bytes: ArrayBuffer): Map<number, TableCoinLobby> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableCoinLobby> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableCoinLobby();

			data.ID = reader.readInt64()
			data.RoomType = reader.readInt64()
			data.Min = reader.readInt64()
			data.Max = reader.readInt64()
			data.Desc = reader.readString()
			data.BaseScore = reader.readInt64()
			data.RoomLevel = reader.readString()
			data.BaseScoreDesc = reader.readString()
			data.LimitDesc = reader.readString()
			data.FixedRoundFee = reader.readInt64()
			data.RoundRewardRules = reader.readInt64Array()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}