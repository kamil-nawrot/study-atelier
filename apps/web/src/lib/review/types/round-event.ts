import type { EventQuestionKind } from './event-question-kind.ts';
import type { ExtraCard } from './extra-card.ts';

export type RoundEvent = { eventId: string; kind: EventQuestionKind; card: ExtraCard | null };
