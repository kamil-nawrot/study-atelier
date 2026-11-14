import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GlossaryTerm } from '#lib/glossary/types/glossary-term.ts';
import { loadSymbolQuestionPins } from '#lib/symbols/symbol-questions-data/symbol-questions-data.ts';
import { loadSymbolOptions } from '#lib/symbols/symbols-data/symbols-data.ts';
import { loadSymbolSteps } from './symbol-steps.ts';

vi.mock('#lib/symbols/symbol-questions-data/symbol-questions-data.ts', () => ({
	loadSymbolQuestionPins: vi.fn()
}));
vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({ loadSymbolOptions: vi.fn() }));
vi.mock('#lib/pins/fragment-lenses/fragment-lenses.ts', () => ({
	fragmentLenses: vi.fn().mockResolvedValue(new Map())
}));

const names = ['Keys', 'Lily', 'Skull', 'Dove', 'Globe'];
const symbols = names.map((name) => ({ id: name, name, meanings: [] }));
const pin = {
	pinId: 'pin-1',
	symbolName: 'Keys',
	fragment: { pinId: 'pin-1', artworkId: 'a', x: 0, y: 0, viewWidth: 0.1, text: '', image: null }
};

describe('symbol steps', () => {
	beforeEach(() => {
		vi.mocked(loadSymbolQuestionPins).mockResolvedValue({ pins: [pin] });
		vi.mocked(loadSymbolOptions).mockResolvedValue({ symbols });
	});

	it('loads nothing for a count of zero', async () => {
		await expect(loadSymbolSteps(0, [])).resolves.toEqual([]);
		expect(loadSymbolQuestionPins).not.toHaveBeenCalled();
	});

	it('builds the drawn questions as session steps', async () => {
		const [step] = await loadSymbolSteps(1, [] as GlossaryTerm[]);

		expect(step).toMatchObject({ mode: 'quiz_symbol', kind: 'symbol', key: 'pin-1:symbol' });
		expect(step.quiz.options).toHaveLength(4);
	});

	it('runs without the questions when a load fails', async () => {
		vi.mocked(loadSymbolOptions).mockResolvedValue({ symbols: [], error: 'Brak sieci.' });

		await expect(loadSymbolSteps(1, [])).resolves.toEqual([]);
	});
});
