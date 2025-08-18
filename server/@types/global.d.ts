/// <reference types="vite/types/importMeta.d.ts" />

export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Base
            NODE_ENV: 'development' | 'production';
            PORT: string;
            CLIENT_URI: string;
            API_URI: string;
            DATABASE_URL: string;

            // JWT
            JWT_ACCESS_SECRET: string;
            JWT_ISSUER: string;
            JWT_AUDIENCE: string;

            //Email
            SMTP_HOST: string;
            SMTP_PORT: string;
            SMTP_SECURE: 'true' | 'false';
            SMTP_USER: string;
            SMTP_PASS: string;
            MAIL_FROM: string;
        }
    }
}
