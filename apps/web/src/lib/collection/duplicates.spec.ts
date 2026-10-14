import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/supabase.ts';
import {
	duplicateNumbers,
	findDuplicates,
	formatRecordNumbers,
	sameTitleAndAuthors,
	type DuplicateCandidate
} from './duplicates.ts';

vi.mock('#lib/supabase.ts', () => ({
	supabase: { from: vi.fn() }
}));

const query = {
	select: vi.fn(),
	is: vi.fn()
};

function candidate(
	number: number,
	title: string,
	authors: string[],
	id = `artwork-${number}`
): DuplicateCandidate {
	return { id, number, title, authors };
}

describe('sameTitleAndAuthors', () => {
	const sunflowers = { title: 'Słoneczniki', authors: ['Vincent van Gogh'] };

	it('ignores letter case, diacritics and whitespace in the title', () => {
		expect(sameTitleAndAuthors(sunflowers, { ...sunflowers, title: '  słoneczniki ' })).toBe(true);
		expect(sameTitleAndAuthors(sunflowers, { ...sunflowers, title: 'Sloneczniki' })).toBe(true);
		expect(
			sameTitleAndAuthors(
				{ title: 'The  Night Watch', authors: [] },
				{
					title: 'the night watch',
					authors: []
				}
			)
		).toBe(true);
	});

	it('does not match a different title', () => {
		expect(sameTitleAndAuthors(sunflowers, { ...sunflowers, title: 'Słoneczniki II' })).toBe(false);
	});

	it('matches the same set of authors in any order', () => {
		const a = { title: 'Bez tytułu', authors: ['Paul Gauguin', 'Vincent van Gogh'] };
		const b = { title: 'bez tytulu', authors: ['vincent van gogh', 'Paul Gauguin'] };
		expect(sameTitleAndAuthors(a, b)).toBe(true);
	});

	it('does not match when the sets of authors differ', () => {
		const both = { ...sunflowers, authors: ['Vincent van Gogh', 'Paul Gauguin'] };
		expect(sameTitleAndAuthors(sunflowers, both)).toBe(false);
		expect(sameTitleAndAuthors(sunflowers, { ...sunflowers, authors: ['Paul Gauguin'] })).toBe(
			false
		);
	});

	it('matches two artworks with an unknown author', () => {
		const unknown = { title: 'Venus of Willendorf', authors: [] };
		expect(sameTitleAndAuthors(unknown, { ...unknown })).toBe(true);
		expect(sameTitleAndAuthors(unknown, { ...unknown, authors: ['Someone'] })).toBe(false);
	});
});

describe('duplicateNumbers', () => {
	const candidates = [
		candidate(17, 'Sunflowers', ['Vincent van Gogh']),
		candidate(5, 'sunflowers', ['Vincent van Gogh']),
		candidate(9, 'Sunflowers', ['Paul Gauguin'])
	];

	it('returns the record numbers of matching artworks in order', () => {
		expect(
			duplicateNumbers({ title: 'Sunflowers', authors: ['Vincent van Gogh'] }, candidates)
		).toEqual([5, 17]);
	});

	it('leaves out the artwork being edited', () => {
		expect(
			duplicateNumbers(
				{ title: 'Sunflowers', authors: ['Vincent van Gogh'] },
				candidates,
				'artwork-5'
			)
		).toEqual([17]);
	});
});

describe('formatRecordNumbers', () => {
	it('lists record numbers the Polish way', () => {
		expect(formatRecordNumbers([5])).toBe('#0005');
		expect(formatRecordNumbers([5, 17])).toBe('#0005 i #0017');
		expect(formatRecordNumbers([5, 17, 21])).toBe('#0005, #0017 i #0021');
	});
});

describe('findDuplicates', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.select.mockReturnValue(query);
	});

	it('compares with artworks outside the trash', async () => {
		query.is.mockResolvedValue({
			data: [
				{
					id: 'artwork-5',
					record_number: 5,
					title: 'Sunflowers',
					artwork_values: [
						{ category_values: { category_code: 'style', name: 'Post-Impressionism' } },
						{ category_values: { category_code: 'author', name: 'Vincent van Gogh' } }
					]
				}
			],
			error: null
		});

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: ['Vincent van Gogh'] })
		).resolves.toEqual([5]);
		expect(supabase.from).toHaveBeenCalledWith('artworks');
		expect(query.is).toHaveBeenCalledWith('deleted_at', null);
	});

	it('finds nothing when the artworks cannot be read', async () => {
		query.is.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });

		await expect(
			findDuplicates({ title: 'Sunflowers', authors: ['Vincent van Gogh'] })
		).resolves.toEqual([]);
	});
});
