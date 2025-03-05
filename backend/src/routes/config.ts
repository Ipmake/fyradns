import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';

const router = express.Router();

router.get('/', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const config = await prisma.config.findMany();

    res.json({
        data: config
    });
});

router.get('/:key', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const config = await prisma.config.findFirst({
        where: {
            key: req.params.key
        }
    });

    if (!config) {
        res.status(404).json({ error: 'Config not found' });
        return;
    }

    res.json({
        data: config
    });
});

router.put('/:key', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const config = await prisma.config.upsert({
        where: {
            key: req.params.key
        },
        update: {
            value: req.body.value
        },
        create: {
            key: req.params.key,
            value: req.body.value
        }
    });

    res.json({
        data: config
    });
});

router.delete('/:key', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const config = await prisma.config.delete({
        where: {
            key: req.params.key
        }
    });

    res.json({
        data: config
    });
});

export default router;