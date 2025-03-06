import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import Joi from 'joi';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if(!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' }); 
        return;
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            email: true,
            isApi: true,
            isAdmin: true,
            enabled: true
        }
    });

    res.json({
        data: users
    });
})

const CreateUserSchema = Joi.object({
    username: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    confirmPassword: Joi.string().required(),
    isApi: Joi.boolean().required(),
    isAdmin: Joi.boolean().required(),
    enabled: Joi.boolean().required()
});

router.post("/", async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if(!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' }); 
        return;
    }

    const { value, error } = CreateUserSchema.validate(req.body);
    if(error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }

    const { username, name, email, password, confirmPassword, isApi, isAdmin, enabled } = value;

    if(password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username },
                { email: email }
            ]
        }
    });

    if(existingUser) {
        res.status(400).json({ error: 'Username already exists' });
        return;
    }

    const newUser = await prisma.user.create({
        data: {
            username,
            name,
            email,
            password,
            isApi,
            isAdmin,
            enabled,
            token: crypto.randomBytes(32).toString('hex')
        }
    });

    res.json({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        isApi: newUser.isApi,
        isAdmin: newUser.isAdmin,
        enabled: newUser.enabled
    });
})

export default router;