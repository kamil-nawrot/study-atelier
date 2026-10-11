<script lang="ts">
	import type { Snippet } from 'svelte';
	import { type AlertTone, uiMessages } from '../messages';

	type Props = {
		tone: AlertTone;
		label?: string;
		title?: string;
		children?: Snippet;
	};

	const messages = uiMessages();

	let { tone, label, title, children }: Props = $props();
</script>

<div class="alert {tone}" role={tone === 'danger' ? 'alert' : 'status'}>
	<div class="label">{label ?? messages.alert[tone]}</div>
	<div class="body">
		{#if title}
			<strong class="title">{title}</strong>
		{/if}
		{#if children}
			<div class="message">{@render children()}</div>
		{/if}
	</div>
</div>

<style>
	.alert {
		--alert-color: var(--color-fg);
		border: var(--border-width-base) solid var(--alert-color);
		border-radius: var(--border-radius-none);
		background: var(--color-surface);
		color: var(--color-fg);
	}

	.danger {
		--alert-color: var(--color-danger);
	}

	.warning {
		--alert-color: var(--color-warning);
	}

	.success {
		--alert-color: var(--color-success);
	}

	.label {
		padding: var(--spacing-1) var(--spacing-4);
		background: var(--alert-color);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.body {
		display: grid;
		gap: var(--spacing-1);
		padding: var(--spacing-3) var(--spacing-4);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.title {
		font-weight: var(--font-weight-bold);
	}
</style>
