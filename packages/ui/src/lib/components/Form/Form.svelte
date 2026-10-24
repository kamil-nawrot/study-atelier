<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import Alert from '../Alert/Alert.svelte';

	type Props = Omit<HTMLFormAttributes, 'onsubmit'> & {
		onsubmit: () => void | Promise<void>;
		error?: string;
		errorTitle?: string;
		children: Snippet;
	};

	let { onsubmit, error, errorTitle, children, ...rest }: Props = $props();

	const formId = $props.id();
	const errorId = `${formId}-error`;

	$effect(() => {
		if (!error) return;
		document.getElementById(errorId)?.scrollIntoView({ block: 'center' });
	});

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
	{#if error}
		<Alert id={errorId} title={errorTitle} tone="danger">{error}</Alert>
	{/if}
	{@render children()}
</form>

<style>
	form {
		display: grid;
		gap: var(--spacing-6);
	}
</style>
