import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';

export type DefinedTerm = GlossaryTerm & { definition: string };
