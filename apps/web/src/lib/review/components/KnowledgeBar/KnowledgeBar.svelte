<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import type { AtelierKnowledge } from '#lib/review/types/atelier-knowledge.ts';

	type Props = {
		knowledge: AtelierKnowledge;
	};

	let { knowledge }: Props = $props();

	const GROUPS = ['settled', 'learning', 'fresh'] as const;
</script>

<span class="bar" aria-hidden="true">
	{#each GROUPS as group (group)}
		<span style:flex-grow={knowledge[group]} class="segment {group}"></span>
	{/each}
</span>
<dl class="groups">
	{#each GROUPS as group (group)}
		<div class="group">
			<dt>
				<span class="swatch {group}" aria-hidden="true"></span>
				{m.review.knowledgeGroups[group].label}
			</dt>
			<dd class="number">{knowledge[group]}</dd>
			<dd class="caption hint">{m.review.knowledgeGroups[group].hint}</dd>
		</div>
	{/each}
</dl>

<style>
	.bar {
		display: flex;
		gap: var(--border-width-hairline);
		height: var(--spacing-2);
	}

	.segment {
		flex-basis: 0;
	}

	.settled {
		background: var(--color-fg);
	}

	.learning {
		background: var(--color-fg-muted);
	}

	.fresh {
		background: var(--color-tag);
	}

	.groups {
		display: grid;
		gap: var(--spacing-3);
	}

	.group {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0 var(--spacing-4);
		align-items: baseline;
	}

	dt {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.swatch {
		flex: none;
		width: var(--spacing-2);
		height: var(--spacing-2);
	}

	.number {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		font-variant-numeric: tabular-nums;
	}

	.hint {
		grid-column: 1 / -1;
		padding-left: var(--spacing-4);
	}
</style>
