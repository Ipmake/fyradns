import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import Joi from 'joi';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user || !user.isAdmin) {
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

const BatchRequestSchema = Joi.object({
    delete: Joi.array().items(Joi.number()).required(),
});

router.post('/batch', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { value, error } = BatchRequestSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }

    const { delete: deleteIds } = value;

    await prisma.user.deleteMany({
        where: {
            id: {
                in: deleteIds
            }
        }
    });

    res.json({ success: true });
});

router.get('/:id', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const id = parseInt(req.params.id);

    const existingUser = await prisma.user.findFirst({
        where: {
            id: id
        },
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

    if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    res.json({
        data: existingUser
    });
});

const CreateUserSchema = Joi.object({
    username: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().optional().allow(''),
    password: Joi.string().when('isApi', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    confirmPassword: Joi.string().when('isApi', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    isApi: Joi.boolean().required(),
    isAdmin: Joi.boolean().required(),
    enabled: Joi.boolean().required()
});

router.post("/", async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { value, error } = CreateUserSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }

    const { username, name, email, password, confirmPassword, isApi, isAdmin, enabled } = value;

    if (!isApi && password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { username: username }
            ]
        }
    });

    if (existingUser) {
        res.status(400).json({ error: 'Username already exists' });
        return;
    }

    const newUser = await prisma.user.create({
        data: {
            username,
            name,
            email: email ? email : undefined,
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

const UpdateUserSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().optional().allow(''),
    password: Joi.string().optional().allow(''),
    confirmPassword: Joi.string().when('password', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    isAdmin: Joi.boolean().required(),
    enabled: Joi.boolean().required()
})

router.put('/:id', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const id = parseInt(req.params.id);

    const { value, error } = UpdateUserSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.details[0].message });
        return;
    }

    const { name, email, password, confirmPassword, isAdmin, enabled } = value;

    if (password && password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            id: id
        }
    });

    if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: id
        },
        data: {
            name,
            email: email ? email : undefined,
            isAdmin,
            enabled,

            password: password ? password : undefined
        }
    });

    res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        isApi: updatedUser.isApi,
        isAdmin: updatedUser.isAdmin,
        enabled: updatedUser.enabled
    });
});

router.get('/:id/token', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user || !user.isAdmin) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const id = parseInt(req.params.id);

    const existingUser = await prisma.user.findFirst({
        where: {
            id: id
        }
    });

    if (!existingUser) {
        res.status(404).json({ error: 'User not found' });
        return;
    }

    if (!existingUser.isApi) {
        res.status(400).json({ error: 'User is not an API user' });
        return;
    }

    const updatedUser = await prisma.user.update({
        where: {
            id: id
        },
        data: {
            token: crypto.randomBytes(32).toString('hex')
        }
    });

    res.json({
        token: updatedUser.token
    });
});

export default router;