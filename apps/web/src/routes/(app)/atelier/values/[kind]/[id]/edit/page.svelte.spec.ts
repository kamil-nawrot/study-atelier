import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { beforeNavigate, goto } from '$app/navigation';
import {
	loadValuePageContent,
	saveValue
} from '#lib/card-index/card-index-data/card-index-data.ts';
import { findRecord } from '#lib/card-index/card-index/card-index.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { ValueSubject } from '#lib/card-index/types/value-subject.ts';
import { emptyAuthorDetails } from '#lib/values/author-form/author-form.ts';
import { emptyValueDetails } from '#lib/values/value-details/value-details.ts';
import { saveValueDetails } from '#lib/values/value-details-data/value-details-data.ts';
import { m } from '#lib/i18n/index.ts';
import { testCardIndex } from '#lib/testing/card-index.ts';
import { testSession } from '#lib/testing/auth.ts';
import EditValuePage from './+page.svelte';

vi.mock('$app/navigation', () => ({
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	goto: vi.fn()
}));
vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({
	saveValue: vi.fn(),
	loadValuePageContent: vi.fn()
}));
vi.mock('#lib/values/value-details-data/value-details-data.ts', async (importOriginal) => ({
	...(await importOriginal<
		typeof import('#lib/values/value-details-data/value-details-data.ts')
	>()),
	saveValueDetails: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

function subjectOf(id: string): ValueSubject {
	const record = findRecord(testCardIndex(), id);
	if (!record) throw new Error(`no test value ${id}`);
	return { kind: record.category, record };
}

function renderEdit(
	subject: ValueSubject | undefined,
	details: ValueDetails = emptyValueDetails(),
	failure: { error?: string; notFound?: boolean } = {}
): void {
	render(EditValuePage, {
		data: {
			session: testSession(),
			subject,
			index: testCardIndex(),
			artworks: [],
			details,
			...failure
		},
		params: { kind: subject?.kind ?? 'style', id: 'unknown' }
	});
}

function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.valueForm.save, exact: true });
}

function nameField(): ReturnType<typeof page.getByRole> {
	return page.getByLabelText(m.valueForm.name);
}

type Leave = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

function leave(): Leave {
	const navigation = {
		type: 'link',
		to: { url: new URL('http://localhost/atelier/values') },
		cancel: vi.fn()
	};
	const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
	guard(navigation as unknown as Leave);
	return navigation as unknown as Leave;
}

describe('edit value page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 800);
		vi.mocked(saveValue).mockResolvedValue({});
		vi.mocked(saveValueDetails).mockResolvedValue({});
		vi.mocked(loadValuePageContent).mockResolvedValue({ content: { hasContent: false } });
	});

	it('names the value in the title and fills the form', async () => {
		renderEdit(subjectOf('style-doric'), { summary: 'Plain capitals.', notes: '' });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.valueForm.editTitle('styl', 'Doric'));
		await expect.element(nameField()).toHaveValue('Doric');
		await expect.element(page.getByText('Classical', { exact: true })).toBeVisible();
		await expect.element(page.getByLabelText(m.valueForm.summary)).toHaveValue('Plain capitals.');
		await expect.element(page.getByText('15/300', { exact: false })).toBeVisible();
	});

	it('saves the summary and notes, then shows the page with a toast', async () => {
		renderEdit(subjectOf('style-doric'));

		await page.getByLabelText(m.valueForm.summary).fill('Plain capitals.');
		await saveButton().click();

		expect(saveValueDetails).toHaveBeenCalledWith(
			subjectOf('style-doric'),
			{ summary: 'Plain capitals.', notes: '' },
			emptyValueDetails()
		);
		expect(goto).toHaveBeenCalledWith('/atelier/values/style/style-doric', {
			replace: true,
			refreshAll: true,
			state: { valueMessage: m.valuePage.saved }
		});
	});

	it('does not save the details when only the name changed', async () => {
		renderEdit(subjectOf('style-doric'));

		await nameField().fill('Doric order');
		await saveButton().click();

		expect(saveValueDetails).not.toHaveBeenCalled();
		expect(saveValue).toHaveBeenCalledWith(
			expect.objectContaining({
				record: expect.objectContaining({ id: 'style-doric' }),
				name: 'Doric order'
			})
		);
	});

	it('requires a name', async () => {
		renderEdit(subjectOf('style-doric'));

		await nameField().fill('');
		await saveButton().click();

		await expect.element(page.getByText(m.valueForm.nameRequired)).toBeVisible();
		expect(saveValue).not.toHaveBeenCalled();
	});

	it('shows an error at the top when saving fails and stays on the form', async () => {
		vi.mocked(saveValue).mockResolvedValue({ error: m.cardIndex.errors.network });
		renderEdit(subjectOf('style-doric'));

		await nameField().fill('Doric order');
		await saveButton().click();

		await expect.element(page.getByText(m.valueForm.errorTitle)).toBeVisible();
		await expect.element(page.getByText(m.cardIndex.errors.network)).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('does not change the name when saving the details fails', async () => {
		vi.mocked(saveValueDetails).mockResolvedValue({ error: m.cardIndex.errors.network });
		renderEdit(subjectOf('style-doric'));

		await nameField().fill('Doric order');
		await page.getByLabelText(m.valueForm.summary).fill('Plain capitals.');
		await saveButton().click();

		await expect.element(page.getByText(m.cardIndex.errors.network)).toBeVisible();
		expect(saveValue).not.toHaveBeenCalled();
	});

	it('asks before discarding changes', async () => {
		renderEdit(subjectOf('style-doric'));
		await page.getByLabelText(m.valueForm.summary).fill('Plain capitals.');

		const navigation = leave();

		expect(navigation.cancel).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alertdialog', { name: m.artworkForm.discardTitle }))
			.toBeVisible();
		await expect.element(page.getByText(m.valueForm.discardDescription)).toBeVisible();
	});

	it('leaves without asking when nothing changed', async () => {
		renderEdit(subjectOf('style-doric'));

		const navigation = leave();

		expect(navigation.cancel).not.toHaveBeenCalled();
	});

	it('shows the summary hint as a placeholder and no delete button', async () => {
		renderEdit(subjectOf('style-loose'));

		await expect
			.element(page.getByLabelText(m.valueForm.summary))
			.toHaveAttribute('placeholder', m.valueForm.summaryPlaceholder);
		expect(page.getByRole('button', { name: m.valuePage.delete }).elements()).toHaveLength(0);
	});

	it('links Anuluj back to the value page', async () => {
		renderEdit(subjectOf('material-marble'));

		await expect
			.element(page.getByRole('link', { name: m.valueForm.cancel }))
			.toHaveAttribute('href', '/atelier/values/material/material-marble');
	});

	it('gives an era only a summary and notes', async () => {
		renderEdit({ kind: 'era', code: 'antiquity' });

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.valueForm.editTitle('epokę', m.eras.antiquity.name));
		await expect.element(page.getByLabelText(m.valueForm.summary)).toBeVisible();
		expect(nameField().elements()).toHaveLength(0);

		await page.getByLabelText(m.valueForm.summary).fill('Greece and Rome.');
		await saveButton().click();

		expect(saveValueDetails).toHaveBeenCalledWith(
			{ kind: 'era', code: 'antiquity' },
			{ summary: 'Greece and Rome.', notes: '' },
			emptyValueDetails()
		);
		expect(saveValue).not.toHaveBeenCalled();
		expect(goto).toHaveBeenCalledWith('/atelier/values/era/antiquity', {
			replace: true,
			refreshAll: true,
			state: { valueMessage: m.valuePage.saved }
		});
	});

	it('says the value does not exist', async () => {
		renderEdit(undefined, emptyValueDetails(), {
			error: m.valuePage.notFound,
			notFound: true
		});

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.valuePage.notFoundTitle);
		await expect.element(page.getByText(m.valuePage.notFound)).toBeVisible();
		expect(saveButton().elements()).toHaveLength(0);
	});

	describe('merging', () => {
		async function renameTo(id: string, name: string): Promise<void> {
			renderEdit(subjectOf(id), { summary: 'Typed here.', notes: '' });
			await nameField().fill(name);
			await saveButton().click();
		}

		it('offers to merge when the name matches another value, and asks first', async () => {
			renderEdit(subjectOf('style-doric'));
			await nameField().fill('ionic');

			await expect
				.element(page.getByText(m.valueForm.mergeHint('styl', 'Ionic', m.atelier.count(1))))
				.toBeVisible();
			await saveButton().click();

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
			expect(saveValue).not.toHaveBeenCalled();
			await confirm.getByRole('button', { name: m.cardIndex.mergeConfirm.confirm }).click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({
					record: expect.objectContaining({ id: 'style-doric' }),
					mergeInto: expect.objectContaining({ id: 'style-ionic' })
				})
			);
			expect(goto).toHaveBeenCalledWith('/atelier/values/style/style-ionic', {
				replace: true,
				refreshAll: true,
				state: { valueMessage: m.cardIndex.merged('Ionic') }
			});
		});

		it('does not save the summary and notes typed in a form that merges', async () => {
			renderEdit(subjectOf('style-doric'));
			await page.getByLabelText(m.valueForm.summary).fill('Typed here.');
			await nameField().fill('Ionic');
			await saveButton().click();
			await page
				.getByRole('alertdialog')
				.getByRole('button', { name: m.cardIndex.mergeConfirm.confirm })
				.click();

			expect(saveValue).toHaveBeenCalled();
			expect(saveValueDetails).not.toHaveBeenCalled();
		});

		it('warns that the page content of the merged value will be deleted', async () => {
			vi.mocked(loadValuePageContent).mockResolvedValue({ content: { hasContent: true } });
			await renameTo('style-doric', 'Ionic');

			await expect
				.element(
					page
						.getByRole('alertdialog')
						.getByText(m.cardIndex.mergeConfirm.pageContent('Doric'), { exact: false })
				)
				.toBeVisible();
			expect(loadValuePageContent).toHaveBeenCalledWith('style-doric');
		});

		it('says nothing about page content when the merged value has none', async () => {
			await renameTo('style-doric', 'Ionic');

			const confirm = page.getByRole('alertdialog');
			await expect
				.element(confirm.getByText(m.cardIndex.mergeConfirm.irreversible, { exact: false }))
				.toBeVisible();
			await expect
				.element(confirm.getByText(m.cardIndex.mergeConfirm.pageContent('Doric'), { exact: false }))
				.not.toBeInTheDocument();
		});

		it('shows an error and does not ask to merge when the page content cannot be read', async () => {
			vi.mocked(loadValuePageContent).mockResolvedValue({ error: m.cardIndex.errors.network });
			await renameTo('style-doric', 'Ionic');

			await expect.element(page.getByText(m.cardIndex.errors.network)).toBeVisible();
			await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
			expect(saveValue).not.toHaveBeenCalled();
		});

		it('keeps the form when the learner backs out of a merge', async () => {
			await renameTo('style-doric', 'Ionic');
			await page.getByRole('button', { name: m.cardIndex.mergeConfirm.back }).click();

			expect(saveValue).not.toHaveBeenCalled();
			await expect.element(nameField()).toHaveValue('Ionic');
		});

		it('describes the merge of a period with the artworks it gets and the links it adds', async () => {
			await renameTo('period-gothic', 'classical');

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
			await renameTo('style-loose', 'Ionic');

			await expect
				.element(
					page
						.getByRole('alertdialog')
						.getByText(m.cardIndex.mergeConfirm.unused('Loose'), { exact: false })
				)
				.toBeVisible();
		});
	});

	describe('links', () => {
		it('adds an era to a period without asking', async () => {
			renderEdit(subjectOf('period-classical'));

			await page.getByLabelText(m.valueForm.addEra).selectOptions(m.eras.middle_ages.name);
			await saveButton().click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({ eraCodes: ['antiquity', 'middle_ages', 'early_modern'] })
			);
		});

		it('asks where the artworks go when an era is removed from a period', async () => {
			renderEdit(subjectOf('period-classical'));

			await page
				.getByRole('button', { name: m.valueForm.removeEra(m.eras.antiquity.name) })
				.click();
			await saveButton().click();

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
			renderEdit(subjectOf('period-classical'));

			await page.getByLabelText(m.valueForm.addEra).selectOptions(m.eras.middle_ages.name);
			await page
				.getByRole('button', { name: m.valueForm.removeEra(m.eras.antiquity.name) })
				.click();
			await saveButton().click();

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
			renderEdit(subjectOf('period-gothic'));

			await page
				.getByRole('button', { name: m.valueForm.removeEra(m.eras.middle_ages.name) })
				.click();
			await saveButton().click();

			await expect
				.element(
					page
						.getByRole('alertdialog')
						.getByText(m.cardIndex.moveConfirm.toNone('Gothic', m.eras.middle_ages.name, 2))
				)
				.toBeVisible();
		});

		it('keeps a period of a style that an artwork still uses together with it', async () => {
			renderEdit(subjectOf('style-doric'));

			await expect
				.element(page.getByRole('button', { name: m.valueForm.removePeriod('Classical') }))
				.toBeDisabled();
			await expect.element(page.getByText(m.valueForm.periodLocked('Classical', 2))).toBeVisible();
		});

		it('removes and adds periods of a style', async () => {
			renderEdit(subjectOf('style-ionic'));

			await page.getByRole('button', { name: m.valueForm.removePeriod('Gothic') }).click();
			await saveButton().click();

			expect(saveValue).toHaveBeenCalledWith(
				expect.objectContaining({ periodIds: ['period-classical'] })
			);
		});

		it('shows no links for a material', async () => {
			renderEdit(subjectOf('material-bronze'));

			await expect.element(nameField()).toBeVisible();
			expect(page.getByRole('group', { name: m.valueForm.eras }).elements()).toHaveLength(0);
			expect(page.getByRole('group', { name: m.valueForm.periods }).elements()).toHaveLength(0);
		});
	});

	describe('author', () => {
		it('shows the portrait actions, the years of life and the sort name box', async () => {
			renderEdit(subjectOf('author-phidias'));

			await expect
				.element(page.getByRole('button', { name: m.valueForm.portrait.find }))
				.toBeEnabled();
			await expect
				.element(page.getByRole('button', { name: m.valueForm.portrait.own }))
				.toBeVisible();
			await expect.element(page.getByRole('group', { name: m.valueForm.lifeYears })).toBeVisible();
			await expect.element(page.getByLabelText(m.valueForm.birthYear)).toBeVisible();
			await expect.element(page.getByLabelText(m.valueForm.deathYear)).toBeVisible();
			expect(page.getByLabelText(m.valueForm.sortName, { exact: true }).elements()).toHaveLength(0);

			await page.getByText(m.valueForm.sortByOther).click();

			await expect
				.element(page.getByLabelText(m.valueForm.sortName, { exact: true }))
				.toBeVisible();
			await expect.element(page.getByText(m.valueForm.sortNameHint)).toBeVisible();
		});

		it('fills the form from the saved details', async () => {
			renderEdit(subjectOf('author-phidias'), {
				summary: '',
				notes: '',
				author: { ...emptyAuthorDetails(), birthYear: -480, deathYear: -430, sortName: 'Fidiasz' }
			});

			await expect.element(page.getByLabelText(m.valueForm.birthYear)).toHaveValue('480');
			await expect
				.element(page.getByRole('checkbox', { name: m.valueForm.birthBeforeCommonEra }))
				.toBeChecked();
			await expect
				.element(page.getByLabelText(m.valueForm.sortName, { exact: true }))
				.toHaveValue('Fidiasz');
		});

		it('rejects a death before the birth and saves nothing', async () => {
			renderEdit(subjectOf('author-phidias'));

			await page.getByLabelText(m.valueForm.birthYear).fill('1519');
			await page.getByLabelText(m.valueForm.deathYear).fill('1452');
			await saveButton().click();

			await expect.element(page.getByText(m.valueForm.lifeYearsOrder)).toBeVisible();
			expect(saveValueDetails).not.toHaveBeenCalled();
			expect(saveValue).not.toHaveBeenCalled();
		});

		it('saves the years of life and the sort name with the loaded details as the previous ones', async () => {
			const loaded = { summary: '', notes: '', author: emptyAuthorDetails() };
			renderEdit(subjectOf('author-phidias'), loaded);

			await page.getByLabelText(m.valueForm.birthYear).fill('480');
			await page.getByText(m.artworkForm.beforeCommonEra).first().click();
			await page.getByText(m.valueForm.sortByOther).click();
			await page.getByLabelText(m.valueForm.sortName, { exact: true }).fill('Fidiasz');
			await saveButton().click();

			expect(saveValueDetails).toHaveBeenCalledWith(
				subjectOf('author-phidias'),
				{
					summary: '',
					notes: '',
					author: {
						image: null,
						birthYear: -480,
						deathYear: null,
						yearsApproximate: false,
						sortName: 'Fidiasz'
					}
				},
				loaded
			);
		});
	});

	describe('location', () => {
		it('picks a country from the searchable list and a type of place, then saves them', async () => {
			const loaded = {
				summary: '',
				notes: '',
				location: { countryCode: null, placeType: null }
			};
			renderEdit(subjectOf('location-athens'), loaded);

			const country = page.getByRole('combobox', { name: m.valueForm.country });
			await expect.element(country).toHaveAccessibleDescription(m.valueForm.countryHint);
			await country.click();
			await userEvent.type(country, 'grec');
			await userEvent.keyboard('{Enter}');
			await expect.element(country).toHaveValue('Grecja');
			await userEvent.click(page.getByRole('radio', { name: m.valueForm.placeTypes.on_site }));
			await saveButton().click();

			expect(saveValueDetails).toHaveBeenCalledWith(
				subjectOf('location-athens'),
				{ summary: '', notes: '', location: { countryCode: 'GR', placeType: 'on_site' } },
				loaded
			);
		});

		it('shows the saved country and type', async () => {
			renderEdit(subjectOf('location-athens'), {
				summary: '',
				notes: '',
				location: { countryCode: 'FR', placeType: 'museum' }
			});

			await expect
				.element(page.getByRole('combobox', { name: m.valueForm.country }))
				.toHaveValue('Francja');
			await expect
				.element(page.getByRole('radio', { name: m.valueForm.placeTypes.museum }))
				.toBeChecked();
		});

		it('shows no place fields for other kinds', async () => {
			renderEdit(subjectOf('style-doric'));

			await expect.element(nameField()).toBeVisible();
			expect(page.getByRole('combobox', { name: m.valueForm.country }).elements()).toHaveLength(0);
		});
	});
});
