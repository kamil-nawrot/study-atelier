<script lang="ts" module>
	import { overlayScrollbar } from '../overlay-scrollbar.ts';
	export type TabOption = {
		value: string;
		label: string;
		end?: boolean;
	};
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		tabs: readonly TabOption[];
		value?: string;
		children: Snippet;
	};

	let { label, tabs, value = $bindable(), children }: Props = $props();

	const id = $props.id();

	let active = $derived(tabs.find((tab) => tab.value === value) ?? tabs[0]);

	function tabId(tab: TabOption): string {
		return `${id}-tab-${tab.value}`;
	}

	function select(tab: TabOption): void {
		value = tab.value;
	}

	function move(event: KeyboardEvent, index: number): void {
		const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
		let next: number;
		if (event.key in steps) next = (index + steps[event.key] + tabs.length) % tabs.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = tabs.length - 1;
		else return;
		event.preventDefault();
		select(tabs[next]);
		document.getElementById(tabId(tabs[next]))?.focus();
	}
</script>

<div class="tabs">
	<div class="list" {@attach overlayScrollbar('x')} aria-label={label} role="tablist">
		{#each tabs as tab, index (tab.value)}
			<button
				id={tabId(tab)}
				class="tab"
				class:end={tab.end}
				aria-controls="{id}-panel"
				aria-selected={tab === active}
				onclick={() => select(tab)}
				onkeydown={(event) => move(event, index)}
				role="tab"
				tabindex={tab === active ? 0 : -1}
				type="button"
			>
				{tab.label}
			</button>
		{/each}
	</div>
	<div id="{id}-panel" class="panel" aria-labelledby={tabId(active)} role="tabpanel" tabindex="0">
		{@render children()}
	</div>
</div>

<style>
	.tabs {
		display: grid;
		gap: var(--spacing-6);
	}

	.list {
		display: flex;
		gap: var(--spacing-6);
		overflow-x: auto;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	.tab {
		flex: none;
		padding: var(--spacing-3) 0;
		border: none;
		border-bottom: var(--border-width-button) solid transparent;
		background: none;
		color: var(--color-fg-muted);
		font-family: inherit;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-md);
		white-space: nowrap;
		cursor: pointer;
	}

	.tab.end {
		margin-inline-start: auto;
	}

	.tab:hover {
		color: var(--color-fg);
	}

	.tab[aria-selected='true'] {
		border-bottom-color: var(--color-fg);
		color: var(--color-fg);
	}

	.panel:focus-visible {
		outline: var(--border-width-button) solid var(--color-fg);
		outline-offset: var(--spacing-1);
	}
</style>
