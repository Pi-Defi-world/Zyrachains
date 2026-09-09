import { PriceSource, AggregatedPrice } from '../types';
export declare class PriceAggregator {
    private sources;
    addSource(source: PriceSource): void;
    getAggregatedPrice(): Promise<AggregatedPrice>;
    private fetchAllPrices;
    private removeOutliers;
    private calculateAggregatedPrice;
    getAllSourceStatuses(): import("../types").SourceStatus[];
}
//# sourceMappingURL=aggregator.d.ts.map