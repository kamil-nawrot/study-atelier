import { maskedSegments, noteText } from '@study-atelier/ui';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { noteTermsOf } from '#lib/glossary/note-terms/note-terms.ts';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { wrongNames } from '#lib/review/definitions/definitions.ts';
import { loadNoteGap } from '#lib/review/review-data/review-data.ts';
import { shuffleQuiz } from '#lib/review/quiz/quiz.ts';
import type { NoteGapItem } from '#lib/review/types/note-gap-item.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';

const PASSAGE_BREAK = /\n[ \t]*\n|\n(?=[ \t]*(?:[-*+]|\d+\.)[ \t])/;

export function notePassages(notes: string): string[] {
	return notes
		.split(PASSAGE_BREAK)
		.map((passage) =>
			passage
				.split('\n')
				.filter((line) => !/^\s*#/.test(line))
				.join('\n')
		)
		.map(noteText)
		.filter((text) => text !== '');
}

export function noteGapItem(
	artwork: WallArtwork,
	notes: string,
	glossary: readonly GlossaryTerm[],
	random: () => number = Math.random
): NoteGapItem | undefined {
	const passages = notePassages(notes);
	const found = glossary.flatMap((term) => {
		const [noteTerm] = noteTermsOf([term]);
		for (const passage of passages) {
			const segments = maskedSegments(passage, noteTerm);
			if (segments.some((segment) => segment.masked)) return [{ term, segments }];
		}
		return [];
	});
	if (found.length === 0) return undefined;
	const { term, segments } = found[Math.floor(random() * found.length)];
	const wrong = wrongNames(term, glossary, random);
	if (wrong.length < 3) return undefined;
	const options = [term.name, ...wrong].map((label) => ({ label }));
	return {
		mode: 'note_gap',
		artwork,
		term,
		segments,
		quiz: shuffleQuiz({ options, answer: 0 }, random)
	};
}

export async function drawNoteGap(
	enabled: boolean,
	scope: ReviewScope,
	shown: readonly WallArtwork[],
	artworks: ReadonlyMap<string, WallArtwork>,
	glossary: readonly GlossaryTerm[]
): Promise<NoteGapItem[]> {
	if (!enabled || glossary.length < 4) return [];
	const found = await loadNoteGap(
		scope,
		shown.map((artwork) => artwork.id)
	);
	const artwork = found && artworks.get(found.id);
	const item = artwork && noteGapItem(artwork, found.notes, glossary);
	return item ? [item] : [];
}
