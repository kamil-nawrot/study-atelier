declare global {
	namespace App {
		interface PageState {
			email?: string;
			glossaryMessage?: string;
			highlight?: number;
			saved?: number;
			timelineEvent?: { message: string; yearFrom: number | null; yearTo: number };
			trashed?: number;
			valueMessage?: string;
		}

		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}
	}
}

export {};
