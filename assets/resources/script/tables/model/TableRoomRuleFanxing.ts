import TableReader from "../core/TableReader"

export default class TableRoomRuleFanxing {
	/**
	 * ID
	 */
	public ID: number
	/**
	 * 
	 */
	public Type: number
	/**
	 * 
	 */
	public Desc: string
	/**
	 * 
	 */
	public IsShow: boolean

	public static parse = (bytes: ArrayBuffer): Map<number, TableRoomRuleFanxing> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableRoomRuleFanxing> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableRoomRuleFanxing();

			data.ID = reader.readInt64()
			data.Type = reader.readInt64()
			data.Desc = reader.readString()
			data.IsShow = reader.readBoolean()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}