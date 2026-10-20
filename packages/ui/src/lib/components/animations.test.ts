import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const directory = new URL('./', import.meta.url);
const components = readdirSync(directory).filter(
	(file) => file.endsWith('.svelte') && !file.endsWith('.stories.svelte')
);

function shorthandsWithoutKeyframes(source: string): string[] {
	const keyframes = [...source.matchAll(/@keyframes\s+([\w-]+)/g)].map((match) => match[1]);
	return [...source.matchAll(/[\s;{]animation\s*:\s*([^;]+);/g)]
		.map((match) => match[1].trim())
		.filter((value) => !value.split(/\s+/).some((token) => keyframes.includes(token)));
}

describe('component animations', () => {
	it.each(components)('%s names its keyframes in every animation shorthand', (file) => {
		const source = readFileSync(new URL(file, directory), 'utf8');

		expect(shorthandsWithoutKeyframes(source)).toEqual([]);
	});

	it('finds a shorthand that leaves the name to another rule', () => {
		expect(
			shorthandsWithoutKeyframes(
				'.coat { animation: 5.6s linear infinite; } .horizontal { animation-name: coat; } @keyframes coat {}'
			)
		).toEqual(['5.6s linear infinite']);
	});
});
