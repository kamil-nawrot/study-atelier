import { vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { beforeNavigate } from '$app/navigation';
import { emptyValueLinks } from '#lib/card-index/value-links/value-links.ts';
import type { ValueLinks } from '#lib/card-index/types/value-links.ts';
import { m } from '#lib/i18n/i18n.ts';
import { saveArtworkCalls } from '#lib/testing/duplicates/duplicates.ts';

export function linkedValues(): ValueLinks {
	const links = emptyValueLinks();
	links.periodsByEra.early_modern = ['Dutch Golden Age', 'Mannerism'];
	links.periodsByEra.modern = ['Realism'];
	links.stylesByPeriod['dutch golden age'] = ['Delft school', 'Leiden fijnschilders'];
	return links;
}

export function eraTile(code: keyof typeof m.eras): ReturnType<typeof page.getByRole> {
	return page.getByRole('radio', { name: `${m.eras[code].name} ${m.eras[code].years}` });
}

export async function toggleSpan(): Promise<void> {
	await page.getByText(m.artworkForm.spanSwitch, { exact: true }).click();
}

export function periodField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.period });
}

export function styleField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.style });
}

export async function chooseEraAndPeriod(): Promise<void> {
	await userEvent.click(eraTile('early_modern'));
	await userEvent.click(periodField());
	await userEvent.click(page.getByRole('option', { name: 'Dutch Golden Age' }));
}

export function titleField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.artworkForm.title });
}

export function authorsField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('combobox', { name: m.artworkForm.authors });
}

export function saveButton(): ReturnType<typeof page.getByRole> {
	return page.getByRole('button', { name: m.common.save, exact: true });
}

export type Leave = Parameters<Parameters<typeof beforeNavigate>[0]>[0];

export function leave(type: 'link' | 'popstate' | 'leave' = 'link'): Leave {
	const navigation = {
		type,
		to: type === 'leave' ? null : { url: new URL('http://localhost/atelier/trash') },
		delta: type === 'popstate' ? -1 : undefined,
		cancel: vi.fn()
	};
	const guard = vi.mocked(beforeNavigate).mock.calls[0][0];
	guard(navigation as unknown as Leave);
	return navigation as unknown as Leave;
}

export async function imageFile(width: number, height: number, padding = 0): Promise<File> {
	const canvas = new OffscreenCanvas(width, height);
	canvas.getContext('2d')?.fillRect(0, 0, width, height);
	const blob = await canvas.convertToBlob({ type: 'image/png' });
	return new File([blob, new Uint8Array(padding)], 'photo.png', { type: 'image/png' });
}

export function stubRemoteImage(size: { width: number; height: number } | 'error'): void {
	vi.stubGlobal(
		'Image',
		class {
			naturalWidth = 0;
			naturalHeight = 0;
			onload: (() => void) | null = null;
			onerror: (() => void) | null = null;

			set src(_value: string) {
				setTimeout(() => {
					if (size === 'error') {
						this.onerror?.();
						return;
					}
					this.naturalWidth = size.width;
					this.naturalHeight = size.height;
					this.onload?.();
				});
			}
		}
	);
}

export function stubSlowRemoteImage(): () => void {
	let finish = (): void => {};
	vi.stubGlobal(
		'Image',
		class {
			naturalWidth = 1200;
			naturalHeight = 900;
			onload: (() => void) | null = null;

			set src(_value: string) {
				finish = () => this.onload?.();
			}
		}
	);
	return () => finish();
}

export async function openOwnImage(): Promise<void> {
	await page.getByRole('button', { name: m.artworkForm.ownImage }).click();
}

export async function chooseFile(file: File): Promise<void> {
	await openOwnImage();
	const input = document.querySelector<HTMLInputElement>('input[type="file"]');
	if (!input) throw new Error('The file input is missing');
	await userEvent.upload(input, file);
}

export function urlField(): ReturnType<typeof page.getByRole> {
	return page.getByRole('textbox', { name: m.artworkForm.imageUrl });
}

export function savedImages(): Record<string, unknown>[] {
	const [, args] = saveArtworkCalls()[0] as [string, Record<string, never>];
	return args.images;
}

export function savedMainImage(): Record<string, unknown> {
	return savedImages()[0];
}

export function duplicateDialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.duplicateDialog.title });
}

export async function addValue(
	field: ReturnType<typeof page.getByRole>,
	name: string
): Promise<void> {
	await field.fill(name);
	await userEvent.keyboard('{Enter}');
}

export function selectFile(file: File): void {
	const input = document.querySelector<HTMLInputElement>('input[type="file"]');
	if (!input) throw new Error('The file input is missing');
	const transfer = new DataTransfer();
	transfer.items.add(file);
	input.files = transfer.files;
	input.dispatchEvent(new Event('change', { bubbles: true }));
}

export async function fillRequired(): Promise<void> {
	await titleField().fill('The Milkmaid');
	await addValue(authorsField(), 'Johannes Vermeer');
}

export function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve: (value: T) => void = () => {};
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
}

export function answerNothingFromWikidata(): void {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response(JSON.stringify({ results: { bindings: [] } })))
	);
}
