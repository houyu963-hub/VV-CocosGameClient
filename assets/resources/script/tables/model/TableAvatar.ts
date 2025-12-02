import TableReader from "../core/TableReader"

export default class TableAvatar {
	public ID: number
	public Name: string
	public Source: string
	public Icon: string

	public static parse = (bytes: ArrayBuffer): Map<number, TableAvatar> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableAvatar> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableAvatar();

			data.ID = reader.readInt64()
			data.Name = reader.readString()
			data.Source = reader.readString()
			data.Icon = reader.readString()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}