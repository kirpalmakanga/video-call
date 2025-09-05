import app from './src/index';

towebh;

export default {
    fetch(request, env, ctx) {
        return app.request(request, env, ctx);
        // handler(request, {
        //     cloudflare: { env, ctx }
        // });
    }
};
