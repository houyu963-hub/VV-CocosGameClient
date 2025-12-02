import TableReader from "../core/TableReader"

export default class TableStrings {
	public ID: number
	public zh_cn: string

	public static parse = (bytes: ArrayBuffer): Map<number, TableStrings> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableStrings> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableStrings();

			data.ID = reader.readInt64()
			data.zh_cn = reader.readString()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}