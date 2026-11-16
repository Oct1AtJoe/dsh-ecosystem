import * as React from 'react';
import { type createHomeUsage } from './data.ts';
export interface HomeUsagePanelProps {
    usage: ReturnType<typeof createHomeUsage>;
    bookPick?: number;
    isHero?: boolean;
    layout?: string;
}
export declare function HomeUsagePanel({ usage, bookPick, isHero, layout, }: HomeUsagePanelProps): React.JSX.Element | null;
//# sourceMappingURL=HomeUsagePanel.d.ts.map