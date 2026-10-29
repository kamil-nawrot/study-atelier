export function synonymKey(word: string): string {
	return word.trim().toLocaleLowerCase('pl');
}

export function synonymChanges(
	known: readonly string[],
	current: readonly string[]
): { removed: string[]; added: string[] } {
	const knownKeys = new Set(known.map(synonymKey));
	const currentKeys = new Set(current.map(synonymKey));
	return {
		removed: known.filter((word) => !currentKeys.has(synonymKey(word))),
		added: current.filter((word) => !knownKeys.has(synonymKey(word)))
	};
}

export function formsWithout(
	forms: readonly string[],
	dropped: readonly string[],
	keptSources: readonly (readonly string[])[]
): string[] {
	const kept = new Set(keptSources.flat());
	return forms.filter((item) => kept.has(item) || !dropped.includes(item));
}
