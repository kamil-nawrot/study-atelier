import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { deleteValue, loadCardIndex, saveValue } from '#lib/collection/card-index-data.ts';
import type { CardIndexData } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testSession } from '#lib/testing/auth.ts';
import ValuesPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/collection/card-index-data.ts', () => ({
	loadCardIndex: vi.fn(),
	saveValue: vi.fn(),
	deleteValue: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

function renderValues(index: CardIndexData = testCardIndex(), error?: string): void {
	render(ValuesPage, { data: { session: testSession(), index, error }, params: {} });
}

function openValue(name: string, count: number): ReturnType<typeof page.getByRole> {
	return page
		.getByRole('button', {
			name: m.cardIndex.openValue(name, m.atelier.count(count)),
			exact: true
		})
		.first();
}

const valueDialog = (title: string): ReturnType<typeof page.getByRole> =>
	page.getByRole('dialog', { name: title });

describe('card index page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
		vi.mocked(saveValue).mockResolvedValue({});
		vi.mocked(deleteValue).mockResolvedValue({});
		vi.mocked(loadCardIndex).mockResolvedValue({ index: testCardIndex() });
	});

	it('shows the timeline of eras with periods, styles and their numbers of artworks', async () => {
		renderValues();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.cardIndex.title);
		for (const era of Object.values(m.eras)) {
			await expect.element(page.getByRole('heading', { name: era.name })).toBeVisible();
		}
		await expect.element(openValue('Classical', 3)).toBeVisible();
		await expect.element(openValue('Doric', 2)).toBeVisible();
		await expect.element(openValue('Gothic', 2)).toBeVisible();
		await expect.element(page.getByText(m.cardIndex.emptyEra).first()).toBeVisible();
	});

	it('shows the periods without an era and the styles without a period', async () => {
		renderValues();

		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.periodsWithoutEra }))
			.toBeVisible();
		await expect.element(openValue('Orphan', 0)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: m.cardIndex.stylesWithoutPeriod }))
			.toBeVisible();
		await expect.element(openValue('Loose', 0)).toBeVisible();
	});

	it('hides the groups without values', async () => {
		renderValues({ values: [], periodEras: [], stylePeriods: [] });

		await expect.element(page.getByText(m.cardIndex.emptyTimeline)).toBeVisible();
		expect(page.getByText(m.cardIndex.periodsWithoutEra).elements()).toHaveLength(0);
		expect(page.getByText(m.cardIndex.stylesWithoutPeriod).elements()).toHaveLength(0);
	});

	it('lists materials, authors and places alphabetically in their tabs', async () => {
		renderValues();

		await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
		const items = page.getByRole('tabpanel').getByRole('listitem');
		await expect.element(items.first()).toHaveTextContent('Bronze');
		await expect.element(items.last()).toHaveTextContent('Marble');
		await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();
		await expect.element(openValue('Phidias', 1)).toBeVisible();
		await page.getByRole('tab', { name: m.cardIndex.tabs.location }).click();
		await expect.element(openValue('Athens', 2)).toBeVisible();
	});

	it('says a list is empty', async () => {
		renderValues({ values: [], periodEras: [], stylePeriods: [] });

		await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();

		await expect.element(page.getByText(m.cardIndex.emptyList.author)).toBeVisible();
	});

	it('shows a loading error instead of the tabs', async () => {
		renderValues(testCardIndex(), m.collectionErrors.network);

		await expect.element(page.getByText(m.cardIndex.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.collectionErrors.network)).toBeVisible();
		expect(page.getByRole('tablist').elements()).toHaveLength(0);
	});

	it('links back to the atelier', async () => {
		renderValues();

		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.artworkView.back }))
			.toHaveAttribute('href', '/atelier');
	});

	describe('value dialog', () => {
		it('opens with the name, the kind and the number of artworks', async () => {
			renderValues();

			await openValue('Doric', 2).click();

			const dialog = valueDialog('Doric');
			await expect
				.element(dialog.getByText(m.cardIndex.dialog.description('Styl', m.atelier.count(2))))
				.toBeVisible();
			await expect.element(dialog.getByLabelText(m.cardIndex.dialog.name)).toHaveValue('Doric');
			await expect.element(dialog.getByText('Classical', { exact: true })).toBeVisible();
		});

		it('saves nothing until the learner changes something', async () => {
			renderValues();

			await openValue('Doric', 2).click();

			await expect
				.element(valueDialog('Doric').getByRole('button', { name: m.cardIndex.dialog.save }))
				.toBeDisabled();
		});

		it('renames a value and confirms with a toast', async () => {
			vi.mocked(loadCardIndex).mockResolvedValue({
				index: {
					...testCardIndex(),
					values: testCardIndex().values.map((value) =>
						value.id === 'style-doric' ? { ...value, name: 'Doric order' } : value
					)
				}
			});
			renderValues();

			await openValue('Doric', 2).click();
			const dialog = valueDialog('Doric');
			await dialog.getByLabelText(m.cardIndex.dialog.name).fill('Doric order');
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({
					record: expect.objectContaining({ id: 'style-doric' }),
					name: 'Doric order'
				})
			);
			await expect.element(page.getByText(m.cardIndex.saved('Doric order'))).toBeVisible();
			await expect.element(openValue('Doric order', 2)).toBeVisible();
			await expect.element(valueDialog('Doric')).not.toBeInTheDocument();
		});

		it('requires a name', async () => {
			renderValues();

			await openValue('Doric', 2).click();
			const dialog = valueDialog('Doric');
			await dialog.getByLabelText(m.cardIndex.dialog.name).fill('');

			await expect.element(dialog.getByText(m.cardIndex.dialog.nameRequired)).toBeVisible();
			await expect
				.element(dialog.getByRole('button', { name: m.cardIndex.dialog.save }))
				.toBeDisabled();
		});

		it('offers to merge when the name matches another value, and asks first', async () => {
			renderValues();

			await openValue('Doric', 2).click();
			const dialog = valueDialog('Doric');
			await dialog.getByLabelText(m.cardIndex.dialog.name).fill('ionic');

			await expect
				.element(
					dialog.getByText(m.cardIndex.dialog.mergeHint('styl', 'Ionic', m.atelier.count(1)))
				)
				.toBeVisible();
			await dialog.getByRole('button', { name: m.cardIndex.dialog.merge }).click();

			const confirm = page.getByRole('alertdialog', {
				name: m.cardIndex.mergeConfirm.title('Doric', 'Ionic')
			});
			await expect
				.element(
					confirm.getByText(
						m.cardIndex.mergeConfirm.assigned(
							'Doric',
							'Ionic',
							2,
							m.cardIndex.kinds.style.genitive
						),
						{ exact: false }
					)
				)
				.toBeVisible();
			await expect
				.element(confirm.getByText(m.cardIndex.mergeConfirm.irreversible, { exact: false }))
				.toBeVisible();
			expect(saveValue).not.toHaveBeenCalled();
			await confirm.getByRole('button', { name: m.cardIndex.mergeConfirm.confirm }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({
					record: expect.objectContaining({ id: 'style-doric' }),
					mergeInto: expect.objectContaining({ id: 'style-ionic' })
				})
			);
			await expect.element(page.getByText(m.cardIndex.merged('Ionic'))).toBeVisible();
		});

		it('keeps the values when the learner backs out of a merge', async () => {
			renderValues();

			await openValue('Doric', 2).click();
			await valueDialog('Doric').getByLabelText(m.cardIndex.dialog.name).fill('Ionic');
			await valueDialog('Doric').getByRole('button', { name: m.cardIndex.dialog.merge }).click();
			await page.getByRole('button', { name: m.cardIndex.mergeConfirm.back }).click();

			expect(saveValue).not.toHaveBeenCalled();
			await expect.element(valueDialog('Doric')).toBeVisible();
		});

		it('shows an error in the dialog when saving fails', async () => {
			vi.mocked(saveValue).mockResolvedValue({ error: m.cardIndex.errors.network });
			renderValues();

			await openValue('Doric', 2).click();
			const dialog = valueDialog('Doric');
			await dialog.getByLabelText(m.cardIndex.dialog.name).fill('Doric order');
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			await expect.element(dialog.getByText(m.cardIndex.errors.network)).toBeVisible();
			expect(loadCardIndex).not.toHaveBeenCalled();
		});

		it('closes without saving on cancel', async () => {
			renderValues();

			await openValue('Doric', 2).click();
			await valueDialog('Doric').getByRole('button', { name: m.cardIndex.dialog.cancel }).click();

			await expect.element(valueDialog('Doric')).not.toBeInTheDocument();
			expect(saveValue).not.toHaveBeenCalled();
		});

		it('adds an era to a period without asking', async () => {
			renderValues();

			await openValue('Classical', 3).click();
			const dialog = valueDialog('Classical');
			await dialog.getByLabelText(m.cardIndex.dialog.addEra).selectOptions(m.eras.middle_ages.name);
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({ eraCodes: ['antiquity', 'middle_ages', 'early_modern'] })
			);
		});

		it('asks where the artworks go when an era is removed from a period', async () => {
			renderValues();

			await openValue('Classical', 3).click();
			const dialog = valueDialog('Classical');
			await dialog
				.getByRole('button', { name: m.cardIndex.dialog.removeEra(m.eras.antiquity.name) })
				.click();
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			const confirm = page.getByRole('alertdialog', { name: m.cardIndex.moveConfirm.title });
			await expect
				.element(
					confirm.getByText(
						m.cardIndex.moveConfirm.toEra(
							'Classical',
							m.eras.antiquity.name,
							2,
							m.eras.early_modern.name
						)
					)
				)
				.toBeVisible();
			expect(saveValue).not.toHaveBeenCalled();
			await confirm.getByRole('button', { name: m.cardIndex.moveConfirm.confirm }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({ eraCodes: ['early_modern'] })
			);
		});

		it('lets the learner pick the era when the period keeps several', async () => {
			renderValues();

			await openValue('Classical', 3).click();
			const dialog = valueDialog('Classical');
			await dialog.getByLabelText(m.cardIndex.dialog.addEra).selectOptions(m.eras.middle_ages.name);
			await dialog
				.getByRole('button', { name: m.cardIndex.dialog.removeEra(m.eras.antiquity.name) })
				.click();
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			const confirm = page.getByRole('alertdialog', { name: m.cardIndex.moveConfirm.title });
			await confirm.getByRole('button', { name: m.cardIndex.moveConfirm.confirm }).click();
			await expect.element(confirm.getByText(m.cardIndex.moveConfirm.pickRequired)).toBeVisible();
			expect(saveValue).not.toHaveBeenCalled();
			await confirm
				.getByLabelText(m.cardIndex.moveConfirm.pick)
				.selectOptions(m.eras.middle_ages.name);
			await confirm.getByRole('button', { name: m.cardIndex.moveConfirm.confirm }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({
					eraCodes: ['middle_ages', 'early_modern'],
					moveTo: 'middle_ages'
				})
			);
		});

		it('says the artworks lose their era when the period keeps none', async () => {
			renderValues();

			await openValue('Gothic', 2).click();
			const dialog = valueDialog('Gothic');
			await dialog
				.getByRole('button', { name: m.cardIndex.dialog.removeEra(m.eras.middle_ages.name) })
				.click();
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			await expect
				.element(
					page
						.getByRole('alertdialog')
						.getByText(m.cardIndex.moveConfirm.toNone('Gothic', m.eras.middle_ages.name, 2))
				)
				.toBeVisible();
		});

		it('removes an era nobody uses without asking', async () => {
			renderValues();

			await openValue('Gothic', 2).click();
			const dialog = valueDialog('Gothic');
			await dialog.getByLabelText(m.cardIndex.dialog.addEra).selectOptions(m.eras.modern.name);
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			expect(page.getByRole('alertdialog').elements()).toHaveLength(0);
			expect(saveValue).toHaveBeenCalled();
		});

		it('keeps a period of a style that an artwork still uses together with it', async () => {
			renderValues();

			await openValue('Doric', 2).click();
			const dialog = valueDialog('Doric');

			await expect
				.element(dialog.getByRole('button', { name: m.cardIndex.dialog.removePeriod('Classical') }))
				.toBeDisabled();
			await expect
				.element(dialog.getByText(m.cardIndex.dialog.periodLocked('Classical', 2)))
				.toBeVisible();
		});

		it('removes and adds periods of a style', async () => {
			renderValues();

			await openValue('Ionic', 1).click();
			const dialog = valueDialog('Ionic');
			await dialog.getByRole('button', { name: m.cardIndex.dialog.removePeriod('Gothic') }).click();
			await dialog.getByRole('button', { name: m.cardIndex.dialog.save }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({ periodIds: ['period-classical'] })
			);
		});

		it('explains why a used value cannot be deleted in a tooltip on the button', async () => {
			renderValues();

			await openValue('Doric', 2).click();
			const dialog = valueDialog('Doric');
			const blocked = m.cardIndex.dialog.deleteBlocked(
				m.cardIndex.kinds.style.demonstrative,
				m.atelier.count(2),
				m.cardIndex.kinds.style.other
			);

			await expect.element(dialog.getByText(blocked)).not.toBeVisible();
			await dialog.getByRole('button', { name: m.cardIndex.dialog.delete, exact: true }).hover();
			await expect.element(dialog.getByRole('tooltip')).toHaveTextContent(blocked);
			await expect.element(dialog.getByRole('tooltip')).toBeVisible();
		});

		it('describes the merge of a period with the artworks it gets and the links it adds', async () => {
			renderValues();

			await openValue('Gothic', 2).click();
			await valueDialog('Gothic').getByLabelText(m.cardIndex.dialog.name).fill('classical');
			await valueDialog('Gothic').getByRole('button', { name: m.cardIndex.dialog.merge }).click();

			const confirm = page.getByRole('alertdialog', {
				name: m.cardIndex.mergeConfirm.title('Gothic', 'Classical')
			});
			await expect
				.element(
					confirm.getByText(m.cardIndex.mergeConfirm.periodAssigned('Gothic', 'Classical', 2), {
						exact: false
					})
				)
				.toBeVisible();
			await expect
				.element(
					confirm.getByText(m.cardIndex.mergeConfirm.periodLinks('Gothic', 'Classical'), {
						exact: false
					})
				)
				.toBeVisible();
		});

		it('says only the card index changes when nobody uses the merged value', async () => {
			renderValues();

			await openValue('Loose', 0).click();
			await valueDialog('Loose').getByLabelText(m.cardIndex.dialog.name).fill('Ionic');
			await valueDialog('Loose').getByRole('button', { name: m.cardIndex.dialog.merge }).click();

			await expect
				.element(
					page
						.getByRole('alertdialog')
						.getByText(m.cardIndex.mergeConfirm.unused('Loose'), { exact: false })
				)
				.toBeVisible();
		});

		it('deletes an unused value after the learner confirms', async () => {
			renderValues();

			await openValue('Loose', 0).click();
			await valueDialog('Loose')
				.getByRole('button', { name: m.cardIndex.dialog.delete, exact: true })
				.click();
			const confirm = page.getByRole('alertdialog', {
				name: m.cardIndex.deleteConfirm.title('styl', 'Loose')
			});
			await expect.element(confirm.getByText(m.cardIndex.deleteConfirm.description)).toBeVisible();
			expect(deleteValue).not.toHaveBeenCalled();
			await confirm.getByRole('button', { name: m.cardIndex.deleteConfirm.confirm }).click();

			expect(deleteValue).toHaveBeenCalledWith('style-loose');
			await expect.element(page.getByText(m.cardIndex.deleted('Loose'))).toBeVisible();
		});

		it('shows an error when deleting fails', async () => {
			vi.mocked(deleteValue).mockResolvedValue({ error: m.cardIndex.errors.changed });
			renderValues();

			await openValue('Loose', 0).click();
			await valueDialog('Loose')
				.getByRole('button', { name: m.cardIndex.dialog.delete, exact: true })
				.click();
			await page
				.getByRole('alertdialog')
				.getByRole('button', { name: m.cardIndex.deleteConfirm.confirm })
				.click();

			await expect
				.element(valueDialog('Loose').getByText(m.cardIndex.errors.changed))
				.toBeVisible();
		});

		it('works for materials too, without links', async () => {
			renderValues();

			await page.getByRole('tab', { name: m.cardIndex.tabs.material }).click();
			await openValue('Bronze', 0).click();
			const dialog = valueDialog('Bronze');

			await expect
				.element(dialog.getByText(m.cardIndex.dialog.description('Materiał', m.atelier.count(0))))
				.toBeVisible();
			expect(dialog.getByText(m.cardIndex.dialog.eras).elements()).toHaveLength(0);
			expect(dialog.getByText(m.cardIndex.dialog.periods).elements()).toHaveLength(0);
			await expect
				.element(dialog.getByRole('button', { name: m.cardIndex.dialog.delete, exact: true }))
				.toBeEnabled();
		});
	});
});
