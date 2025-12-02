import TableReader from "../core/TableReader"

export default class TableDuobaoSystemModules {
	/**
	 * ID
	 */
	public ID: number
	/**
	 * 含义
	 */
	public ItemId: number
	/**
	 * 含义
	 */
	public ItemCount: number
	/**
	 * 含义
	 */
	public RequiredTickets: number
	/**
	 * 含义
	 */
	public Online: number
	/**
	 * 含义
	 */
	public Name: string
	/**
	 * 含义
	 */
	public RewardImageLarge: string
	/**
	 * 含义
	 */
	public RewardImageSmall: string

	public static parse = (bytes: ArrayBuffer): Map<number, TableDuobaoSystemModules> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableDuobaoSystemModules> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableDuobaoSystemModules();

			data.ID = reader.readInt64()
			data.ItemId = reader.readInt64()
			data.ItemCount = reader.readInt64()
			data.RequiredTickets = reader.readInt64()
			data.Online = reader.readInt64()
			data.Name = reader.readString()
			data.RewardImageLarge = reader.readString()
			data.RewardImageSmall = reader.readString()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}