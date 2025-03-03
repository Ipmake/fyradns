import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import { Prisma } from '@prisma/client';

const router = express.Router()

router.get('/', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const zones = await prisma.zone.findMany();

    res.json({
        data: zones
    });
});

router.get('/:domain', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const zone = await prisma.zone.findFirst({
        where: {
            domain: req.params.domain
        }
    });

    if (!zone) {
        res.status(404).json({ error: 'Zone not found' });
        return;
    }

    res.json({
        data: zone
    });
});

router.post('/', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { domain, records, ttl, description, enabled, refresh, retry, expire, minimum, serial } = req.body;

    // Validate required fields
    if (!domain) {
        res.status(400).json({ error: 'Domain is required' });
        return
    }

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(domain) || domain.length > 253) {
        res.status(400).json({ error: 'Invalid domain format' });
        return;
    }

    const zoneData = {
        domain,
        ttl,
        description,
        refresh,
        retry,
        expire,
        minimum,
        serial,
        enabled: enabled !== undefined ? enabled : true
    };

    const zone = await prisma.zone.upsert({
        where: {
            domain,
        },
        update: zoneData,
        create: zoneData
    });

    res.json({
        data: zone
    });
});

router.delete('/:domain', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const zone = await prisma.zone.delete({
        where: {
            domain: req.params.domain
        },
        include: {
            records: true
        }
    });

    res.json({
        data: zone
    });
})

router.post('/batch', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { update, delete: deleteZones } = req.body;

    const updateZones: Prisma.ZoneUpsertArgs[] = (update || []).map((zone: any) => ({
        create: zone,
        update: zone,
        where: {
            domain: zone.domain
        }
    } satisfies Prisma.ZoneUpsertArgs));

    const deleteZoneDomains: string[] = (deleteZones || []).map((zone: any) => zone);

    const zones = await prisma.$transaction([
        ...updateZones.map(zone => prisma.zone.upsert(zone)),
        ...deleteZoneDomains.map(domain => prisma.zone.delete({
            where: {
                domain
            }
        }))
    ]);

    res.json({
        data: zones
    });
});

export default router;