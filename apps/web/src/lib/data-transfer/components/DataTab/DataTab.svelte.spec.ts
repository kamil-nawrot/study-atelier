import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { downloadBlob } from '#lib/data-transfer/download/download.ts';
import { importArchive } from '#lib/data-transfer/import-atelier/import-atelier.ts';
import { exportAtelier } from '#lib/data-transfer/export-atelier/export-atelier.ts';
import DataTab from './DataTab.svelte';
import '@study-atelier/ui/styles.css';

vi.mock('#lib/data-transfer/export-atelier/export-atelier.ts', () => ({ exportAtelier: vi.fn() }));
vi.mock('#lib/data-transfer/import-atelier/import-atelier.ts', () => ({ importArchive: vi.fn() }));
vi.mock('#lib/data-transfer/download/download.ts', () => ({ downloadBlob: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe('DataTab', () => {
	it('downloads the archive and says so', async () => {
		const blob = new Blob(['zip']);
		vi.mocked(exportAtelier).mockResolvedValue({ blob, name: 'study-atelier-2026-10-23.zip' });
		const onexported = vi.fn();
		render(DataTab, { onexported, onimported: vi.fn() });

		await page.getByRole('button', { name: m.settings.data.exportButton }).click();

		await vi.waitFor(() => expect(onexported).toHaveBeenCalledWith(m.settings.data.exported));
		expect(downloadBlob).toHaveBeenCalledWith(blob, 'study-atelier-2026-10-23.zip');
	});

	it('shows the progress of the images while it works', async () => {
		vi.mocked(exportAtelier).mockImplementation(async (onprogress) => {
			onprogress({ step: 'images', done: 12, total: 48 });
			return new Promise(() => undefined);
		});
		render(DataTab, { onexported: vi.fn(), onimported: vi.fn() });

		await page.getByRole('button', { name: m.settings.data.exportButton }).click();

		await expect.element(page.getByText(m.settings.data.images(12, 48))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.settings.data.exportButton }))
			.toBeDisabled();
	});

	it('shows an alert when the export fails and downloads nothing', async () => {
		vi.mocked(exportAtelier).mockResolvedValue({ error: m.settings.data.failed });
		render(DataTab, { onexported: vi.fn(), onimported: vi.fn() });

		await page.getByRole('button', { name: m.settings.data.exportButton }).click();

		await expect.element(page.getByText(m.settings.data.errorTitle)).toBeVisible();
		expect(downloadBlob).not.toHaveBeenCalled();
	});

	it('reads the chosen file into the atelier and says so', async () => {
		vi.mocked(importArchive).mockResolvedValue({ imported: true });
		const onimported = vi.fn();
		render(DataTab, { atelierEmpty: true, onexported: vi.fn(), onimported });

		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		const transfer = new DataTransfer();
		transfer.items.add(new File(['zip'], 'atelier.zip', { type: 'application/zip' }));
		input.files = transfer.files;
		input.dispatchEvent(new Event('change', { bubbles: true }));

		await vi.waitFor(() => expect(onimported).toHaveBeenCalledWith(m.settings.data.imported));
	});

	it('shows why a file was not imported', async () => {
		vi.mocked(importArchive).mockResolvedValue({ error: m.settings.data.importNotZip });
		render(DataTab, { atelierEmpty: true, onexported: vi.fn(), onimported: vi.fn() });

		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		const transfer = new DataTransfer();
		transfer.items.add(new File(['x'], 'x.zip'));
		input.files = transfer.files;
		input.dispatchEvent(new Event('change', { bubbles: true }));

		await expect.element(page.getByText(m.settings.data.importErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.settings.data.importNotZip)).toBeVisible();
	});

	it('does not offer the import in an atelier that is not empty', async () => {
		render(DataTab, { atelierEmpty: false, onexported: vi.fn(), onimported: vi.fn() });

		await expect.element(page.getByText(m.settings.data.importFilled)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.settings.data.importButton }))
			.toBeDisabled();
	});
});
