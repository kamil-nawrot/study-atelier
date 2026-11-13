<script lang="ts">
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import { Icon, PopupButton } from '@study-atelier/ui';
	import type { MoreAction } from '#lib/shared/types/more-action.ts';

	type Props = {
		label: string;
		actions: readonly MoreAction[];
	};

	let { label, actions }: Props = $props();

	let popup: ReturnType<typeof PopupButton> | undefined = $state();

	function run(action: MoreAction): void {
		popup?.close();
		action.onclick?.();
	}
</script>

<PopupButton bind:this={popup} align="end" {label}>
	{#snippet trigger()}
		<Icon icon={Ellipsis} />
	{/snippet}
	<ul class="actions">
		{#each actions as action (action.label)}
			<li>
				{#if action.reason}
					<span class="action" aria-disabled="true">
						<Icon icon={action.icon} size="sm" />
						<span class="text">
							{action.label}
							<span class="reason">{action.reason}</span>
						</span>
					</span>
				{:else if action.href}
					{@const href = action.href}
					<a class="action" class:danger={action.danger} {href}>
						<Icon icon={action.icon} size="sm" />
						<span class="text">{action.label}</span>
					</a>
				{:else}
					<button
						class="action"
						class:danger={action.danger}
						onclick={() => run(action)}
						type="button"
					>
						<Icon icon={action.icon} size="sm" />
						<span class="text">{action.label}</span>
					</button>
				{/if}
			</li>
		{/each}
	</ul>
</PopupButton>

<style>
	.actions {
		display: grid;
		min-width: calc(5 * var(--size-control));
		margin: 0;
		list-style: none;
	}

	.action {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-3);
		width: 100%;
		min-height: var(--size-control);
		padding: var(--spacing-3) var(--spacing-2);
		border: none;
		background: none;
		color: var(--color-fg);
		font: inherit;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.action.danger {
		color: var(--color-danger);
	}

	.action[aria-disabled='true'] {
		color: var(--color-fg-muted);
		cursor: default;
	}

	.text {
		display: grid;
		gap: var(--spacing-1);
	}

	.reason {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}
</style>
