import type { H3, HTTPMethod, EventHandler, RouteOptions } from 'h3';
import { join } from 'path';

interface RouteConfig {
    method: HTTPMethod;
    path: string;
    handler: EventHandler<any>;
    options?: RouteOptions;
}

export function bindRoutes(
    app: H3,
    { namespace, routes }: { namespace?: string; routes: RouteConfig[] }
) {
    for (const { method, path, handler, options } of routes) {
        app.on(
            method,
            namespace ? join('/', namespace, path) : path,
            handler,
            options
        );
    }
}
