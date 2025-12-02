import TableReader from "../core/TableReader"

export default class TableTest {
	public ID: number
	public stringValue: string
	public intValue: number
	public floatValue: number
	public booleanValue: boolean
	public stringArrayValue: string[] = []
	public intArrayValue: number[] = []
	public floatArrayValue: number[] = []
	public booleanArrayValue: boolean[] = []

	public static parse = (bytes: ArrayBuffer): Map<number, TableTest> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableTest> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableTest();

			data.ID = reader.readInt64()
			data.stringValue = reader.readString()
			data.intValue = reader.readInt64()
			data.floatValue = reader.readFloat()
			data.booleanValue = reader.readBoolean()
			data.stringArrayValue = reader.readStringArray()
			data.intArrayValue = reader.readInt64Array()
			data.floatArrayValue = reader.readFloatArray()
			data.booleanArrayValue = reader.readBooleanArray()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}