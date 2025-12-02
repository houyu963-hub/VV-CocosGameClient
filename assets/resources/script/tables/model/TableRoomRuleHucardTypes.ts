import TableReader from "../core/TableReader"

export default class TableRoomRuleHucardTypes {
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

	public static parse = (bytes: ArrayBuffer): Map<number, TableRoomRuleHucardTypes> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableRoomRuleHucardTypes> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableRoomRuleHucardTypes();

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