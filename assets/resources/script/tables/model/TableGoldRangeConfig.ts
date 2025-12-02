import TableReader from "../core/TableReader"

export default class TableGoldRangeConfig {
	/**
	 * ID
	 */
	public ID: number
	/**
	 * 含义
	 */
	public Desc: string
	/**
	 * 含义
	 */
	public IntValue: number
	/**
	 * 含义
	 */
	public StringValue: string
	/**
	 * 含义
	 */
	public StringValue2: string

	public static parse = (bytes: ArrayBuffer): Map<number, TableGoldRangeConfig> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableGoldRangeConfig> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableGoldRangeConfig();

			data.ID = reader.readInt64()
			data.Desc = reader.readString()
			data.IntValue = reader.readInt64()
			data.StringValue = reader.readString()
			data.StringValue2 = reader.readString()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}