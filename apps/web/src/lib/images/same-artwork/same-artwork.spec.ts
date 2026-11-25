import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCategoryFiles } from '#lib/images/commons/commons.ts';
import { fetchCommonsCategory } from '#lib/images/wikidata/wikidata.ts';
import { findSameArtworkImages } from './same-artwork.ts';

vi.mock('#lib/images/commons/commons.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/images/commons/commons.ts')>()),
	fetchCategoryFiles: vi.fn()
}));
vi.mock('#lib/images/wikidata/wikidata.ts', () => ({ fetchCommonsCategory: vi.fn() }));

const category = vi.mocked(fetchCommonsCategory);
const files = vi.mocked(fetchCategoryFiles);

const source = {
	wikidataId: 'Q12418',
	file: 'Mona_Lisa.jpg',
	title: 'Mona Lisa',
	authors: ['Leonardo da Vinci']
};

function file(name: string): Awaited<ReturnType<typeof fetchCategoryFiles>>['files'][number] {
	return {
		file: name,
		thumbnailUrl: `https://upload.wikimedia.org/thumb/${name}/330px-${name}`,
		width: 2000,
		height: 3000,
		licence: 'Public domain',
		licenceUrl: null,
		attribution: 'Someone'
	};
}

describe('findSameArtworkImages', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('turns the files of the category into candidates of the same item, without the main image', async () => {
		category.mockResolvedValue('Mona Lisa');
		files.mockResolvedValue({ files: [file('Mona Lisa.jpg'), file('Detail.jpg')], next: 'file|x' });

		const page = await findSameArtworkImages(source);

		expect(page.candidates).toHaveLength(1);
		expect(page.candidates[0]).toMatchObject({
			wikidataId: 'Q12418',
			title: 'Mona Lisa',
			authors: ['Leonardo da Vinci'],
			image: { file: 'Detail.jpg', width: 2000, height: 3000, licence: 'Public domain' }
		});
		expect(page.cursor).toEqual({ category: 'Mona Lisa', next: 'file|x' });
		expect(files).toHaveBeenCalledWith('Mona Lisa', 330, null);
	});

	it('reads the next page with the cursor and does not ask for the category again', async () => {
		files.mockResolvedValue({ files: [file('More.jpg')], next: null });

		const page = await findSameArtworkImages(source, { category: 'Mona Lisa', next: 'file|x' });

		expect(category).not.toHaveBeenCalled();
		expect(files).toHaveBeenCalledWith('Mona Lisa', 330, 'file|x');
		expect(page.cursor).toBeNull();
	});

	it('has no images when the item has no category', async () => {
		category.mockResolvedValue(null);

		await expect(findSameArtworkImages(source)).resolves.toEqual({ candidates: [], cursor: null });
		expect(files).not.toHaveBeenCalled();
	});
});
