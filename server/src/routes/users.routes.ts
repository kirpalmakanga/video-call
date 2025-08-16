import type { H3 } from 'h3';
import { isAuthenticated } from '../middlewares/auth.middleware';
import { getProfile, updateProfile } from '../controllers/users.controller';
import { bindRoutes } from '../utils/routes.utils';
import { validateBody } from '../middlewares/validation.middleware';
import { updateProfileSchema } from '../validation/user.validation';

export default function useUsersRoutes(app: H3) {
    bindRoutes(app, {
        namespace: 'users',
        routes: [
            {
                method: 'GET',
                path: '/profile',
                handler: getProfile,
                options: {
                    middleware: [isAuthenticated]
                }
            },
            {
                method: 'PUT',
                path: '/profile',
                handler: updateProfile,
                options: {
                    middleware: [
                        isAuthenticated,
                        validateBody(updateProfileSchema)
                    ]
                }
            }
        ]
    });
}
