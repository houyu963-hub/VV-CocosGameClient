
export default class TableReader {
    protected _view: DataView = null
    protected _offset: number = 0
    public get offset(): number {
        return this._offset
    }

    constructor(view: DataView) {
        this._view = view
    }

    private decodeString(bytes: Uint8Array): string {
        const wx = window['wx']
        if (null != wx) {
            let str = ""
            for (let i = 0; i < bytes.length; i++) {
                str += String.fromCharCode(bytes[i])
            }
            return decodeURIComponent(escape(str))  // 转UTF-8
        }
        else {
            return new TextDecoder().decode(bytes);
        }
    }

    public readInt32 = (): number => {
        let value = this._view.getInt32(this._offset, true)
        this._offset += 4

        return value
    }

    public readInt32Array = (): number[] => {
        let array: number[] = []
        let len = this.readInt32()
        for (let i = 0; i < len; ++i) {
            array.push(this.readInt32())
        }
        return array
    }

    public readString = (): string => {
        let strLen = this.readInt32()
        let strBytes = new Uint8Array(this._view.buffer, this._offset, strLen)
        this._offset += strBytes.length

        return this.decodeString(strBytes)
    }

    public readStringArray = (): string[] => {
        let array: string[] = []
        let len = this.readInt32()
        for (let i = 0; i < len; ++i) {
            array.push(this.readString())
        }

        return array
    }

    public readInt64 = (): number => {
        let value = Number(this._view.getBigInt64(this._offset, true))
        this._offset += 8
        return value
    }

    public readInt64Array = (): number[] => {
        let array: number[] = []
        let len = this.readInt32()
        for (let i = 0; i < len; ++i) {
            array.push(this.readInt64())
        }
        return array
    }

    public readFloat = (): number => {
        let value = Number(this._view.getFloat64(this._offset, true))
        this._offset += 8
        return value
    }

    public readFloatArray = (): number[] => {
        let array: number[] = []
        let len = this.readInt32()
        for (let i = 0; i < len; ++i) {
            array.push(this.readFloat())
        }

        return array
    }

    public readBoolean = (): boolean => {
        let value = this._view.getUint8(this._offset) === 1
        this._offset += 1
        return value
    }

    public readBooleanArray = (): boolean[] => {
        let array: boolean[] = []
        let len = this.readInt32()
        for (let i = 0; i < len; ++i) {
            array.push(this.readBoolean())
        }
        return array
    }

    public clear = () => {
        this._view = null
        this._offset = 0
    }
}