import { _decorator, CCBoolean, CCInteger, Color, Enum, Sprite, SpriteAtlas, UITransform, v3 } from "cc";
import BaseClass from "db://assets/frame/ui/BaseClass";

const { ccclass, property, executeInEditMode } = _decorator;

export enum ColorType { // 麻将花色 万条同
    Wan,
    Tiao,
    Tong
}

export enum DIR { // 方向 上下左右
    Up = 0,
    Down,
    Left,
    Right
}

export enum Status { // 麻将状态 立起、倒下
    Stand = 0,
    Lie
}

export enum Kind { // 麻将种类 手牌、弃牌、牌库
    Hand = 0,
    Discard,
    Library
}

interface ICardBase {
    setIndex(index?: number): void; // 设置麻将位置索引 不同位置的麻将底板不一样
    setCard(value: number): void;   // 设置麻将值 具体是什么牌
}

const MJ_ENUM = createCardEnum();
function createCardEnum(): object {
    let tab = {};
    for (let i = 1; i <= 9; i++) {
        tab[i + '万'] = i;
        tab[i + '条'] = i + 10;
        tab[i + '筒'] = i + 20;
    }
    return tab;
}

@ccclass
@executeInEditMode
export default class MJCard extends BaseClass {
    public data: any;

    protected onLoad(): void {
        this.ctrl.setIndex();
        this.ctrl.setCard(this.card);
    }

    private _magicCards: number[] = []; // 功能牌

    // 麻将图集 1-9万 17-25条 33-41筒 49-55东南西北中发白 65-72春夏秋冬梅兰竹菊
    // 服务器 1-9万 11-19条 21-29筒
    @property({ type: SpriteAtlas, tooltip: '麻将图集' }) spriteAtlas: SpriteAtlas;

    // 获取麻将背面 Sprite
    get back() {
        return this.$('_back').getComponent(Sprite);
    }

    // 获取麻将花色 Sprite
    get flower(): Sprite {
        return this.$('_flower').getComponent(Sprite);
    }

    // 显示功能牌标志 如混牌、赖子等
    set isMagic(value: boolean) {
        this.$('_magic').active = value;
    }
    get isMagic(): boolean {
        return this.$('magic').active;
    }

    @property _status: Status = Status.Stand;
    @property({ type: Enum(Status), tooltip: '设置麻将状态 立起还是倒下' })
    set status(value: Status) {
        this._status = value;
        this.changeType();
    }
    get status() {
        return this._status;
    }

    @property _kind: Kind = Kind.Hand;
    @property({ type: Enum(Kind), tooltip: '设置麻将种类 手牌、弃牌、牌库' })
    set kind(value: Kind) {
        this._kind = value;
        this.changeType();
    }
    get kind() {
        return this._kind;
    }

    @property _direction: DIR = DIR.Down;
    @property({ type: Enum(DIR), tooltip: '设置麻将朝向，上下左右' })
    set direction(value: DIR) {
        this._direction = value
        this.changeType();
    }
    get direction() {
        return this._direction;
    }

    @property _index: number = 0;
    @property({ type: CCInteger, tooltip: '设置麻将位置，不同的位置麻将底板图片不同' })
    set index(value: number) {
        this._index = value;
        this.ctrl.setIndex(value);
    }
    get index() {
        return this._index;
    }

    // 获取控制器
    _ctrl: ICardBase = null;
    get ctrl() {
        if (this._ctrl == null) {
            this.makeCtrl();
        }
        return this._ctrl;
    }
    set ctrl(value: ICardBase) {
        this._ctrl = value;
    }

    // 创建控制器 根据麻将的方向和状态
    private makeCtrl(): void {
        if (!this.is3d) {
            this._ctrl = new Card2D(this);
            return;
        }
        let key = DIR[this.direction] + Status[this._status];
        if (this.kind == Kind.Discard) key += Kind[this.kind];
        const ctrlClass = CardCtrlMap[key];
        if (!ctrlClass) throw new Error(`CardCtrlMap 未找到控制类: ${key}`);
        this._ctrl = new ctrlClass(this);
    }

    // 赋值功能牌
    _magicCard: number = 0;
    set magicCard(value: number) {
        this._magicCard = value;
    }

    @property _card: number = 0;
    @property({ type: Enum(MJ_ENUM), tooltip: '设置麻将值' })
    set card(value: number) {
        this._card = value;
        this.ctrl.setCard(value);
        this.isMagic = this._magicCards.includes(this._card);
    }
    get card(): number {
        return this._card;
    }

    @property({ type: Color, tooltip: '置灰颜色', visible: function () { return this._isGray } }) grayColor: Color = new Color(200, 200, 200);
    @property _isGray: boolean = false;
    @property({ type: CCBoolean, tooltip: '置灰' })
    set isGray(value: boolean) {
        this._isGray = value;
        if (!value) {
            this.color = this.isSelect ? this.selectColor : Color.WHITE;
        } else {
            this.color = this.grayColor;
        }
    }
    get isGray() {
        return this._isGray;
    }

    @property({ type: Color, visible: function () { return this._isSelect } }) selectColor: Color = new Color(175, 255, 220); // 选中时的颜色
    @property _isSelect: boolean = false;
    @property({ type: CCBoolean, tooltip: '是否选中' })
    set isSelect(value: boolean) {
        this._isSelect = value;
        if (!value) {
            this.color = this.isGray ? this.grayColor : Color.WHITE;
        } else {
            this.color = this.selectColor;
        }
    }
    get isSelect() {
        return this._isSelect;
    }

    // 设置麻将颜色
    set color(value: Color) {
        this.back.color = value;
        this.flower.color = value;
    }
    get color(): Color {
        return this.back.color;
    }

    @property({ type: CCInteger, tooltip: '弹起高度', visible: function () { return this._shoot } }) distance: number = 70;
    @property _shoot: boolean = false;
    @property({ type: CCBoolean, tooltip: '是否弹起' })
    set shoot(value: boolean) {
        this.node.setPosition(this.node.getPosition().x, value ? this.distance : 0, 0);
        this._shoot = value;
    }
    get shoot() {
        return this._shoot;
    }

    // 3d
    @property _is3d: boolean = true;
    @property
    set is3d(value: boolean) {
        this._is3d = value;
        if (value) this.makeCtrl();
        this.changeType();
    }

    get is3d() {
        return this._is3d;
    }

    // 改变麻将状态、类型、方向时重新创建控制器改变底板
    private changeType(): void {
        this.makeCtrl();
        this.ctrl.setIndex();
        this.ctrl.setCard(this.card);
    }

    // 获取麻将的花色 万条同
    public get flowerColor() {
        let value = this.card;
        if (value <= 9) return ColorType.Wan;
        if (value <= 19) return ColorType.Tiao;
        if (value <= 29) return ColorType.Tong;
        return -1;
    }
}

// 基础控制类
class CardBase {
    public back: Sprite = null;             // 麻将背面
    public flower: Sprite = null;           // 麻将花色
    public spriteAtlas: SpriteAtlas = null; // 麻将图集

    constructor(protected ctrl: MJCard) {   // 传入控制器
        this.back = this.ctrl.back;
        this.flower = this.ctrl.flower;
        this.spriteAtlas = this.ctrl.spriteAtlas;
    }
    // 设置麻将值
    setCard(value: number) {
        let spriteFrame = this.spriteAtlas.getSpriteFrame(`flower_${value + this.ctrl.flowerColor * 6}.png`);
        if (spriteFrame) {
            this.flower.spriteFrame = spriteFrame;
            this.flower.node.active = true;
        } else {
            this.flower.node.active = false;
        }
        this.setIndex(this.ctrl.index);
    }
    // 设置麻将索引 派生类重写以具体实现
    setIndex(value: number) { }
}

// 2d
class Card2D extends CardBase implements ICardBase {
    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    dirName: string[] = ['D', 'D', 'L', 'R'];
    typeName: string[] = ['S', 'L'];

    setCard(value: number) {
        super.setCard(value);
        let dir = ((this.ctrl.direction == DIR.Left || this.ctrl.direction == DIR.Right) && this.ctrl.status == Status.Lie ? 'L' : this.dirName[this.ctrl.direction]);
        let backName = `back2d_${dir}${this.typeName[this.ctrl.status]}${this.flower.node.active ? 'F' : 'B'}`;
        console.log(backName)
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`${backName}.png`);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 下家立着的牌 处理类
class DownStand extends CardBase implements ICardBase {
    private posX: number[] = [];
    private maxIndex = 13; // 最多14张麻将

    constructor(protected ctrl: MJCard) {
        super(ctrl);
        let step = 9 / 6;
        for (let i = 0; i < 7; i++) {
            this.posX.unshift(i * step);
            this.posX.push(-i * step);
        }
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        let str = this.flower.node.active ? 'HDSF_' : 'HDSB_';
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_${str}${index}.png`);
        this.flower.node.setPosition(this.posX[index], -6, 0);
        this.flower.node.eulerAngles = v3(0, 0, 0);
        this.flower.node.scale = v3(1, 1, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 上家立着的牌 处理类
class UpStand extends CardBase implements ICardBase {
    private maxIndex = 13; // 最多13张麻将
    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_HUSB_${index}.png`);
        this.flower.node.active = false;
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 左家立着的牌 处理类
class LeftStand extends CardBase implements ICardBase {
    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame('back_HLSB.png');
        this.flower.node.active = false;
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 右家立着的牌 处理类
class RightStand extends CardBase implements ICardBase {
    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame('back_HRSB.png');
        this.flower.node.active = false;
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 下家躺着的牌 处理类
class DownLie extends CardBase implements ICardBase {
    private maxIndex = 15;
    private posX: number[] = [];
    private rotateY: number[] = [];
    private scaleX: number[] = [];

    constructor(protected ctrl: MJCard) {
        super(ctrl);
        for (let i = 0; i < 8; i++) {
            this.posX.unshift(-1 + i * (9 / 7));
            this.posX.push(1 - i * (9 / 7));
            this.rotateY.unshift(-i * 2);
            this.rotateY.push(i * 2);
            this.scaleX.unshift(0.8 + 0.05 / 7 * i);
            this.scaleX.push(0.8 + 0.05 / 7 * i);
        }
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        let str = this.flower.node.active ? 'DLF_' : 'DLB_';
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_H${str}${index}.png`);
        this.flower.node.setPosition(this.posX[index], 21, 0);
        this.flower.node.eulerAngles = v3(48, this.rotateY[index], 0);
        this.flower.node.scale = v3(this.scaleX[index], 1, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 上家躺着的牌 处理类
class UpLie extends CardBase implements ICardBase {
    private maxIndex = 15;
    posX: number[] = [];
    rotateY: number[] = [];
    scaleX: number[] = [];

    constructor(protected ctrl: MJCard) {
        super(ctrl);
        for (let i = 0; i < 8; i++) {
            this.posX.unshift(-1 + i * (9 / 7));
            this.posX.push(1 - i * (9 / 7));
            this.rotateY.unshift(-i * 2);
            this.rotateY.push(i * 2);
            this.scaleX.unshift(0.8 + 0.05 / 7 * i);
            this.scaleX.push(0.8 + 0.05 / 7 * i);
        }
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        let str = this.flower.node.active ? 'DLF_' : 'DLB_';
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_H${str}${index}.png`);
        this.flower.node.setPosition(this.posX[index], 21, 0);
        this.flower.node.eulerAngles = v3(48, -this.rotateY[index], 180);
        this.flower.node.scale = v3(this.scaleX[index], 1, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 左家躺着的牌 处理类
class LeftLie extends CardBase implements ICardBase {
    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        let str = this.flower.node.active ? 'LLF' : 'LLB';
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_H${str}.png`);
        this.flower.node.setPosition(-3.5, 13, 0);
        this.flower.node.eulerAngles = v3(-90, -113, -50);
        this.flower.node.scale = v3(0.5, 0.5, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 右家躺着的牌 处理类
class RightLie extends CardBase implements ICardBase {
    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        let str = this.flower.node.active ? 'RLF' : 'RLB';
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_H${str}.png`);
        this.flower.node.setPosition(3.5, 13, 0);
        this.flower.node.eulerAngles = v3(-90, 113, 50);
        this.flower.node.scale = v3(0.5, 0.5, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 下家打出去的牌
class DownLieDiscard extends CardBase implements ICardBase {
    private maxIndex = 9;
    posX: number[] = [];
    rotateY: number[] = [];
    scaleX: number[] = [];

    constructor(protected ctrl: MJCard) {
        super(ctrl);
        for (let i = 0; i < 6; i++) {
            this.posX.unshift(i * (3 / 5));
            this.rotateY.unshift(i * (-9 / 5));
            if (i == 0) continue;
            this.posX.push(i * (-3 / 4));
            this.rotateY.push(i * (9 / 4));
        }
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_DDLF_${index}.png`);
        this.flower.node.setPosition(this.posX[index], 16, 0);
        this.flower.node.eulerAngles = v3(35, this.rotateY[index], 0);
        this.flower.node.scale = v3(0.6, 0.6, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 上家打出去的牌
class UpLieDiscard extends CardBase implements ICardBase {
    private maxIndex = 9;
    posX: number[] = [];
    rotateY: number[] = [];
    scaleX: number[] = [];

    constructor(protected ctrl: MJCard) {
        super(ctrl);
        for (let i = 0; i < 6; i++) {
            this.posX.unshift(i * (3 / 5));
            this.rotateY.unshift(i * (-9 / 5));
            if (i == 0) continue;
            this.posX.push(i * (-3 / 4));
            this.rotateY.push(i * (9 / 4));
        }
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_DDLF_${index}.png`);
        this.flower.node.setPosition(this.posX[index], 16, 0);
        this.flower.node.eulerAngles = v3(35, -this.rotateY[index], 180);
        this.flower.node.scale = v3(0.6, 0.6, 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 左家打出去的牌
class LeftLieDiscard extends CardBase implements ICardBase {
    private maxIndex = 2;
    scale: number[] = [0.58, 0.55, 0.55];
    rotateY: number[] = [-107, -102, -102];

    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_DLLF_${index}.png`);
        this.flower.node.setPosition(-4, 16, 0);
        this.flower.node.eulerAngles = v3(-90, this.rotateY[index], -50);
        this.flower.node.scale = v3(this.scale[index], this.scale[index], 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 右家打出去的牌
class RightLieDiscard extends CardBase implements ICardBase {
    private maxIndex = 2;
    scale: number[] = [0.58, 0.55, 0.55];
    rotateY: number[] = [106, 102, 102];

    constructor(protected ctrl: MJCard) {
        super(ctrl);
    }
    setIndex(index: number = 0) {
        if (index > this.maxIndex || index < 0) return;
        this.back.spriteFrame = this.spriteAtlas.getSpriteFrame(`back_DRLF_${index}.png`);
        this.flower.node.setPosition(4, 16, 0);
        this.flower.node.eulerAngles = v3(-90, this.rotateY[index], 50);
        this.flower.node.scale = v3(this.scale[index], this.scale[index], 1);
        this.ctrl.node.getComponent(UITransform).setContentSize(this.back.node.getComponent(UITransform).contentSize);
    }
}

// 控制类
const CardCtrlMap = {
    Card2D,
    DownStand,
    UpStand,
    LeftStand,
    RightStand,
    DownLie,
    UpLie,
    LeftLie,
    RightLie,
    DownLieDiscard,
    UpLieDiscard,
    LeftLieDiscard,
    RightLieDiscard,
};