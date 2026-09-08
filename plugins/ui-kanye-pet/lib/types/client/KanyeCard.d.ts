/** The kanye-pet card: desktop pet toggle, character, size/opacity. */
import type { ReactNode } from 'react';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { KanyeCardFace } from './kanye-card-controller.ts';
/** Props the renderer binds for the kanye-pet card. */
export type KanyeCardProps = PropsRuntime<'settings.plugins.tab'> & PropsLocale<'kanye-pet'> & InjectFace<KanyeCardFace>;
/** Render the kanye-pet card. */
export declare function KanyeCard(props: KanyeCardProps): ReactNode;
//# sourceMappingURL=KanyeCard.d.ts.map