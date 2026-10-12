import { describe, expect, it } from 'vitest';
import { StorageApiError } from '@supabase/supabase-js';
import { m } from '#lib/i18n/index.ts';
import { OWN_IMAGE_MAX_MEGABYTES, ownImageFormats } from './bucket.ts';
import { ownImageErrorMessage } from './errors.ts';

describe('ownImageErrorMessage', () => {
	it('names the size limit when the file is too large', () => {
		expect(
			ownImageErrorMessage(
				new StorageApiError('Payload too large', 413, '413', 'storage', 'EntityTooLarge')
			)
		).toBe(m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_MEGABYTES));
	});

	it('names the allowed formats when the type is refused', () => {
		expect(
			ownImageErrorMessage(
				new StorageApiError('mime type not supported', 415, '415', 'storage', 'InvalidMimeType')
			)
		).toBe(m.ownImageErrors.fileType(ownImageFormats()));
	});

	it('asks to check the connection when the request did not reach the server', () => {
		expect(ownImageErrorMessage({ status: undefined, statusCode: undefined })).toBe(
			m.ownImageErrors.uploadNetwork
		);
	});

	it('falls back to a general message for any other refusal', () => {
		expect(
			ownImageErrorMessage(new StorageApiError('Forbidden', 403, '403', 'storage', 'AccessDenied'))
		).toBe(m.ownImageErrors.uploadFailed);
	});
});
