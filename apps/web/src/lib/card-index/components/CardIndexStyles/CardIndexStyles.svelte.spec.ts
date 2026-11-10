import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import CardIndexStyles from './CardIndexStyles.svelte';

const styles = [
	{ id: 's-nabis', name: 'Nabiści', count: 3 },
	{ id: 's-orphism', name: 'Orfizm', count: 1 }
];

describe('CardIndexStyles', () => {
	it('lists the styles as links to their pages with their numbers of artworks', async () => {
		render(CardIndexStyles, { props: { styles } });

		const nabis = page.getByRole('link', {
			name: m.cardIndex.openValue('Nabiści', m.atelier.count(3))
		});
		await expect.element(nabis).toHaveAttribute('href', '/atelier/values/style/s-nabis');
		await expect.element(nabis).toHaveTextContent(m.atelier.count(3));
		expect(page.getByRole('listitem').elements()).toHaveLength(2);
	});

	it('marks the styles nested under a period', async () => {
		render(CardIndexStyles, { props: { styles, id: 'styles-of-period', nested: true } });

		await expect.element(page.getByRole('list')).toHaveAttribute('id', 'styles-of-period');
		await expect.element(page.getByRole('list')).toHaveClass('nested');
	});
});
