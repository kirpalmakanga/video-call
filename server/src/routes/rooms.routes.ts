import type { RequestHandler } from 'express';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { createRoomSchema } from '../validation/rooms.validation';
import { index, show, insert, update } from '../controllers/rooms.controller';
import { createRouter } from '../utils/routes.utils';

export default createRouter([
    {
        method: 'get',
        path: '/',
        middlewares: [isAuthenticated],
        handler: index
    },
    {
        method: 'get',
        path: '/:roomId',
        middlewares: [isAuthenticated],
        handler: show
    },
    {
        method: 'post',
        path: '/',
        middlewares: [
            isAuthenticated,
            validateRequest({ body: createRoomSchema })
        ],
        handler: insert as RequestHandler
    },
    {
        method: 'put',
        path: '/:roomId',
        middlewares: [
            isAuthenticated,
            validateRequest({ body: createRoomSchema })
        ],
        handler: update as RequestHandler
    }
]);
