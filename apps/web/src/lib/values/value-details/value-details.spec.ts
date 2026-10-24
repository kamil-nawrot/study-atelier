import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { ownImageUrl, removeOwnImage, uploadOwnImage } from '#lib/images/own-image.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { emptyAuthorDetails } from '#lib/values/author-form/author-form.ts';
import type { ValueSubject } from '#lib/collection/types.ts';
import { loadValueDetails, saveValueDetails, valueDetailsChanged } from './value-details.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn() }
}));
vi.mock('#lib/images/own-image.ts', () => ({
	uploadOwnImage: vi.fn(),
	removeOwnImage: vi.fn(),
	ownImageUrl: vi.fn()
}));

const style: ValueSubject = {
	kind: 'style',
	record: { id: 's1', category: 'style', name: 'Doric', count: 1 }
};
const era: ValueSubject = { kind: 'era', code: 'antiquity' };
const author: ValueSubject = {
	kind: 'author',
	record: { id: 'a1', category: 'author', name: 'Leonardo da Vinci', count: 1 }
};

function detailsTable(row: unknown, error: unknown = null): { eq: ReturnType<typeof vi.fn> } {
	const query = {
		select: vi.fn(),
		eq: vi.fn(),
		maybeSingle: vi.fn().mockResolvedValue({ data: row, error })
	};
	query.select.mockReturnValue(query);
	query.eq.mockReturnValue(query);
	vi.mocked(supabase.from).mockReturnValue(query as never);
	return query;
}

describe('loadValueDetails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('reads the details of a value from the table of its kind', async () => {
		const query = detailsTable({ summary: 'Plain capitals.', notes: null });

		await expect(loadValueDetails(style)).resolves.toEqual({
			details: { summary: 'Plain capitals.', notes: '' }
		});
		expect(supabase.from).toHaveBeenCalledWith('style_details');
		expect(query.eq).toHaveBeenCalledWith('value_id', 's1');
	});

	it('reads the details of an era by its code', async () => {
		const query = detailsTable(null);

		await expect(loadValueDetails(era)).resolves.toEqual({ details: { summary: '', notes: '' } });
		expect(supabase.from).toHaveBeenCalledWith('era_details');
		expect(query.eq).toHaveBeenCalledWith('era_code', 'antiquity');
	});

	it('reports a failed read', async () => {
		detailsTable(null, { message: 'Failed to fetch' });

		const result = await loadValueDetails(style);

		expect(result.error).toBe(m.collectionErrors.network);
	});
});

describe('saveValueDetails', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
	});

	it('saves the trimmed details of a value', async () => {
		await expect(
			saveValueDetails(style, { summary: ' Plain. ', notes: 'Notes\n' })
		).resolves.toEqual({});
		expect(supabase.rpc).toHaveBeenCalledWith('save_value_details', {
			target_value: 's1',
			details: { summary: 'Plain.', notes: 'Notes' }
		});
	});

	it('saves the details of an era', async () => {
		await saveValueDetails(era, { summary: 'Greece and Rome.', notes: '' });

		expect(supabase.rpc).toHaveBeenCalledWith('save_era_details', {
			target_era: 'antiquity',
			details: { summary: 'Greece and Rome.', notes: '' }
		});
	});

	it('reports a failed save', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: { code: '23514' } } as never);

		await expect(saveValueDetails(style, { summary: 'x', notes: '' })).resolves.toEqual({
			error: m.cardIndex.errors.changed
		});
	});
});

describe('valueDetailsChanged', () => {
	it('ignores spaces around the summary', () => {
		expect(valueDetailsChanged({ summary: 'A ', notes: '' }, { summary: 'A', notes: '' })).toBe(
			false
		);
		expect(valueDetailsChanged({ summary: 'A', notes: 'x' }, { summary: 'A', notes: '' })).toBe(
			true
		);
	});
});

describe('author details', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
	});

	it('reads the portrait, the years of life and the sort name', async () => {
		vi.mocked(ownImageUrl).mockResolvedValue('https://signed.example/portrait.jpg');
		detailsTable({
			summary: null,
			notes: null,
			birth_year: 1452,
			death_year: 1519,
			years_approximate: false,
			sort_name: 'Vinci, Leonardo da',
			own_image_path: 'owner/portrait.jpg',
			image_width: 400,
			image_height: 500
		});

		const { details } = await loadValueDetails(author);

		expect(supabase.from).toHaveBeenCalledWith('author_details');
		expect(details.author).toEqual({
			image: {
				kind: 'upload',
				path: 'owner/portrait.jpg',
				width: 400,
				height: 500,
				previewUrl: 'https://signed.example/portrait.jpg'
			},
			birthYear: 1452,
			deathYear: 1519,
			yearsApproximate: false,
			sortName: 'Vinci, Leonardo da'
		});
	});

	it('gives an author without a row empty details', async () => {
		detailsTable(null);

		const { details } = await loadValueDetails(author);

		expect(details.author).toEqual(emptyAuthorDetails());
	});

	it('uploads a new portrait, saves its path and removes the previous upload', async () => {
		vi.mocked(uploadOwnImage).mockResolvedValue({ path: 'owner/new.jpg' });
		const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' });

		await saveValueDetails(
			author,
			{
				summary: '',
				notes: '',
				author: {
					...emptyAuthorDetails(),
					image: { kind: 'file', file, previewUrl: 'blob:x', width: 4, height: 5 },
					birthYear: 1452
				}
			},
			{
				summary: '',
				notes: '',
				author: {
					...emptyAuthorDetails(),
					image: { kind: 'upload', path: 'owner/old.jpg', width: 4, height: 5 }
				}
			}
		);

		expect(supabase.rpc).toHaveBeenCalledWith('save_value_details', {
			target_value: 'a1',
			details: expect.objectContaining({
				birth_year: 1452,
				death_year: null,
				own_image_path: 'owner/new.jpg',
				source_image_file: null,
				image_width: 4
			})
		});
		expect(removeOwnImage).toHaveBeenCalledWith('owner/old.jpg');
		expect(removeOwnImage).not.toHaveBeenCalledWith('owner/new.jpg');
	});

	it('removes the new upload when saving fails and keeps the previous one', async () => {
		vi.mocked(uploadOwnImage).mockResolvedValue({ path: 'owner/new.jpg' });
		vi.mocked(supabase.rpc).mockResolvedValue({ error: { code: '23514' } } as never);
		const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' });

		const result = await saveValueDetails(
			author,
			{
				summary: '',
				notes: '',
				author: {
					...emptyAuthorDetails(),
					image: { kind: 'file', file, previewUrl: 'blob:x', width: 4, height: 5 }
				}
			},
			{
				summary: '',
				notes: '',
				author: {
					...emptyAuthorDetails(),
					image: { kind: 'upload', path: 'owner/old.jpg', width: 4, height: 5 }
				}
			}
		);

		expect(result.error).toBe(m.cardIndex.errors.changed);
		expect(removeOwnImage).toHaveBeenCalledWith('owner/new.jpg');
		expect(removeOwnImage).not.toHaveBeenCalledWith('owner/old.jpg');
	});

	it('sends only the text for a value that is not an author', async () => {
		await saveValueDetails(style, { summary: 'x', notes: '' });

		expect(supabase.rpc).toHaveBeenCalledWith('save_value_details', {
			target_value: 's1',
			details: { summary: 'x', notes: '' }
		});
	});
});

describe('location details', () => {
	const location: ValueSubject = {
		kind: 'location',
		record: { id: 'l1', category: 'location', name: 'Luwr', count: 1 }
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
	});

	it('reads the country and the type of place', async () => {
		detailsTable({ summary: null, notes: null, country_code: 'FR', place_type: 'museum' });

		const { details } = await loadValueDetails(location);

		expect(supabase.from).toHaveBeenCalledWith('location_details');
		expect(details.location).toEqual({ countryCode: 'FR', placeType: 'museum' });
	});

	it('ignores a country and a type it does not know', async () => {
		detailsTable({ summary: null, notes: null, country_code: 'ZZ', place_type: 'garden' });
		expect((await loadValueDetails(location)).details.location).toEqual({
			countryCode: null,
			placeType: null
		});
	});

	it('saves the country and the type with the text', async () => {
		await saveValueDetails(location, {
			summary: 'Pałac.',
			notes: '',
			location: { countryCode: 'FR', placeType: 'museum' }
		});

		expect(supabase.rpc).toHaveBeenCalledWith('save_value_details', {
			target_value: 'l1',
			details: { summary: 'Pałac.', notes: '', country_code: 'FR', place_type: 'museum' }
		});
	});
});
