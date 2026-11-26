const LIKE_SPECIAL = /[\\%_]/g;

export function exactLike(name: string): string {
	return name.trim().replace(LIKE_SPECIAL, (character) => `\\${character}`);
}
