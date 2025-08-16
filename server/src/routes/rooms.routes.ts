import type { H3 } from 'h3';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { createRoomSchema } from '../validation/rooms.validation';
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
                    middleware: [isAuthenticated]
                }
            },
            {
                method: 'GET',
                path: '/:roomId',
                handler: show,
                options: {
                    middleware: [isAuthenticated]
                }
            },
            {
                method: 'POST',
                path: '/',
                handler: insert,
                options: {
                    middleware: [
                        isAuthenticated,
                        validateBody(createRoomSchema)
                    ]
                }
            },
            {
                method: 'PUT',
                path: '/:roomId',
                handler: update,
                options: {
                    middleware: [
                        isAuthenticated,
                        validateBody(createRoomSchema)
                    ]
                }
            }
        ]
    });
}
