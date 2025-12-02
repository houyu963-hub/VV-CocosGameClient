interface Date {
    fmt: (format: string) => string;
    addSecond: (second: number) => Date
}

// 日期格式化
Date.prototype.fmt = function (format) {
    var d = this;
    var o: any = {
        'M+': d.getMonth() + 1,  //month
        'd+': d.getDate(),       //day
        'h+': d.getHours(),      //hour
        'm+': d.getMinutes(),    //minute
        's+': d.getSeconds(),    //second
        'q+': Math.floor((d.getMonth() + 3) / 3),  //quarter
        'S': d.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (var k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
        }
    }

    if (format.indexOf('NaN') > -1)
        return '';
    return format;
}

// 增加N秒
Date.prototype.addSecond = function (second: number) {
    let now = this.getTime();
    now += (second * 1000);
    return new Date(now);
}

interface Number {
    add: (num: number) => number;
    sub: (num: number) => number;
    mul: (num: number) => number;
    div: (num: number) => number;
}

Number.prototype.add = function (arg: number) {
    return floatAdd(this.valueOf(), arg);
}
Number.prototype.sub = function (arg: number) {
    return floatSub(this.valueOf(), arg);
}
Number.prototype.mul = function (arg: number) {
    return floatMul(this.valueOf(), arg);
}
Number.prototype.div = function (arg: number) {
    return floatDiv(this.valueOf(), arg);
}

// 加
function floatAdd(arg1: number, arg2: number): number {
    const r1 = arg1.toString().split('.')[1]?.length || 0; // 获取第一个数字的小数位数
    const r2 = arg2.toString().split('.')[1]?.length || 0; // 获取第二个数字的小数位数
    const m = Math.pow(10, Math.max(r1, r2)); // 计算放大倍数

    // 通过放大倍数进行加法，避免浮点数精度问题
    return (arg1 * m + arg2 * m) / m;
}

// 减    
function floatSub(arg1: number, arg2: number): number {
    const r1 = arg1.toString().split('.')[1]?.length || 0; // 获取第一个数字的小数位数
    const r2 = arg2.toString().split('.')[1]?.length || 0; // 获取第二个数字的小数位数
    const m = Math.pow(10, Math.max(r1, r2)); // 计算放大倍数

    // 使用放大倍数进行减法运算，并返回结果
    return ((arg1 * m - arg2 * m) / m);
}

// 乘    
function floatMul(arg1: number, arg2: number): number {
    // 将数字转换为字符串，以便计算小数位数
    const s1 = arg1.toString();
    const s2 = arg2.toString();

    // 计算小数位数
    const m1 = (s1.split('.')[1] || '').length; // arg1 的小数位数
    const m2 = (s2.split('.')[1] || '').length; // arg2 的小数位数
    const m = m1 + m2; // 总的小数位数

    // 进行乘法运算并缩小结果
    return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m);
}

// 除   
function floatDiv(arg1: number, arg2: number): number {
    if (arg2 === 0) {
        throw new Error('Division by zero is not allowed.'); // 处理除以零的情况
    }

    // 将数字转换为字符串，以便计算小数位数
    const s1 = arg1.toString();
    const s2 = arg2.toString();

    // 计算小数位数
    const m1 = (s1.split('.')[1] || '').length; // arg1 的小数位数
    const m2 = (s2.split('.')[1] || '').length; // arg2 的小数位数

    // 进行除法并调整小数位
    return (Number(s1.replace('.', '')) / Number(s2.replace('.', ''))) * Math.pow(10, m2 - m1);
}
