import { Director, director, instantiate, Node, NodePool } from "cc";
import vv from "../Core";

/*
 * 节点池
 */
export class Pools {

    protected static nodes: Map<string, Node> = new Map();
    protected static pools: Map<string, NodePool> = new Map();

    constructor() {
        // 切换场景后清空对象池
        director.on(Director.EVENT_BEFORE_SCENE_LAUNCH, Pools.clearPool.bind(this));
    }

    /**
     * 是否存在某个池子
     * @param poolName 池子名字
     * @returns 
     */
    public static isExistPool(poolName: string): boolean {
        return this.pools.has(poolName);
    }

    /**
     * 创建一个池子
     * @param poolName 池子名字
     * @param node 向池子里添加的节点
     * @param num 添加几个（默认1个）
     */
    public static createPool(poolName: string, node: Node, num: number = 1): void {
        if (!this.pools.has(poolName)) {
            let pool = new NodePool();
            this.nodes.set(poolName, instantiate(node));
            this.pools.set(poolName, pool);
            for (let i = 0; i < num; i++) {
                this.pools.get(poolName).put(instantiate(node));
            }
        }
    }

    /**
     * 清空所有池子
     */
    public static clearPool(): void {
        this.pools.forEach(pool => {
            pool.clear();
        })
        this.nodes.clear();
        this.pools.clear();
    }

    /**
     * 清空池子（根据池子名字）
     * @param poolName 池子名字
     */
    public static clearPoolByName(poolName: string): void {
        let pool = this.pools.has(poolName);
        if (pool) {
            this.pools.get(poolName).clear();
            this.pools.delete(poolName);
        }
    }

    /**
     * 获取一个实例
     * @param poolName 池子名字
     * @returns 
     */
    public static get(poolName: string): Node {
        if (this.pools.has(poolName)) {
            let pool = this.pools.get(poolName);
            if (pool && pool.size() > 0) {
                let ins = pool.get();
                return ins;
            } else {
                let ins = instantiate(this.nodes.get(poolName)!);
                return ins;
            }
        }
        return null;
    }

    /**
     * 回收一个实例
     * @param poolName 池子名字
     * @param nodeRes 回收的节点
     */
    public static put(poolName: string, nodeRes: Node | Node[]) {
        if (this.pools.has(poolName)) {
            let pool = this.pools.get(poolName);
            if (nodeRes instanceof Array) {
                nodeRes.forEach(node => {
                    pool.put(node);
                })
            } else {
                pool.put(nodeRes);
            }
        } else {
            vv.logger.error('不存在池子：' + poolName);
        }
    }

}
