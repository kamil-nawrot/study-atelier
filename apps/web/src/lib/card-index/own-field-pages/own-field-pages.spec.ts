import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import { loadOwnValues } from '#lib/card-index/card-index-data/card-index-data.ts';
import { loadOwnFields } from '#lib/card-index/own-fields-data/own-fields-data.ts';
import { loadArtworksOfValue } from '#lib/wall/wall-data/wall-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import {
	loadOwnFieldPage,
	loadOwnValuePage,
	ownFieldPath,
	ownValuePath
} from './own-field-pages.ts';

vi.mock('#lib/card-index/card-index-data/card-index-data.ts', () => ({ loadOwnValues: vi.fn() }));
vi.mock('#lib/card-index/own-fields-data/own-fields-data.ts', () => ({ loadOwnFields: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadArtworksOfValue: vi.fn() }));

describe('own field pages', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		const fields = testOwnFields();
		vi.mocked(loadOwnFields).mockResolvedValue({
			fields: fields.map((field) => ({ ...field, values: [] }))
		});
		vi.mocked(loadOwnValues).mockResolvedValue({
			ownValues: fields.flatMap((field) => field.values)
		});
		vi.mocked(loadArtworksOfValue).mockResolvedValue({
			artworks: [testArtwork(1, 'Annunciation')]
		});
	});

	it('builds the paths of a field and of its value', () => {
		expect(ownFieldPath('motifs')).toBe('/atelier/fields/motifs');
		expect(ownValuePath('motifs', 'angel')).toBe('/atelier/fields/motifs/values/angel');
	});

	it('loads a field with its values', async () => {
		const result = await loadOwnFieldPage('motifs');

		expect(result.field?.values.map((value) => value.name)).toEqual(['Angel', 'Angle']);
		expect(result.fields).toHaveLength(3);
	});

	it('says an unknown field is not found and passes a load error on', async () => {
		await expect(loadOwnFieldPage('gone')).resolves.toMatchObject({
			notFound: true,
			error: m.ownFields.page.notFound
		});

		vi.mocked(loadOwnValues).mockResolvedValue({ ownValues: [], error: 'No connection' });
		await expect(loadOwnFieldPage('motifs')).resolves.toEqual({
			fields: [],
			error: 'No connection'
		});
	});

	it('loads a value with the artworks that have it', async () => {
		const result = await loadOwnValuePage('motifs', 'angel');

		expect(result.value?.name).toBe('Angel');
		expect(result.artworks.map((artwork) => artwork.title)).toEqual(['Annunciation']);
		expect(loadArtworksOfValue).toHaveBeenCalledWith({ valueId: 'angel' });
	});

	it('says an unknown value is not found and passes an artworks error on', async () => {
		await expect(loadOwnValuePage('motifs', 'gone')).resolves.toMatchObject({
			notFound: true
		});
		await expect(loadOwnValuePage('gone', 'angel')).resolves.toMatchObject({ notFound: true });

		vi.mocked(loadArtworksOfValue).mockResolvedValue({ artworks: [], error: 'Offline' });
		await expect(loadOwnValuePage('motifs', 'angel')).resolves.toMatchObject({
			error: 'Offline'
		});
	});
});
