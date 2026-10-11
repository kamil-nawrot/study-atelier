<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		onsubmit: () => void | Promise<void>;
		children: Snippet;
	};

	let { onsubmit, children }: Props = $props();

	function handleSubmit(event: SubmitEvent): void {
		event.preventDefault();
		onsubmit();
	}
</script>

<form novalidate onsubmit={handleSubmit}>
	{@render children()}
</form>

<style>
	form {
		display: grid;
		gap: var(--spacing-6);
	}
</style>
