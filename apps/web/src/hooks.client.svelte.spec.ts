import { describe, expect, it, vi } from 'vitest';
import type { HandleClientError } from '@sveltejs/kit/hooks';
import { reportError } from '#lib/shared/monitoring/monitoring.ts';
import { handleError } from './hooks.client.ts';

vi.mock('#lib/shared/monitoring/monitoring.ts', () => ({
	reportError: vi.fn(),
	startMonitoring: vi.fn()
}));

type ErrorInput = Parameters<HandleClientError>[0];

describe('client handleError', () => {
	it('reports an error of the app code', async () => {
		const error = new TypeError('broken');
		await handleError({ error, kind: 'unknown' } as unknown as ErrorInput);
		expect(reportError).toHaveBeenCalledWith(error);
	});

	it('does not report a page that is not found', async () => {
		vi.mocked(reportError).mockClear();
		await handleError({
			error: { status: 404, message: 'Not Found' },
			kind: 'framework'
		} as unknown as ErrorInput);
		expect(reportError).not.toHaveBeenCalled();
	});
});
