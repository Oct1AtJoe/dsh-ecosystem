import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type DiffHunk } from './DiffBlock.tsx';
export interface ToolBlockShape {
    readonly kind?: string;
    readonly isError?: boolean;
    readonly error?: {
        readonly code?: string;
    };
    readonly resultText?: string;
    readonly meta?: {
        readonly diffs?: readonly DiffHunk[];
    };
    readonly call?: {
        readonly argsRaw?: string;
    };
    readonly argsRaw?: string;
    readonly callId?: string;
}
export interface ToolCallOwnerProps {
    readonly callId: string;
    readonly toolName: string;
    readonly block: ToolBlockShape;
    readonly cwd?: string;
    readonly home?: string;
    readonly openFile: (path: string) => void;
    readonly inspect?: () => void;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        'tool.call.toolview': {
            kind: 'keyed';
            scope: 'session';
            owner: ToolCallOwnerProps;
        };
    }
}
export type ToolMutationRowProps = PropsRuntime<'tool.call.toolview'> & PropsLocale<'conversation'>;
export declare function ToolMutationRow({ toolName, block, cwd, openFile, inspect, t, }: ToolMutationRowProps): import("react").JSX.Element;
//# sourceMappingURL=ToolMutationRow.d.ts.map