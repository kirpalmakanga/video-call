import type { H3 } from 'h3';
import { getProfile, updateProfile } from '../controllers/users.controller';
import { bindRoutes } from '../utils/routes.utils';

export default function useUsersRoutes(app: H3) {
    bindRoutes(app, {
        namespace: 'users',
        routes: [
            {
                method: 'GET',
                path: '/profile',
                handler: getProfile,
                options: {
                    meta: { authenticated: true }
                }
            },
            {
                method: 'PUT',
                path: '/profile',
                handler: updateProfile,
                options: {
                    meta: { authenticated: true }
                }
            }
        ]
    });
}
