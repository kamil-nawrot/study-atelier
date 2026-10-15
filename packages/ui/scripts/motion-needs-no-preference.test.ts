import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const pluginUrl = new URL('../../../stylelint/motion-needs-no-preference.js', import.meta.url);
const { default: plugin } = await import(pluginUrl.href);

async function problems(css: string): Promise<string[]> {
	const { results } = await stylelint.lint({
		code: css,
		config: {
			plugins: [plugin],
			rules: { 'study-atelier/motion-needs-no-preference': true }
		}
	});
	return results[0].warnings.map((warning) => warning.text);
}

describe('motion-needs-no-preference', () => {
	it('accepts a transition inside the no-preference query', async () => {
		expect(
			await problems(
				'@media (prefers-reduced-motion: no-preference) { .a { transition: width var(--duration-short); } }'
			)
		).toEqual([]);
	});

	it('accepts an animation nested deeper inside the no-preference query', async () => {
		expect(
			await problems(
				'@media (prefers-reduced-motion: no-preference) { @media (min-width: 768px) { .a { animation: spin 1s infinite; } } }'
			)
		).toEqual([]);
	});

	it('rejects a transition outside the query', async () => {
		expect(await problems('.a { transition: width var(--duration-short); }')).toEqual([
			'Put "transition" inside @media (prefers-reduced-motion: no-preference) (study-atelier/motion-needs-no-preference)'
		]);
	});

	it('rejects motion under the reduce query and longhand properties', async () => {
		expect(
			await problems(
				'@media (prefers-reduced-motion: reduce) { .a { animation: spin 1s; } } .b { transition-duration: 1s; }'
			)
		).toHaveLength(2);
	});

	it('accepts values that move nothing', async () => {
		expect(
			await problems(
				'.a { transition: none; animation: appear 0s var(--duration-loading-delay) both; } .b { animation: appear 0ms, fade 0s 1s; }'
			)
		).toEqual([]);
	});

	it('rejects a list where one animation moves', async () => {
		expect(await problems('.a { animation: appear 0s both, travel 1.4s infinite; }')).toHaveLength(
			1
		);
	});
});
