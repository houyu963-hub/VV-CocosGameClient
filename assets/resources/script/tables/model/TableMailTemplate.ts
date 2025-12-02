import TableReader from "../core/TableReader"

export default class TableMailTemplate {
	/**
	 * ID
	 */
	public ID: number
	/**
	 * 含义
	 */
	public MailType: string
	/**
	 * 含义
	 */
	public Title: string
	/**
	 * 含义
	 */
	public Content: string
	/**
	 * 含义
	 */
	public Sender: string
	/**
	 * 含义
	 */
	public ExpireDays: number

	public static parse = (bytes: ArrayBuffer): Map<number, TableMailTemplate> => { 
		let reader = new TableReader(new DataView(bytes))
		let map: Map<number, TableMailTemplate> = new Map()
		while (reader.offset < bytes.byteLength) {
			const data = new TableMailTemplate();

			data.ID = reader.readInt64()
			data.MailType = reader.readString()
			data.Title = reader.readString()
			data.Content = reader.readString()
			data.Sender = reader.readString()
			data.ExpireDays = reader.readInt64()
		
			map.set(data.ID, data)
		}
		reader.clear()
		return map
	}
}