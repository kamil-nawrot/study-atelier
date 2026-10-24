const NOTE_LINK_PATH =
	/^\/atelier\/(?:\d+|values\/(?:era|period|style|material|author|location)\/[A-Za-z0-9_-]+)$/;

export function isNoteLinkPath(href: string): boolean {
	return NOTE_LINK_PATH.test(href);
}

export function noteLinkMarkdown(label: string, href: string): string {
	return `[${label.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]')}](${href})`;
}
