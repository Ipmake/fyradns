import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';

const router = express.Router()

router.get('/:zone', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if(!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const records = await prisma.record.findMany({
        where: {
            zoneDomain: req.params.zone
        }
    });

    res.json({
        data: records
    });
});

router.post('/:zone', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if(!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const zone = await prisma.zone.findFirst({
        where: {
            domain: req.params.zone
        }
    });

    if(!zone) {
        res.status(404).json({ error: 'Zone not found' });
        return;
    }

    const record = await prisma.record.upsert({
        where: {
            zoneDomain_name_type_direction: {
                zoneDomain: zone.domain,
                name: req.body.name,
                type: req.body.type,
                direction: req.body.direction
            }
        },
        create: {
            zoneDomain: zone.domain,
            type: req.body.type as any,
            name: req.body.name,
            content: req.body.content,
            ttl: req.body.ttl,
            priority: req.body.priority
        },
        update: {
            content: req.body.content,
            ttl: req.body.ttl,
            priority: req.body.priority
        }
    });

    res.json({
        data: record
    });
});

router.delete('/:zone/:name/:type/:direction', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if(!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const record = await prisma.record.delete({
        where: {
            zoneDomain_name_type_direction: {
                zoneDomain: req.params.zone,
                name: req.params.name,
                type: req.params.type,
                direction: req.params.direction as any
            }
        }
    });

    res.json({
        data: record
    });
});

export default router;