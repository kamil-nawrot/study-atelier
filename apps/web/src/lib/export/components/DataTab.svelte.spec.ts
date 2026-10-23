import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/index.ts';
import { downloadBlob } from '../download.ts';
import { exportAtelier } from '../export-atelier.ts';
import DataTab from './DataTab.svelte';
import '@study-atelier/ui/styles.css';

vi.mock('../export-atelier.ts', () => ({ exportAtelier: vi.fn() }));
vi.mock('../download.ts', () => ({ downloadBlob: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe('DataTab', () => {
	it('downloads the archive and says so', async () => {
		const blob = new Blob(['zip']);
		vi.mocked(exportAtelier).mockResolvedValue({ blob, name: 'study-atelier-2026-10-23.zip' });
		const onexported = vi.fn();
		render(DataTab, { onexported });

		await page.getByRole('button', { name: m.settings.data.exportButton }).click();

		await vi.waitFor(() => expect(onexported).toHaveBeenCalledWith(m.settings.data.exported));
		expect(downloadBlob).toHaveBeenCalledWith(blob, 'study-atelier-2026-10-23.zip');
	});

	it('shows the progress of the images while it works', async () => {
		vi.mocked(exportAtelier).mockImplementation(async (onprogress) => {
			onprogress({ step: 'images', done: 12, total: 48 });
			return new Promise(() => undefined);
		});
		render(DataTab, { onexported: vi.fn() });

		await page.getByRole('button', { name: m.settings.data.exportButton }).click();

		await expect.element(page.getByText(m.settings.data.images(12, 48))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.settings.data.exportButton }))
			.toBeDisabled();
	});

	it('shows an alert when the export fails and downloads nothing', async () => {
		vi.mocked(exportAtelier).mockResolvedValue({ error: m.settings.data.failed });
		render(DataTab, { onexported: vi.fn() });

		await page.getByRole('button', { name: m.settings.data.exportButton }).click();

		await expect.element(page.getByText(m.settings.data.errorTitle)).toBeVisible();
		expect(downloadBlob).not.toHaveBeenCalled();
	});
});
