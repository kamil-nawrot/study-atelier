<script lang="ts">
	import PrimerCoat from '../PrimerCoat/PrimerCoat.svelte';
</script>

<div class="primer" aria-hidden="true">
	<div class="coats">
		<PrimerCoat direction="horizontal" />
		<PrimerCoat direction="vertical" />
	</div>
</div>

<style>
	.primer {
		--stroke-weak: color-mix(in srgb, currentColor 5%, transparent);
		--stroke-mid: color-mix(in srgb, currentColor 9%, transparent);
		--stroke-strong: color-mix(in srgb, currentColor 13%, transparent);
		--bristles:
			var(--stroke-mid) 0 1px, var(--stroke-strong) 1px 2px, var(--stroke-mid) 2px 4px,
			var(--stroke-weak) 4px 5px, var(--stroke-strong) 5px 7px, var(--stroke-mid) 7px 9px;
		--band: linear-gradient(#000, #000);
		--band-width: calc(25% + 1px);

		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		animation: appear 0s var(--duration-loading-delay) both;
	}

	.coats {
		position: absolute;
		inset: 0;
	}

	@keyframes appear {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.coats {
			animation: fade 5.6s linear infinite;
		}
	}

	@keyframes fade {
		0%,
		84% {
			opacity: 1;
		}

		94%,
		100% {
			opacity: 0;
		}
	}
</style>
