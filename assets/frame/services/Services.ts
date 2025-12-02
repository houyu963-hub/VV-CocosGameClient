/**
 * 服务类 需要全局运行的可以加到这里面
 */
export default class Services {

    private _servicesClass = [];
    private instances = [];

    public add(cls: Object): void {
        this._servicesClass.push(cls);
    }

    public init(): void {
        this.instances = [];
        for (const i in this._servicesClass) {
            let s = this._servicesClass[i]
            if (s.init) {
                s.init();
            } else {
                s = new this._servicesClass[i];
                s.init();
            }
            this.instances.push(s);
        }
    }
}