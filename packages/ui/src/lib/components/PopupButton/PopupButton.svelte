<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Button from '../Button/Button.svelte';
	import StageButton from '../StageButton/StageButton.svelte';
	import Tooltip from '../Tooltip/Tooltip.svelte';

	type Props = {
		label: string;
		trigger?: Snippet;
		stageIcon?: LucideIcon;
		children: Snippet;
		disabled?: boolean;
		align?: 'start' | 'end';
		tooltip?: boolean;
		bare?: boolean;
		placement?: 'bottom' | 'top';
		hover?: boolean;
	};

	let {
		label,
		trigger,
		stageIcon,
		children,
		disabled = false,
		align = 'start',
		tooltip = false,
		bare = false,
		placement = 'bottom',
		hover = false
	}: Props = $props();

	const id = $props.id();
	const panelId = `${id}-panel`;

	const pointer = new MediaQuery('(hover: hover) and (pointer: fine)');

	let open = $state(false);
	let pinned = $state(false);
	let hovered = $state(false);
	let root: HTMLElement | undefined = $state();
	let leaving: ReturnType<typeof setTimeout> | undefined;

	let hovering = $derived(hover && pointer.current && !disabled);

	export function close(): void {
		hide();
		root?.querySelector<HTMLElement>('[aria-haspopup]')?.focus();
	}

	function hide(): void {
		clearTimeout(leaving);
		open = false;
		pinned = false;
		hovered = false;
	}

	function toggle(): void {
		clearTimeout(leaving);
		hovered = false;
		if (hovering && open && !pinned) {
			pinned = true;
			return;
		}
		open = !open;
		pinned = open;
	}

	function onpointerenter(event: PointerEvent): void {
		if (!hovering || event.pointerType !== 'mouse') return;
		clearTimeout(leaving);
		if (!open) hovered = true;
		open = true;
	}

	function onpointerleave(event: PointerEvent): void {
		if (!open || pinned || event.pointerType !== 'mouse') return;
		leaving = setTimeout(hide, 150);
	}

	function onkeydown(event: KeyboardEvent): void {
		if (event.key !== 'Escape' || !open) return;
		event.preventDefault();
		close();
	}

	function closeOutside(element: HTMLElement): () => void {
		const pointerdown = (event: PointerEvent): void => {
			if (open && !element.contains(event.target as Node)) hide();
		};
		const keydown = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' && open && !element.contains(document.activeElement)) hide();
		};
		document.addEventListener('pointerdown', pointerdown);
		document.addEventListener('keydown', keydown);
		return () => {
			clearTimeout(leaving);
			document.removeEventListener('pointerdown', pointerdown);
			document.removeEventListener('keydown', keydown);
		};
	}
</script>

<div
	bind:this={root}
	class="popup"
	class:bare
	{@attach closeOutside}
	{onpointerenter}
	{onpointerleave}
	role="presentation"
>
	{#snippet control(describedby?: string)}
		<Button
			aria-controls={panelId}
			aria-describedby={describedby}
			aria-expanded={open}
			aria-haspopup="dialog"
			aria-label={label}
			{disabled}
			onclick={toggle}
			{onkeydown}
		>
			{@render trigger?.()}
		</Button>
	{/snippet}
	{#if bare}
		<button
			class="trigger"
			aria-controls={panelId}
			aria-expanded={open}
			aria-haspopup="dialog"
			aria-label={label}
			{disabled}
			onclick={toggle}
			{onkeydown}
			type="button"
		>
			{@render trigger?.()}
		</button>
	{:else if stageIcon}
		<StageButton
			active={open}
			aria-controls={panelId}
			aria-expanded={open}
			aria-haspopup="dialog"
			{disabled}
			icon={stageIcon}
			{label}
			onclick={toggle}
			{onkeydown}
		/>
	{:else if tooltip}
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
		class:delayed={hovered}
		class:end={align === 'end'}
		class:top={placement === 'top'}
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

	.popup.bare {
		position: static;
	}

	.trigger {
		display: flex;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
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

	.panel.top {
		top: auto;
		bottom: calc(100% + var(--spacing-2));
	}

	@media (prefers-reduced-motion: no-preference) {
		.panel.delayed {
			animation: hover-reveal var(--duration-short) ease-out var(--hover-reveal-delay) backwards;
		}
	}

	@keyframes hover-reveal {
		from {
			opacity: 0;
			visibility: hidden;
		}
	}

	.panel[hidden] {
		display: none;
	}
</style>
