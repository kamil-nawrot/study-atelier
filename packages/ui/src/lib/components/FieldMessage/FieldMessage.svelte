<script lang="ts">
	type Props = {
		id: string;
		hint?: string;
		error?: string;
		live?: boolean;
	};

	let { id, hint, error, live = false }: Props = $props();
</script>

<span {id} class="message" class:error={!!error} aria-live={live ? 'polite' : undefined}>
	{error || hint || ''}
</span>

<style>
	.message {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.message.error {
		color: var(--color-danger);
	}
</style>
