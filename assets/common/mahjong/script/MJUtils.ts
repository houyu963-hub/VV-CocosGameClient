export class MJUtils {
    /**
     * 获取推荐的三张换牌（同花色）
     * 选牌优先级：单张 > 对子 > 顺子 > 刻子中的牌
     * @returns 推荐的三张牌的id数组
     */
    public static getRecommendExchangeCards(handCards: number[]): number[] {
        if (handCards.length < 3) return [];

        // 按花色分类：万条筒（1-9, 11-19, 21-29）
        const wan = handCards.filter(id => id >= 1 && id <= 9);
        const tiao = handCards.filter(id => id >= 11 && id <= 19);
        const tong = handCards.filter(id => id >= 21 && id <= 29);

        // 对每个花色计算牌型
        const analyzeColorCards = (cards: number[]): {
            singles: number[],   // 单张
            pairs: number[],     // 对子里的牌
            sequences: number[], // 顺子里的牌
            triplets: number[]   // 刻子里的牌
        } => {
            const result = {
                singles: [],
                pairs: [],
                sequences: [],
                triplets: []
            };

            // 计算每个数字出现次数
            const counts = new Map<number, number>();
            cards.forEach(id => {
                counts.set(id, (counts.get(id) || 0) + 1);
            });

            // 标记顺子中的牌
            const usedInSequence = new Set<number>();
            // 获取基础值：条=10，筒=20
            const base = cards[0] >= 21 ? 20 : (cards[0] >= 11 ? 10 : 0);

            // 在当前花色范围内检测顺子 (1-7)
            for (let i = 1; i <= 7; i++) {
                const n1 = i + base;     // 如 11,12,13（条）或 21,22,23（筒）
                const n2 = i + 1 + base;
                const n3 = i + 2 + base;
                if (counts.get(n1) && counts.get(n2) && counts.get(n3)) {
                    // 找到顺子，记录实际的牌id
                    cards.filter(id => id >= n1 && id <= n3)
                        .forEach(id => usedInSequence.add(id));
                }
            }

            // 分类所有牌
            cards.forEach(id => {
                const count = counts.get(id);
                if (usedInSequence.has(id)) {
                    result.sequences.push(id);
                } else if (count === 1) {
                    result.singles.push(id);
                } else if (count === 2) {
                    result.pairs.push(id);
                } else if (count === 3) {
                    result.triplets.push(id);
                }
            });

            return result;
        };

        // 分析每个花色
        const wanAnalysis = analyzeColorCards(wan);
        const tiaoAnalysis = analyzeColorCards(tiao);
        const tongAnalysis = analyzeColorCards(tong);

        // 选择最优的三张牌（优先单张，数量不够从对子补，再从顺子刻子补）
        const selectThreeCards = (analysis: ReturnType<typeof analyzeColorCards>): number[] => {
            const result: number[] = [];

            // 先选单张
            result.push(...analysis.singles);
            if (result.length >= 3) return result.slice(0, 3);

            // 不够则选对子里的牌
            if (result.length < 3) {
                result.push(...analysis.pairs);
                if (result.length >= 3) return result.slice(0, 3);
            }

            // 还不够则选顺子/刻子里的牌
            if (result.length < 3) {
                result.push(...analysis.sequences, ...analysis.triplets);
                return result.slice(0, 3);
            }

            return result;
        };

        // 选择数量最多的花色
        let bestCards: number[] = [];
        let maxLen = Infinity;

        if (wan.length >= 3 && wan.length < maxLen) {
            bestCards = selectThreeCards(wanAnalysis);
            maxLen = wan.length;
        }
        if (tiao.length >= 3 && tiao.length < maxLen) {
            bestCards = selectThreeCards(tiaoAnalysis);
            maxLen = tiao.length;
        }
        if (tong.length >= 3 && tong.length < maxLen) {
            bestCards = selectThreeCards(tongAnalysis);
        }

        return bestCards;
    }

    // todo 能否吃、碰、杠、胡
}