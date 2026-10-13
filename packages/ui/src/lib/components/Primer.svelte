<div class="primer" aria-hidden="true">
	<div class="coats">
		<div class="coat horizontal"></div>
		<div class="coat vertical"></div>
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

	.coats,
	.coat {
		position: absolute;
		inset: 0;
	}

	.coat {
		mask-image: var(--band), var(--band), var(--band), var(--band);
		mask-repeat: no-repeat;
		mask-size: 100% 100%;
	}

	.horizontal {
		background: repeating-linear-gradient(180deg, var(--bristles));
		mask-position:
			0 0,
			100% 33.333%,
			0 66.667%,
			100% 100%;
	}

	.vertical {
		background: repeating-linear-gradient(90deg, var(--bristles));
		mask-position:
			0 0,
			33.333% 100%,
			66.667% 0,
			100% 100%;
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

		.horizontal {
			animation: horizontal-coat 5.6s linear infinite;
		}

		.vertical {
			animation: vertical-coat 5.6s linear infinite;
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

	@keyframes horizontal-coat {
		0%,
		3% {
			mask-size:
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}

		11%,
		12% {
			mask-size:
				100% var(--band-width),
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}

		20%,
		21% {
			mask-size:
				100% var(--band-width),
				100% var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}

		29%,
		30% {
			mask-size:
				100% var(--band-width),
				100% var(--band-width),
				100% var(--band-width),
				0 var(--band-width);
		}

		38%,
		99.9% {
			mask-size:
				100% var(--band-width),
				100% var(--band-width),
				100% var(--band-width),
				100% var(--band-width);
		}

		100% {
			mask-size:
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width),
				0 var(--band-width);
		}
	}

	@keyframes vertical-coat {
		0%,
		40% {
			mask-size:
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0;
		}

		48%,
		49% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0;
		}

		57%,
		58% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 0,
				var(--band-width) 0;
		}

		66%,
		67% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 0;
		}

		75%,
		99.9% {
			mask-size:
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 100%,
				var(--band-width) 100%;
		}

		100% {
			mask-size:
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0,
				var(--band-width) 0;
		}
	}
</style>
