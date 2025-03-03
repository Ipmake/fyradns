import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';

const router = express.Router();

router.get('/me', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if(!user) {
        res.status(401).json({ error: 'Unauthorized' }); 
        return;
    }

    res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        token: user.token,
        isApi: user.isApi
    });
});

router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if(!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }

    const user = await prisma.user.findFirst({
        where: {
            username: username,
            password: password
        }
    });
    if(!user || user.password !== password) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
    }

    if(user.isApi) {
        res.status(403).json({ error: 'API users cannot log in via the web' });
        return;
    }

    res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        token: user.token,
        isApi: user.isApi
    });
});

export default router;