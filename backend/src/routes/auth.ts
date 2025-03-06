import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import Joi from 'joi';

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
        isApi: user.isApi,
        isAdmin: user.isAdmin,
        enabled: user.enabled
    });
});

const ChangePasswordSchema = Joi.object({
    password: Joi.string().required(),
    confirmPassword: Joi.string().required()
});

router.post('/change-password', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if(!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if(user.isApi) {
        res.status(403).json({ error: 'API users cannot change their password' });
        return;
    }

    const { value, error } = ChangePasswordSchema.validate(req.body);
    if(error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }

    const { password, confirmPassword } = value;
    if(password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
    }

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            password: password
        }
    });

    res.json({ success: true });
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

    if(!user.enabled) {
        res.status(403).json({ error: 'User account is disabled' });
        return;
    }

    res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        token: user.token,
        isApi: user.isApi,
        isAdmin: user.isAdmin,
        enabled: user.enabled
    });
});

export default router;