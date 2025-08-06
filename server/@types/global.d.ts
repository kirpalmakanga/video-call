/// <reference types="vite/types/importMeta.d.ts" />

import type { Request } from 'express';

export {};

declare global {
    namespace Express {
        export interface Request {
            userId?: string;
        }
    }
}
