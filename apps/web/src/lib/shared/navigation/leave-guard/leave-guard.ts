import { beforeNavigate, goto } from '$app/navigation';
import type { ResolvedPathname } from '$app/types';

type LeaveGuard = {
	blocks: () => boolean;
	asking: () => boolean;
	confirm: () => Promise<boolean>;
};

export function guardLeaving({ blocks, asking, confirm }: LeaveGuard): void {
	beforeNavigate((navigation) => {
		if (!blocks()) return;
		navigation.cancel();
		const url = navigation.to?.url;
		if (navigation.type === 'leave' || !url || asking()) return;
		const target = `${url.pathname}${url.search}${url.hash}` as ResolvedPathname;
		const popstate = navigation.type === 'popstate' ? navigation.delta : null;
		void confirm().then((leave) => {
			if (!leave) return;
			if (popstate === null) void goto(target);
			else history.go(popstate);
		});
	});
}
