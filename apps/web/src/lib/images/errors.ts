import { m } from '#lib/i18n/index.ts';
import { OWN_IMAGE_MAX_MEGABYTES, ownImageFormats } from './bucket.ts';

type StorageErrorLike = {
	status?: number;
	statusCode?: string;
	code?: string;
};

export function ownImageErrorMessage(error: StorageErrorLike): string {
	if (error.code === 'EntityTooLarge' || error.statusCode === '413') {
		return m.ownImageErrors.fileTooLarge(OWN_IMAGE_MAX_MEGABYTES);
	}
	if (error.code === 'InvalidMimeType' || error.statusCode === '415') {
		return m.ownImageErrors.fileType(ownImageFormats());
	}
	if (error.status === undefined) return m.ownImageErrors.uploadNetwork;
	return m.ownImageErrors.uploadFailed;
}
