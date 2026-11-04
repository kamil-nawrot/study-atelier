import type { TextSegment } from '@study-atelier/ui';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import type { Quiz } from './quiz.ts';

export type NoteGapItem = {
	mode: 'note_gap';
	artwork: WallArtwork;
	term: GlossaryTerm;
	segments: TextSegment[];
	quiz: Quiz;
};
