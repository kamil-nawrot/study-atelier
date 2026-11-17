import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import {
	loadSymbolQuestionImages,
	loadSymbolQuestionPins
} from '#lib/symbols/symbol-questions-data/symbol-questions-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';
import { loadSymbolSteps } from './symbol-steps.ts';

vi.mock('#lib/symbols/symbol-questions-data/symbol-questions-data.ts', () => ({
	loadSymbolQuestionPins: vi.fn(),
	loadSymbolQuestionImages: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ loadSymbolOptions: vi.fn() }));
vi.mock('#lib/pins/fragment-lenses/fragment-lenses.ts', () => ({
	fragmentLenses: vi.fn().mockResolvedValue(new Map())
}));

const names = ['Keys', 'Lily', 'Skull', 'Dove', 'Globe'];
const symbols = names.map((name) => ({ id: name, name, meanings: [] }));
const pin = {
	pinId: 'pin-1',
	symbolId: 'symbol-keys',
	symbolName: 'Keys',
	fragment: { pinId: 'pin-1', artworkId: 'a', x: 0, y: 0, viewWidth: 0.1, text: '' }
};
const picked = [{ symbolId: 'symbol-keys', pinId: 'pin-1', kind: 'symbol' as const, card: null }];

describe('symbol steps', () => {
	beforeEach(() => {
		vi.mocked(loadSymbolQuestionPins).mockResolvedValue({ pins: [pin] });
		vi.mocked(loadSymbolOptions).mockResolvedValue({ symbols });
		vi.mocked(loadSymbolQuestionImages).mockResolvedValue(new Map());
	});

	it('loads nothing when the round picked no symbol', async () => {
		await expect(loadSymbolSteps([], [])).resolves.toEqual([]);
		expect(loadSymbolQuestionPins).not.toHaveBeenCalled();
	});

	it('builds the picked questions as session steps from the pins of the round', async () => {
		const [step] = await loadSymbolSteps(picked, [] as GlossaryTerm[]);

		expect(step).toMatchObject({ mode: 'quiz_symbol', kind: 'symbol', key: 'pin-1:symbol' });
		expect(step.quiz.options).toHaveLength(4);
		expect(loadSymbolQuestionPins).toHaveBeenCalledWith(['pin-1']);
		expect(loadSymbolQuestionImages).toHaveBeenCalledWith(['pin-1']);
	});

	it('runs without the questions when their images cannot be loaded', async () => {
		vi.mocked(loadSymbolQuestionImages).mockResolvedValue(undefined);

		await expect(loadSymbolSteps(picked, [])).resolves.toEqual([]);
	});

	it('runs without the questions when a load fails', async () => {
		vi.mocked(loadSymbolOptions).mockResolvedValue({ symbols: [], error: 'Brak sieci.' });

		await expect(loadSymbolSteps(picked, [])).resolves.toEqual([]);
	});
});
