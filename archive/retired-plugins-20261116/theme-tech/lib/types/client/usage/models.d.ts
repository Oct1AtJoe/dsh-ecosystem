import * as React from 'react';
import type { HomePanel } from './data.ts';
export declare function ModelChart({ columns, rankOf, skeleton, }: {
    columns: HomePanel['modelDays'];
    rankOf: Record<string, number>;
    skeleton: boolean;
}): React.JSX.Element;
export declare function ModelsView({ data }: {
    data: HomePanel;
}): React.JSX.Element;
//# sourceMappingURL=models.d.ts.map