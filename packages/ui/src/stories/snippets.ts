import { createRawSnippet, type Snippet } from 'svelte';

export function html(markup: string): Snippet {
	return createRawSnippet(() => ({ render: () => markup }));
}

export function text(content: string): Snippet {
	return html(`<span>${content}</span>`);
}
