<script lang="ts">
	import AtSign from '@lucide/svelte/icons/at-sign';
	import { Disclosure } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { Mention } from '#lib/notes/types/mention.ts';

	type Props = {
		mentions: Mention[];
		heading?: string;
	};

	let { mentions, heading = m.mentions.heading }: Props = $props();
</script>

{#if mentions.length > 0}
	<Disclosure count={mentions.length} icon={AtSign} muted open={false} title={heading}>
		<ul>
			{#each mentions as mention (mention.href)}
				<li>
					<a href={mention.href}>{mention.name}</a>
					<span class="kind">{mention.kind}</span>
				</li>
			{/each}
		</ul>
	</Disclosure>
{/if}

<style>
	ul {
		display: grid;
		gap: var(--spacing-2);
		margin: 0;
		list-style: none;
	}

	li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-1) var(--spacing-3);
	}

	a {
		color: var(--color-fg);
		text-decoration-color: var(--color-fg-muted);
		text-underline-offset: var(--spacing-1);
	}

	.kind {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
