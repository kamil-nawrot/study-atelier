declare global {
	namespace App {
		interface PageState {
			email?: string;
			highlight?: number;
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
