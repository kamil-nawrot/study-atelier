export const VERSION_POLL_INTERVAL = 10 * 60 * 1000;

const RELOADED_TYPES = new Set(['link', 'popstate']);

type Reloading = Pick<Location, 'assign' | 'replace'>;

type Navigation = {
	to: { url: URL } | null;
	type: string;
};

export function loadNewVersion(
	navigation: Navigation,
	updated: boolean,
	target: Reloading = location
): Promise<never> | undefined {
	if (!updated || !navigation.to || !RELOADED_TYPES.has(navigation.type)) return undefined;
	const { href } = navigation.to.url;
	if (navigation.type === 'popstate') target.replace(href);
	else target.assign(href);
	return new Promise(() => {});
}

export function actionBarHeight(root: ParentNode = document): number {
	const bar = root.querySelector<HTMLElement>('[data-action-bar]');
	return bar?.offsetHeight ?? 0;
}
