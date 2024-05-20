/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { optimizeImage } from 'wasm-image-optimization';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// パスパラメータを取得する
		const pathParameters = url.pathname.split('/');
		const filename = pathParameters.pop();
		const type = pathParameters.pop();

		// クエリパラメータを取得する
		const queryParams = url.searchParams;
		const w = queryParams.get('w');
		const q = queryParams.get('q');
		const width = w ? parseInt(w) : undefined;
		const quality = q ? parseInt(q) : undefined;

		const r2 = env.R2;
		const object = await r2.get(`${type}/${filename}`);

		if (object == null) {
			return new Response('404 Not Found', {
				status: 404,
				statusText: 'Not Found',
			});
		}

		const buffer = await object.arrayBuffer();
		const image = await optimizeImage({
			image: buffer,
			width: width,
			quality: quality,
			format: 'webp',
		});

		const response = new Response(image, {
			headers: {
				'Content-Type': 'image/webp',
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		});

		return response;
	},
};
