export const UUID_PATTERN = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

const UUID = new RegExp(`^${UUID_PATTERN}$`, 'i');

export function isUuid(text: string): boolean {
	return UUID.test(text);
}
