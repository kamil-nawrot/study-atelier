import { createRawSnippet } from 'svelte';

export function html(markup: string) {
	return createRawSnippet(() => ({ render: () => markup }));
}

export function text(content: string) {
	return html(`<span>${content}</span>`);
}
