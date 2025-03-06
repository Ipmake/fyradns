import { prisma } from "..";
import crypto from 'crypto';

export async function AuthUser(token?: string) {
    if (!token) return null;

    token = token.split(' ')[token.split(' ').length - 1];

    const user = await prisma.user.findUnique({
        where: {
            token: token,
            enabled: true
        }
    });

    if (!user) return null;

    return user;
}

export function HashPW(password: string) {
    return crypto.createHash('sha256')
        .update(`fyraDNS${password}fyraDNS`)
        .digest('hex');
}