<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		rule?: boolean;
		children: Snippet;
	};

	let { title, rule = false, children }: Props = $props();

	const headingId = $props.id();
</script>

<section class:rule aria-labelledby={headingId}>
	<div class="content">
		<h2 id={headingId}>{title}</h2>
		{@render children()}
	</div>
</section>

<style>
	.rule {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.content {
		display: grid;
		gap: var(--spacing-4);
		max-width: var(--size-content-default);
	}
</style>
