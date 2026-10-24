<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import type { ValueSummary } from '#lib/card-index/value-summaries/value-summaries.ts';

	type Props = {
		kind: string;
		parent?: string;
		name: string;
		summary: ValueSummary;
	};

	let { kind, parent, name, summary }: Props = $props();
</script>

<span class="kind">{parent ? m.valuePage.header(kind, parent) : kind}</span>
<span class="name">{name}</span>
{#if summary.lifeYears}
	<span class="years">{summary.lifeYears}</span>
{/if}
<span class="summary">{summary.summary}</span>

<style>
	.kind {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.years {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.summary {
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
