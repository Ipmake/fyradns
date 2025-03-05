import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import { Prisma } from '@prisma/client';
import Joi from 'joi';

const router = express.Router()

const BatchRecordsSchema = Joi.object({
    create: Joi.array().items(Joi.object({
        zoneDomain: Joi.string().required().min(1).max(255),
        name: Joi.string().required().min(1).max(255),
        type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SRV', 'TXT'),
        content: Joi.string().required().min(1).max(255),
        ttl: Joi.number().optional(),
        priority: Joi.number().optional(),
        enabled: Joi.boolean().optional().default(true)
    })).optional().default([]),

    update: Joi.array().items(Joi.object({
        id: Joi.number().required(),
        zoneDomain: Joi.string().optional().min(1).max(255),
        name: Joi.string().required().min(1).max(255),
        type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SRV', 'TXT'),
        content: Joi.string().required().min(1).max(255),
        ttl: Joi.number().optional(),
        priority: Joi.number().optional(),
        enabled: Joi.boolean().optional().default(true)
    })).optional().default([]),
    
    delete: Joi.array().items(Joi.number()).optional().default([])
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

    const { create, update, delete: deletes } = value;

    const createRecords: Prisma.RecordCreateManyArgs = {
        data: (create || []).map((record: any) => ({
            zoneDomain: record.zoneDomain,
            type: record.type as any,
            name: record.name,
            content: record.content,
            ttl: record.ttl,
            priority: record.priority,
            enabled: record.enabled
        }))
    } satisfies Prisma.RecordCreateManyArgs;

    const updateRecords: Prisma.RecordUpdateArgs[] = (update || []).map((record: any) => ({
        where: {
            id: record.id
        },
        data: {
            type: record.type,
            name: record.name,
            content: record.content,
            ttl: record.ttl,
            priority: record.priority,
            changeDate: new Date(),
            enabled: record.enabled
        }
    }) satisfies Prisma.RecordUpdateArgs);

    const deleteRecords: Prisma.RecordDeleteArgs[] = (deletes || []).map((id: any) => ({
        where: {
            id
        }
    }) satisfies Prisma.RecordDeleteArgs);

    const records = await prisma.$transaction([
        prisma.record.createMany(createRecords),
        ...updateRecords.map(record => prisma.record.update(record)),
        ...deleteRecords.map(record => prisma.record.delete(record))
    ]).catch((e) => {
        return e;
    });

    if(records instanceof Error) {
        res.status(500).json({ error: records.message });
        return;
    }
    
    res.json({
        data: records
    });
});


router.get('/:id', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if(!req.params.id && isNaN(parseInt(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }

    const records = await prisma.record.findMany({
        where: {
            id: parseInt(req.params.id)
        }
    });

    res.json({
        data: records
    });
});

const RecordCreateSchema = Joi.object({
    zoneDomain: Joi.string().required().min(1).max(255),
    name: Joi.string().required().min(1).max(255),
    type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SRV', 'TXT'),
    content: Joi.string().required().min(1).max(255),
    ttl: Joi.number().optional(),
    priority: Joi.number().optional(),
    enabled: Joi.boolean().optional().default(true)
});

router.post('/', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { error } = RecordCreateSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const record = await prisma.record.create({
        data: {
            zone: {
                connect: {
                    domain: req.body.zoneDomain
                }
            },
            type: req.body.type,
            name: req.body.name,
            content: req.body.content,
            ttl: req.body.ttl,
            priority: req.body.priority,
            enabled: req.body.enabled
        }
    });

    res.json({
        data: record
    });
});

const RecordUpdateSchema = Joi.object({
    name: Joi.string().required().min(1).max(255),
    type: Joi.string().required().valid('A', 'AAAA', 'CNAME', 'MX', 'NS', 'PTR', 'SOA', 'SRV', 'TXT'),
    content: Joi.string().required().min(1).max(255),
    ttl: Joi.number().optional(),
    priority: Joi.number().optional(),
    enabled: Joi.boolean().optional().default(true)
});

router.put('/:id', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if(!req.params.id && isNaN(parseInt(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }

    const { error } = RecordUpdateSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }

    const record = await prisma.record.update({
        where: {
            id: parseInt(req.params.id)
        },
        data: {
            name: req.body.name,
            type: req.body.type,
            content: req.body.content,
            ttl: req.body.ttl,
            priority: req.body.priority,
            changeDate: new Date(),
            enabled: req.body.enabled
        }
    });

    res.json({
        data: record
    });
});

router.delete('/:id', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if(!req.params.id && isNaN(parseInt(req.params.id))) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }

    const record = await prisma.record.delete({
        where: {
            id: parseInt(req.params.id)
        }
    });

    res.json({
        data: record
    });
});

export default router;