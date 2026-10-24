<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import type { Mention } from '#lib/notes/mentions-data/mentions-data.ts';

	type Props = {
		mentions: Mention[];
		heading?: string;
		variant?: 'caption' | 'label';
	};

	let { mentions, heading = m.mentions.heading, variant = 'caption' }: Props = $props();

	const headingId = $props.id();
</script>

{#if mentions.length > 0}
	<section aria-labelledby={headingId}>
		<h2 id={headingId} class={variant}>{heading}</h2>
		<ul>
			{#each mentions as mention (mention.href)}
				<li>
					<a href={mention.href}>{mention.name}</a>
					<span class="kind">{mention.kind}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	section,
	ul {
		display: grid;
		gap: var(--spacing-2);
	}

	ul {
		margin: 0;
		padding: 0;
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

	.kind,
	.caption {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.caption {
		font-weight: var(--font-weight-regular);
	}

	.label {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}
</style>
