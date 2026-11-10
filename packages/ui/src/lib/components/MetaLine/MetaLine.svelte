<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Part = string | Snippet | null | undefined | false;

	type Props = HTMLAttributes<HTMLSpanElement> & {
		parts?: Part[];
		text?: string;
	};

	const SEPARATOR = ' · ';
	const SPACE = ' ';

	let { class: className, parts, text, ...rest }: Props = $props();

	let shown = $derived(
		(parts ?? text?.split(SEPARATOR) ?? []).filter(
			(part): part is string | Snippet => typeof part === 'function' || !!part
		)
	);
</script>

<span class={['meta-line', className]} {...rest}>
	{#each shown as part, index (index)}
		{#if index > 0}
			{SPACE}<span class="separator" aria-hidden="true">·</span>{SPACE}
		{/if}
		<span class="part">
			{#if typeof part === 'string'}
				{part}
			{:else}
				{@render part()}
			{/if}
		</span>
	{/each}
</span>

<style>
	.meta-line {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		max-width: 100%;
	}

	.separator {
		padding-inline: var(--spacing-2);
	}

	.part {
		min-width: 0;
	}
</style>
