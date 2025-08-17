import type { H3 } from 'h3';
import { index, show, insert, update } from '../controllers/rooms.controller';
import { bindRoutes } from '../utils/routes.utils';

export default function useRoomsRoutes(app: H3) {
    bindRoutes(app, {
        namespace: 'rooms',
        routes: [
            {
                method: 'GET',
                path: '/',
                handler: index,
                options: {
                    meta: { authenticated: true }
                }
            },
            {
                method: 'GET',
                path: '/:roomId',
                handler: show,
                options: {
                    meta: { authenticated: true }
                }
            },
            {
                method: 'POST',
                path: '/',
                handler: insert,
                options: {
                    meta: { authenticated: true }
                }
            },
            {
                method: 'PUT',
                path: '/:roomId',
                handler: update,
                options: {
                    meta: { authenticated: true }
                }
            }
        ]
    });
}
