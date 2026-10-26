<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
</script>

<nav class="legal" aria-label={m.legal.linksLabel}>
	<a href={resolve('/(legal)/terms')}>{m.legal.terms}</a>
	<span aria-hidden="true">·</span>
	<a href={resolve('/(legal)/privacy')}>{m.legal.privacy}</a>
</nav>

<style>
	.legal {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
	}

	a {
		color: inherit;
	}
</style>
