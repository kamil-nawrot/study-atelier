<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import Tooltip from './Tooltip.svelte';

	type Props = {
		label: string;
		trigger: Snippet;
		children: Snippet;
		disabled?: boolean;
		align?: 'start' | 'end';
		tooltip?: boolean;
	};

	let {
		label,
		trigger,
		children,
		disabled = false,
		align = 'start',
		tooltip = false
	}: Props = $props();

	const id = $props.id();
	const panelId = `${id}-panel`;

	let open = $state(false);
	let root: HTMLElement | undefined = $state();

	function close(): void {
		open = false;
		root?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
	}

	function onkeydown(event: KeyboardEvent): void {
		if (event.key !== 'Escape' || !open) return;
		event.preventDefault();
		close();
	}

	function closeOutside(element: HTMLElement): () => void {
		const pointerdown = (event: PointerEvent): void => {
			if (open && !element.contains(event.target as Node)) open = false;
		};
		document.addEventListener('pointerdown', pointerdown);
		return () => document.removeEventListener('pointerdown', pointerdown);
	}
</script>

<div bind:this={root} class="popup" {@attach closeOutside}>
	{#snippet control(describedby?: string)}
		<Button
			aria-controls={panelId}
			aria-describedby={describedby}
			aria-expanded={open}
			aria-haspopup="dialog"
			aria-label={label}
			{disabled}
			onclick={() => (open = !open)}
			{onkeydown}
		>
			{@render trigger()}
		</Button>
	{/snippet}
	{#if tooltip}
		<Tooltip {align} placement="bottom" text={label}>
			{#snippet children(id)}
				{@render control(id)}
			{/snippet}
		</Tooltip>
	{:else}
		{@render control()}
	{/if}
	<div
		id={panelId}
		class="panel"
		class:end={align === 'end'}
		aria-label={label}
		hidden={!open}
		{onkeydown}
		role="dialog"
		tabindex="-1"
	>
		{@render children()}
	</div>
</div>

<style>
	.popup {
		position: relative;
		display: flex;
	}

	.panel {
		position: absolute;
		top: calc(100% + var(--spacing-2));
		left: 0;
		z-index: 2;
		padding: var(--spacing-4);
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-bg);
	}

	.panel.end {
		right: 0;
		left: auto;
	}

	.panel[hidden] {
		display: none;
	}
</style>
