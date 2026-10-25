<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Icon, Tag } from '@study-atelier/ui';
	import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		session: ReviewSession;
		onstop: () => void;
	};

	let { session, onstop }: Props = $props();
</script>

<div class="session-bar">
	<button class="stop" onclick={onstop} type="button">
		<Icon icon={X} />
		{m.review.stop}
	</button>
	{#if session.free}
		<Tag>{m.review.freeTag}</Tag>
	{/if}
	<div
		class="progress"
		aria-label={m.review.progressLabel}
		aria-valuemax={session.queue.length}
		aria-valuemin={0}
		aria-valuenow={session.position}
		role="progressbar"
	>
		<span class="caption">
			{m.review.progress(
				Math.min(session.position + 1, session.queue.length),
				session.queue.length
			)}
		</span>
		<span class="track" aria-hidden="true">
			<span
				style:width="{(session.position / Math.max(1, session.queue.length)) * 100}%"
				class="fill"
			></span>
		</span>
	</div>
</div>

<style>
	.stop {
		display: flex;
		align-self: stretch;
		align-items: center;
		gap: var(--spacing-2);
		padding: 0 var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		cursor: pointer;
	}

	.session-bar {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		min-width: 0;
	}

	.progress {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.progress .caption {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.track {
		display: none;
		width: 160px;
		height: var(--border-width-button);
		background: var(--color-tag);
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--color-fg);
	}

	@media (min-width: 768px) {
		.track {
			display: block;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.fill {
			transition: width var(--duration-short) ease-out;
		}
	}
</style>
