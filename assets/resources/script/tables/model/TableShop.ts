import TableReader from "../core/TableReader"

export default class TableShop {
	public ID: number
	public Name: string
	public Price: number
	public Icon: string
	public Type: number

	public static parse = (bytes: ArrayBuffer): Map<number, TableShop> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableShop> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableShop();

			data.ID = reader.readInt64()
			data.Name = reader.readString()
			data.Price = reader.readInt64()
			data.Icon = reader.readString()
			data.Type = reader.readInt64()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}