declare global {
	namespace App {
		interface PageState {
			email?: string;
			glossaryMessage?: string;
			highlight?: number;
			saved?: number;
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
