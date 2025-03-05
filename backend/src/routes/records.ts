import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import { Prisma } from '@prisma/client';
import Joi from 'joi';

const router = express.Router()

router.get('/:zone', async (req, res) => {
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

const ZoneUpdateSchema = Joi.object({
    name: Joi.string().required().alphanum().min(1).max(255),
    type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SPF', 'SRV', 'TXT'),
    content: Joi.string().required().min(1).max(255),
    ttl: Joi.number().optional(),
    priority: Joi.number().optional()
});

router.post('/:zone', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const zone = await prisma.zone.findFirst({
        where: {
            domain: req.params.zone
        }
    });

    if (!zone) {
        res.status(404).json({ error: 'Zone not found' });
        return;
    }

    const { error } = ZoneUpdateSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const record = await prisma.record.upsert({
        where: {
            zoneDomain_name_type: {
                zoneDomain: zone.domain,
                name: req.body.name,
                type: req.body.type
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

router.delete('/:zone/:name/:type', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const record = await prisma.record.delete({
        where: {
            zoneDomain_name_type: {
                zoneDomain: req.params.zone,
                name: req.params.name,
                type: req.params.type
            }
        }
    });

    res.json({
        data: record
    });
});


const BatchRecordsSchema = Joi.object({
    update: Joi.array().items(Joi.object({
        zoneDomain: Joi.string().required().min(1).max(255),
        name: Joi.string().required().alphanum().min(1).max(255),
        type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SPF', 'SRV', 'TXT'),
        content: Joi.string().required().min(1).max(255),
        ttl: Joi.number().optional(),
        priority: Joi.number().optional()
    })).optional().default([]),
    
    delete: Joi.array().items(Joi.object({
        zoneDomain: Joi.string().required().min(1).max(255),
        name: Joi.string().required().min(1).max(255),
        type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SPF', 'SRV', 'TXT')
    })).optional().default([])
});

router.post('/batch', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    
    const { error, value } = BatchRecordsSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const { update, delete: deletes } = value;

    const updateRecords: Prisma.RecordUpsertArgs[] = (update || []).map((record: any) => ({
        where: {
            zoneDomain_name_type: {
                zoneDomain: record.zoneDomain,
                name: record.name,
                type: record.type
            }
        },
        create: {
            zone: {
                connect: {
                    domain: record.zoneDomain
                }
            },
            type: record.type as any,
            name: record.name,
            content: record.content,
            ttl: record.ttl,
            priority: record.priority
        },
        update: {
            content: record.content,
            ttl: record.ttl,
            priority: record.priority
        }
    } satisfies Prisma.RecordUpsertArgs));

    const deleteRecords: Prisma.RecordWhereUniqueInput[] = (deletes || []).map((record: any) => ({
        zoneDomain_name_type: {
            zoneDomain: record.zoneDomain,
            name: record.name,
            type: record.type
        }
    } satisfies Prisma.RecordWhereUniqueInput));

    const records = await prisma.$transaction([
        ...updateRecords.map(record => prisma.record.upsert(record)),
        ...deleteRecords.map(record => prisma.record.delete({ where: record }))
    ]);

    res.json({
        data: records
    });
});

export default router;