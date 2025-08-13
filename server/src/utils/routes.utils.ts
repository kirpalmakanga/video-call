import { Router, type RequestHandler } from 'express';

type RouteMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

interface RouteConfig {
    method: RouteMethod;
    path: string;
    handler: RequestHandler;
    middlewares?: RequestHandler[];
}

export function createRouter(routeConfigs: RouteConfig[]) {
    if (routeConfigs.length) {
        const router = Router();

        for (const {
            method,
            path,
            handler,
            middlewares = []
        } of routeConfigs) {
            router[method](path, ...middlewares, handler);
        }

        return router;
    } else {
        throw new Error('routeConfigs is empty.');
    }
}
