import { describe, expect, it, vi } from 'vitest';
import { noteWrite, onWrite } from './writes.ts';

describe('writes', () => {
	it('tells every listener that something was written, until it stops listening', () => {
		const listener = vi.fn();
		const stop = onWrite(listener);

		noteWrite();
		stop();
		noteWrite();

		expect(listener).toHaveBeenCalledOnce();
	});
});
