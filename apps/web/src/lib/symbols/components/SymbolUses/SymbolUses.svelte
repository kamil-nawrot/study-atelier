<script lang="ts">
	import { Disclosure } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { SymbolUse } from '#lib/symbols/types/symbol-use.ts';

	type Props = {
		title: string;
		uses: readonly SymbolUse[];
	};

	let { title, uses }: Props = $props();
</script>

{#if uses.length > 0}
	<section aria-label={title}>
		<Disclosure count={uses.length} room {title}>
			<ul class="uses">
				{#each uses as use (`${use.symbolId}:${use.meaning}`)}
					<li>
						<a
							class="name"
							href={resolve('/(app)/atelier/glossary/symbols/[id]', { id: use.symbolId })}
							>{use.name}</a
						>
						<span class="meaning">{use.meaning}</span>
					</li>
				{/each}
			</ul>
		</Disclosure>
	</section>
{/if}

<style>
	.uses {
		margin: 0;
		padding: 0;
		list-style: none;
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1) var(--spacing-4);
		padding-block: var(--spacing-3);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.name {
		color: var(--color-fg);
		font-style: italic;
		text-decoration: none;
	}

	.name:hover {
		text-decoration: underline;
	}

	.meaning {
		color: var(--color-fg-muted);
	}
</style>
