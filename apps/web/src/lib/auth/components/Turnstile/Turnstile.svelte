<script lang="ts">
	import { TURNSTILE_SITE_KEY } from '$app/env/public';
	import { locale } from '#lib/i18n/i18n.ts';
	import { loadTurnstile, pageTheme, type TurnstileApi } from '#lib/auth/turnstile/turnstile.ts';

	type Props = {
		sitekey?: string;
		timeout?: number;
	};

	let { sitekey = TURNSTILE_SITE_KEY, timeout = 15000 }: Props = $props();

	const RETRY_MS = 1500;

	let container = $state<HTMLDivElement>();
	let interactive = $state(false);
	let api: TurnstileApi | undefined;
	let widgetId: string | undefined;
	let token: string | undefined;
	let failed = false;
	let unavailable = false;
	let attempt = $state(0);
	let waiting: ((value: string | undefined) => void)[] = [];

	function settle(value: string | undefined): void {
		const pending = waiting;
		waiting = [];
		for (const resolve of pending) resolve(value);
	}

	$effect(() => {
		const element = container;
		void attempt;
		if (!sitekey || !element) return;
		let active = true;
		loadTurnstile()
			.then((loaded) => {
				if (!active) return;
				api = loaded;
				widgetId = loaded.render(element, {
					sitekey,
					appearance: 'interaction-only',
					size: 'flexible',
					theme: pageTheme(),
					language: locale,
					callback: (value) => {
						token = value;
						failed = false;
						settle(value);
					},
					'expired-callback': () => {
						token = undefined;
					},
					'error-callback': () => {
						token = undefined;
						failed = true;
					},
					'retry-interval': RETRY_MS,
					'before-interactive-callback': () => {
						interactive = true;
					},
					'after-interactive-callback': () => {
						interactive = false;
					}
				});
			})
			.catch(() => {
				unavailable = true;
				settle(undefined);
			});
		return () => {
			active = false;
			if (api && widgetId) api.remove(widgetId);
			api = undefined;
			widgetId = undefined;
		};
	});

	export function getToken(): Promise<string | undefined> {
		if (!sitekey) return Promise.resolve(undefined);
		if (token) return Promise.resolve(token);
		if (unavailable) {
			unavailable = false;
			attempt += 1;
			return Promise.resolve(undefined);
		}
		if (failed && api && widgetId) {
			failed = false;
			api.reset(widgetId);
		}
		return new Promise((resolve) => {
			const done = (value: string | undefined): void => {
				clearTimeout(timer);
				resolve(value);
			};
			let timer: ReturnType<typeof setTimeout>;
			const expire = (): void => {
				if (interactive) {
					timer = setTimeout(expire, timeout);
					return;
				}
				waiting = waiting.filter((entry) => entry !== done);
				resolve(undefined);
			};
			timer = setTimeout(expire, timeout);
			waiting.push(done);
		});
	}

	export function reset(): void {
		token = undefined;
		failed = false;
		if (api && widgetId) api.reset(widgetId);
	}
</script>

{#if sitekey}
	<div bind:this={container} class="turnstile" class:visually-hidden={!interactive}></div>
{/if}
