import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { loadSymbolCover } from '#lib/symbols/symbol-cover-data/symbol-cover-data.ts';
import type { SymbolOption } from '#lib/symbols/types/symbol-option.ts';
import SymbolFigure from './SymbolFigure.svelte';

vi.mock('#lib/symbols/symbol-cover-data/symbol-cover-data.ts', () => ({
	loadSymbolCover: vi.fn()
}));

const skull: SymbolOption = {
	id: 's1',
	name: 'Skull',
	coverPinId: 'pin-1',
	meanings: [
		{ id: 'm1', text: 'transience, death' },
		{ id: 'm2', text: 'penance' }
	]
};

const lens = {
	crop: 'https://images.test/crop.jpg',
	thumbnail: { left: 0, top: 0, width: 100, height: 100 }
};

describe('SymbolFigure', () => {
	beforeEach(() => {
		vi.mocked(loadSymbolCover).mockReset().mockResolvedValue({ lens });
	});

	it('shows the main detail, the name and every meaning numbered', async () => {
		const { container } = await render(SymbolFigure, { symbolId: 's1', symbols: [skull] });

		await expect
			.element(page.getByRole('complementary', { name: m.exhibitions.blocks.symbolOf('Skull') }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Skull', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('transience, death')).toBeInTheDocument();
		await expect.element(page.getByText('penance')).toBeInTheDocument();
		await vi.waitFor(() => expect(container.querySelector('img')?.src).toBe(lens.crop));
		expect(loadSymbolCover).toHaveBeenCalledWith('s1', 'pin-1', undefined);
		expect(container.querySelectorAll('.number')).toHaveLength(2);
		await expect
			.element(page.getByRole('link', { name: m.symbols.card.open }))
			.not.toBeInTheDocument();
	});

	it('narrows the card to the chosen meaning and its detail', async () => {
		const { container } = await render(SymbolFigure, {
			symbolId: 's1',
			meaningId: 'm2',
			symbols: [skull]
		});

		await expect.element(page.getByText('penance')).toBeInTheDocument();
		await expect.element(page.getByText('transience, death')).not.toBeInTheDocument();
		expect(container.querySelector('.number')).toBeNull();
		await vi.waitFor(() => expect(loadSymbolCover).toHaveBeenCalledWith('s1', 'pin-1', 'm2'));
	});

	it('shows all meanings when the chosen one is gone', async () => {
		render(SymbolFigure, { symbolId: 's1', meaningId: 'removed', symbols: [skull] });

		await expect.element(page.getByText('transience, death')).toBeInTheDocument();
		await expect.element(page.getByText('penance')).toBeInTheDocument();
	});

	it('shows no lens when the symbol has no detail with a loupe view', async () => {
		vi.mocked(loadSymbolCover).mockResolvedValue({});
		const { container } = await render(SymbolFigure, { symbolId: 's1', symbols: [skull] });

		await expect.element(page.getByText('Skull', { exact: true })).toBeInTheDocument();
		await vi.waitFor(() => expect(loadSymbolCover).toHaveBeenCalled());
		expect(container.querySelector('.cover')).toBeNull();
	});

	it('links to the atlas when viewed', async () => {
		render(SymbolFigure, { symbolId: 's1', symbols: [skull], linked: true });

		await expect
			.element(page.getByRole('link', { name: m.symbols.card.open }))
			.toHaveAttribute('href', '/atelier/glossary/symbols/s1');
	});

	it('says when the symbol is gone from the atlas', async () => {
		render(SymbolFigure, { symbolId: 'gone', symbols: [skull] });

		await expect.element(page.getByText(m.symbols.card.deleted)).toBeInTheDocument();
		expect(loadSymbolCover).not.toHaveBeenCalled();
	});
});
