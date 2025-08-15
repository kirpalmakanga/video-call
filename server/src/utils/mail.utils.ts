import { createTransport } from 'nodemailer';
import { renderView } from './views.utils';

const {
    API_URI,
    CLIENT_URI,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS
} = process.env;

const transporter = createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE === 'true',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

interface MailConfig {
    to: string;
    subject: string;
    template: string;
    context?: Record<string, unknown>;
}

export async function sendMail({ to, subject, template, context }: MailConfig) {
    try {
        const html = renderView(`emails/${template}`, context);

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html
        });
    } catch (error) {
        console.error('Erreur when sending email:', error);
        throw error;
    }
}

export function sendVerificationEmail(
    email: string,
    verificationToken: string
) {
    return sendMail({
        to: email,
        subject: 'Account verification',
        template: 'account-verification',
        context: {
            verificationLink: `${API_URI}/auth/verify/${verificationToken}`
        }
    });
}

export function sendPasswordResetEmail(email: string, resetToken: string) {
    return sendMail({
        to: email,
        subject: 'Reset password',
        template: 'account-reset-password',
        context: {
            resetLink: `${CLIENT_URI}/reset-password?email=${email}&resetToken=${resetToken}`
        }
    });
}
