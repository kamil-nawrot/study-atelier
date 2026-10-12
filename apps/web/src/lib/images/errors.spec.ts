import { StorageApiError } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { OWN_IMAGE_MAX_MEGABYTES, ownImageFormats } from './bucket.ts';
import { imageSearchErrorMessage, ownImageErrorMessage } from './errors.ts';
import { WikimediaError } from './wikimedia.ts';

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

describe('imageSearchErrorMessage', () => {
	it('asks the learner to wait after a rate limit', () => {
		expect(imageSearchErrorMessage(new WikimediaError(429))).toBe(m.imageSearchErrors.rateLimited);
	});

	it('points at the connection when the service did not answer', () => {
		expect(imageSearchErrorMessage(new WikimediaError(null))).toBe(m.imageSearchErrors.network);
	});

	it('falls back to a general message', () => {
		expect(imageSearchErrorMessage(new WikimediaError(503))).toBe(m.imageSearchErrors.failed);
		expect(imageSearchErrorMessage(new SyntaxError('Unexpected token'))).toBe(
			m.imageSearchErrors.failed
		);
	});
});
