<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Icon, MetaLine } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import type { ValueSummary } from '#lib/card-index/types/value-summary.ts';

	type Props = {
		kind: string;
		parent?: string;
		name: string;
		summary: ValueSummary;
		href?: ResolvedPathname;
	};

	let { kind, parent, name, summary, href }: Props = $props();
</script>

<span class="overline"><MetaLine parts={[kind, parent]} /></span>
<span class="name">{name}</span>
{#if summary.lifeYears}
	<span class="years">{summary.lifeYears}</span>
{/if}
<span class="summary">{summary.summary}</span>
{#if href}
	<a class="open" {href}>
		{m.cardIndex.openInCardIndex}
		<Icon icon={ArrowRight} size="sm" />
	</a>
{/if}

<style>
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

	.open {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
		padding-top: var(--spacing-3);
		border-top: var(--border-width-base) solid var(--color-line);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		text-decoration: none;
	}

	.open:hover {
		text-decoration: underline;
	}
</style>
