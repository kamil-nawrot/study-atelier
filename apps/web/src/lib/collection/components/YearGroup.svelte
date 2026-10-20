<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		labelFor?: string;
		columns?: boolean;
		aside: Snippet;
		children: Snippet;
	};

	let { title, labelFor, columns = false, aside, children }: Props = $props();

	const titleId = $props.id();
</script>

<div class="group" aria-labelledby={titleId} role="group">
	<div class="head">
		<svelte:element this={labelFor ? 'label' : 'span'} id={titleId} class="title" for={labelFor}>
			{title}
		</svelte:element>
		<div class="aside">
			{@render aside()}
		</div>
	</div>
	<div class="inputs" class:columns>
		{@render children()}
	</div>
</div>

<style>
	.group {
		display: grid;
		gap: var(--spacing-2);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--spacing-3);
	}

	.title {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.aside {
		display: flex;
		align-items: center;
		gap: var(--spacing-4);
	}

	.inputs {
		display: grid;
		gap: var(--spacing-3);
	}

	.inputs.columns {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-4);
	}
</style>
