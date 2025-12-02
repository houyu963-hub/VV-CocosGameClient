import TableReader from "../core/TableReader"

export default class TableRoomCreationConfig {
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
	public StringValue2: string
	/**
	 * 含义
	 */
	public Array: number[] = []

	public static parse = (bytes: ArrayBuffer): Map<number, TableRoomCreationConfig> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableRoomCreationConfig> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableRoomCreationConfig();

			data.ID = reader.readInt64()
			data.Desc = reader.readString()
			data.IntValue = reader.readInt64()
			data.StringValue2 = reader.readString()
			data.Array = reader.readInt64Array()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}