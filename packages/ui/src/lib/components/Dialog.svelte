<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import type { Snippet } from 'svelte';
	import { uiMessages } from '../messages';
	import Icon from './Icon.svelte';

	type Props = {
		title: string;
		open?: boolean;
		size?: 'default' | 'small';
		description?: string;
		closeLabel?: string;
		onclose?: () => void;
		children?: Snippet;
		footer?: Snippet;
	};

	let {
		title,
		open = $bindable(false),
		size = 'default',
		description,
		closeLabel = uiMessages().closeDialog,
		onclose,
		children,
		footer
	}: Props = $props();

	const id = $props.id();
	const titleId = `${id}-title`;
	const descriptionId = `${id}-description`;

	let dialog: HTMLDialogElement | undefined = $state();
	let opener: HTMLElement | null = null;

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			dialog.showModal();
			document.documentElement.style.overflow = 'hidden';
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	$effect(() => () => document.documentElement.style.removeProperty('overflow'));

	function onclosed(): void {
		document.documentElement.style.removeProperty('overflow');
		open = false;
		opener?.focus();
		opener = null;
		onclose?.();
	}
</script>

<dialog
	bind:this={dialog}
	class="dialog {size}"
	aria-describedby={description ? descriptionId : undefined}
	aria-labelledby={titleId}
	onclose={onclosed}
	role={size === 'small' ? 'alertdialog' : undefined}
>
	<header>
		<div class="heading">
			<h2 id={titleId}>{title}</h2>
			{#if description}
				<p id={descriptionId}>{description}</p>
			{/if}
		</div>
		{#if size === 'default'}
			<button
				class="close"
				aria-label={closeLabel}
				onclick={() => (open = false)}
				title={closeLabel}
				type="button"
			>
				<Icon icon={X} />
			</button>
		{/if}
	</header>
	{#if children}
		<div class="body">
			{@render children()}
		</div>
	{/if}
	{#if footer}
		<footer>
			{@render footer()}
		</footer>
	{/if}
</dialog>

<style>
	.dialog {
		flex-direction: column;
		width: 100%;
		max-width: var(--size-content-default);
		max-height: calc(100% - 2 * var(--spacing-4));
		padding: 0;
		border: var(--border-width-base) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: var(--color-bg);
		color: var(--color-fg);
	}

	.dialog[open] {
		display: flex;
	}

	.dialog::backdrop {
		background: var(--color-scrim);
	}

	@supports (backdrop-filter: blur(1px)) {
		.dialog::backdrop {
			backdrop-filter: blur(var(--blur-scrim));
		}
	}

	.small {
		max-width: min(var(--size-content-narrow), calc(100% - 2 * var(--spacing-4)));
	}

	.default {
		width: 100%;
		height: 100%;
		max-width: none;
		max-height: none;
		border: none;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--spacing-3);
		padding: var(--spacing-6) var(--spacing-6) 0;
	}

	.default header {
		align-items: center;
		padding: var(--spacing-3) var(--spacing-3) var(--spacing-3) var(--spacing-6);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
	}

	.heading {
		display: grid;
		gap: var(--spacing-1);
	}

	.heading p {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.close {
		display: grid;
		place-content: center;
		flex: none;
		padding: var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		cursor: pointer;
	}

	.close:hover {
		background: var(--color-surface);
	}

	.body {
		flex: 1;
		min-height: 0;
		padding: var(--spacing-6);
		overflow-y: auto;
	}

	.small .body {
		padding-top: var(--spacing-3);
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-3);
		padding: var(--spacing-4) var(--spacing-6);
	}

	.default footer {
		border-top: var(--border-width-hairline) solid var(--color-tag);
	}

	.small footer {
		padding-top: var(--spacing-3);
		padding-bottom: var(--spacing-6);
	}

	.small header + footer {
		padding-top: var(--spacing-6);
	}

	@media (min-width: 768px) {
		.default {
			height: fit-content;
			max-width: var(--size-content-default);
			max-height: calc(100% - 2 * var(--spacing-12));
			border: var(--border-width-base) solid var(--color-line);
		}

		.default header {
			padding: var(--spacing-4) var(--spacing-4) var(--spacing-3) var(--spacing-6);
		}
	}
</style>
