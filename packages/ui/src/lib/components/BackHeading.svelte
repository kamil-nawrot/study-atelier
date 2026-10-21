<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		backLabel: string;
		href: string;
		onclick?: (event: MouseEvent) => void;
	};

	let { title, backLabel, href, onclick }: Props = $props();
</script>

<div class="heading">
	<a class="back" aria-label={backLabel} {href} {onclick}>
		<Icon icon={ArrowLeft} />
	</a>
	<h1>{title}</h1>
</div>

<style>
	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.back {
		display: grid;
		place-items: center;
		flex: none;
		padding-block: var(--spacing-2);
		color: var(--color-fg);
	}

	h1 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}
</style>
