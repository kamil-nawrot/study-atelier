<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import type { HTMLFormAttributes } from 'svelte/elements';

	type Props = Omit<HTMLFormAttributes, 'onsubmit'> & {
		onsubmit: () => void | Promise<void>;
		children: Snippet;
	};

	let { onsubmit, children, ...rest }: Props = $props();

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		await onsubmit();
		await tick();
		const invalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
		invalid?.focus({ preventScroll: true });
		invalid?.scrollIntoView({ block: 'center' });
	}
</script>

<form novalidate onsubmit={handleSubmit} {...rest}>
	{@render children()}
</form>

<style>
	form {
		display: grid;
		gap: var(--spacing-6);
	}
</style>
