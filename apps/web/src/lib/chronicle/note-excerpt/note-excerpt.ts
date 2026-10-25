export function noteExcerpt(notes: string): string {
	return notes
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s{0,3}(#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/gm, '')
		.replace(/(\*\*|__|\*|_|`)/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
