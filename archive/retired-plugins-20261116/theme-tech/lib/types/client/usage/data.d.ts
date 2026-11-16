import type { HeatCell, HomeModel, HomeUsageState, ListSummary, UsageDay, UsageModel, UsageReport, UsageTotals } from './types.ts';
export declare const USAGE_ROUTE = "/ui-theme-custom/usage";
export declare const HOME_POLL_MS = 1500;
export declare const HOME_POLL_MAX = 8;
export declare const HOME_HEAT_WEEKS = 26;
export declare const HOME_HEAT_STEPS = 4;
export declare const HOME_CHART_DAYS = 30;
export declare const HOME_MODEL_ROWS = 6;
export declare const HOME_BOOKS: {
    key: string;
    title: string;
    tokens: number;
}[];
export declare const HOME_RANGES: {
    id: string;
    label: string;
    days: number;
}[];
export declare function pad2(value: number): string;
export declare function homeDayKey(date: Date): string;
export declare function homeShortDate(day: string): string;
export declare function homeRangeStart(windowDays: number): string | null;
export declare function formatHomeCount(count: unknown): string;
export declare function formatCompactTokens(count: unknown): string;
export declare function formatHomeHour(hour: number): string;
export declare function homeDayTokens(day: UsageDay | UsageTotals | null | undefined): number;
export declare function homeModelTokens(entry: UsageModel): number;
export declare function homeHeatGrid(days: UsageDay[] | null | undefined): {
    cells: HeatCell[];
    peak: number;
};
export declare function homeModelList(value: UsageReport | null, listed: ListSummary | null, start?: string | null): HomeModel[] | null;
export declare function homeModelDays(value: UsageReport | null, windowDays: number): {
    date: string;
    models: Record<string, number>;
}[] | null;
export declare function homePanelData(state: HomeUsageState, listedRaw: ListSummary | null, range: string, bookPick: number): {
    listed: ListSummary | null;
    known: boolean;
    tokens: number;
    calls: number | null;
    sessions: number | null;
    activeDays: number | null;
    peakHour: string | null;
    model: string | null;
    grid: {
        cells: HeatCell[];
        peak: number;
    };
    fun: string | null;
    models: HomeModel[] | null;
    modelDays: {
        date: string;
        models: Record<string, number>;
    }[] | null;
};
export type HomePanel = ReturnType<typeof homePanelData>;
export declare function createHomeUsage(ctx: any): {
    state(): HomeUsageState;
    list(): ListSummary | null;
    listLoading(): boolean;
    subscribe: (listener: () => void) => () => void;
    notify: () => void;
    load: (force?: boolean) => void;
    setPollEnabled: (allowed: boolean) => void;
    loadList: () => void;
    stop(): void;
};
//# sourceMappingURL=data.d.ts.map