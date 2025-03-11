import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import { Prisma } from '@prisma/client';
import Joi from 'joi';

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

router.get('/:zone/records', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
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

const ZoneCreateSchema = Joi.object({
    domain: Joi.string()
        .required()
        .min(1)
        .max(253)
        .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i, { name: 'domain format' }),
    ttl: Joi.number().optional(),
    description: Joi.string().optional().allow(''),
    enabled: Joi.boolean().optional(),
    soaemail: Joi.string().optional(),
    refresh: Joi.number().optional(),
    retry: Joi.number().optional(),
    expire: Joi.number().optional(),
    minimum: Joi.number().optional()
});

router.post('/', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { error, value } = ZoneCreateSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const { domain, ttl, description, enabled, soaemail, refresh, retry, expire, minimum, serial } = value;

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
        soaemail,
        refresh,
        retry,
        expire,
        minimum,
        enabled: enabled !== undefined ? enabled : true
    };

    const zone = await prisma.zone.upsert({
        where: {
            domain,
        },
        update: {
            ...zoneData,
            serial: {
                increment: 1
            }
        },
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

const BatchZonesSchema = Joi.object({
    update: Joi.array().items(
        Joi.object({
            domain: Joi.string()
                .required()
                .min(1)
                .max(253)
                .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i, { name: 'domain format' }),
            ttl: Joi.number().optional(),
            description: Joi.string().optional(),
            enabled: Joi.boolean().optional(),
            soaemail: Joi.string().optional(),
            refresh: Joi.number().optional(),
            retry: Joi.number().optional(),
            expire: Joi.number().optional(),
            minimum: Joi.number().optional()
        })
    ).optional().default([]),
    
    delete: Joi.array().items(
        Joi.string()
            .min(1)
            .max(253)
            .pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i, { name: 'domain format' })
    ).optional().default([])
});

router.post('/batch', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { error, value } = BatchZonesSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const { update, delete: deleteZones } = value;

    const updateZones: Prisma.ZoneUpsertArgs[] = (update || []).map((zone: any) => ({
        create: zone,
        update: {
            ...zone,
            serial: {
                increment: 1
            }
        },
        where: {
            domain: zone.domain
        }
    } satisfies Prisma.ZoneUpsertArgs));

    const deleteZoneDomains: string[] = (deleteZones || []).map((zone: any) => zone);

    const zones = await prisma.$transaction([
        ...updateZones.map(zone => prisma.zone.upsert(zone)),
        ...deleteZoneDomains.map(domain => prisma.zone.deleteMany({
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