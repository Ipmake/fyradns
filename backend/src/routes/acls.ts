import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import { Prisma, PrismaClient } from '@prisma/client';
import Joi, { any, string } from 'joi';

const router = express.Router()

// Validator for a single IP address
const IPAddressValidator = Joi.string().ip();

// Validator for a comma-separated list of IP addresses
const IPAddressListValidator = Joi.string().custom((value, helpers) => {
    const ips = value.split(',').map((ip: string) => ip.trim());
    for (const ip of ips) {
        const { error } = IPAddressValidator.validate(ip);
        if (error) {
            return helpers.error('string.ip', { value: ip });
        }
    }
    return value;
}, 'comma-separated list of IP addresses');

// Schema for validating individual ACL records
const ACLSchema = Joi.object({
    zoneDomain: Joi.string().required().min(1).max(255),
    ipAddresses: IPAddressListValidator.required(),
    description: Joi.string().optional().allow('', null),
    enabled: Joi.boolean().optional().default(true)
});

// Schema for batch operations
const BatchACLSchema = Joi.object({
    create: Joi.array().items(ACLSchema).optional().default([]),
    
    update: Joi.array().items(
        Joi.object({
            id: Joi.number().required(),
            zoneDomain: Joi.string().optional().min(1).max(255),
            ipAddresses: IPAddressListValidator.optional(),
            description: Joi.string().optional().allow('', null),
            enabled: Joi.boolean().optional()
        })
    ).optional().default([]),
    
    delete: Joi.array().items(Joi.number()).optional().default([])
});


const UpdateACLSchema = Joi.object({
    zoneDomain: Joi.string().optional().min(1).max(255),
    ipAddresses: IPAddressListValidator.optional(),
    description: Joi.string().optional().allow('', null),
    enabled: Joi.boolean().optional()
});

// GET all ACLs
router.get('/', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
       // res.status(401).json({ error: 'Unauthorized' });
        //return;
    }
    
    try {
        const acls = await prisma.aCL.findMany();
        
        res.json({
            data: acls
        });
    } catch (error) {
        console.error('Error retrieving ACLs:', error);
        res.status(500).json({ error: 'Failed to retrieve ACLs' });
    }
});

// GET specific ACL by ID
router.get('/:id', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
       // res.status(401).json({ error: 'Unauthorized' });
        //return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }
    
    try {
        const acl = await prisma.aCL.findUnique({
            where: { id },
            
        });
        
        if (!acl) {
            res.status(404).json({ error: 'ACL not found' });
            return;
        }
        
        res.json({
            data: acl
        });
    } catch (error) {
        console.error(`Error retrieving ACL ${id}:`, error);
        res.status(500).json({ error: 'Failed to retrieve ACL' });
    }
});

// POST create new ACL
router.post('/', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
       // res.status(401).json({ error: 'Unauthorized' });
        //return;
    }
    
    const { error, value } = ACLSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    
    try {
        // Check if zone exists
        const zone = await prisma.zone.findUnique({
            where: { domain: value.zoneDomain }
        });
        
        if (!zone) {
            res.status(404).json({ error: `Zone ${value.zoneDomain} not found` });
            return;
        }
        
        // Check if ACL for this zone already exists (due to unique constraint)
        const existingAcl = await prisma.aCL.findUnique({
            where: { zoneDomain: value.zoneDomain }
        });
        
        if (existingAcl) {
            res.status(409).json({ 
                error: `ACL already exists for zone ${value.zoneDomain}`,
                existingId: existingAcl.id
            });
            return;
        }
        
        const acl = await prisma.aCL.create({
            data: {
                zoneDomain: value.zoneDomain,
                ipAddresses: value.ipAddresses,
                description: value.description,
                enabled: value.enabled
            }
        });
        
        res.status(201).json({ 
            data: acl 
        });
    } catch (error) {
        console.error('Error creating ACL:', error);
        res.status(500).json({ error: 'Failed to create ACL' });
    }
});

// PUT update existing ACL
router.put('/:id', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
       // res.status(401).json({ error: 'Unauthorized' });
        //return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }
    
    // Use a modified schema that doesn't require all fields
    
    
    const { error, value } = UpdateACLSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    
    try {
        // Check if ACL exists
        const existingAcl = await prisma.aCL.findUnique({
            where: { id }
        });
        
        if (!existingAcl) {
            res.status(404).json({ error: `ACL with ID ${id} not found` });
            return;
        }
        
        // If trying to change zoneDomain, check if the new zone exists and no ACL exists for it
        if (value.zoneDomain && value.zoneDomain !== existingAcl.zoneDomain) {
            const zone = await prisma.zone.findUnique({
                where: { domain: value.zoneDomain }
            });
            
            if (!zone) {
                res.status(404).json({ error: `Zone ${value.zoneDomain} not found` });
                return;
            }
            
            const zoneAcl = await prisma.aCL.findUnique({
                where: { zoneDomain: value.zoneDomain }
            });
            
            if (zoneAcl && zoneAcl.id !== id) {
                res.status(409).json({ 
                    error: `ACL already exists for zone ${value.zoneDomain}`,
                    existingId: zoneAcl.id
                });
                return;
            }
        }
        
        const updatedAcl = await prisma.aCL.update({
            where: { id },
            data: {
                zoneDomain: value.zoneDomain,
                ipAddresses: value.ipAddresses,
                description: value.description,
                enabled: value.enabled
            }
        });
        
        res.json({ 
            data: updatedAcl 
        });
    } catch (error) {
        console.error(`Error updating ACL ${id}:`, error);
        res.status(500).json({ error: 'Failed to update ACL' });
    }
});

// DELETE ACL
router.delete('/:id', async (req, res) => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
       // res.status(401).json({ error: 'Unauthorized' });
        //return;
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }
    
    try {
        // Check if ACL exists
        const existingAcl = await prisma.aCL.findUnique({
            where: { id }
        });
        
        if (!existingAcl) {
            res.status(404).json({ error: `ACL with ID ${id} not found` });
            return;
        }
        
        const acl = await prisma.aCL.delete({
            where: { id }
        });
        
        res.json({ 
            data: acl 
        });
    } catch (error) {
        console.error(`Error deleting ACL ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete ACL' });
    }
});

// BATCH operation for ACLs
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
    const user = await AuthUser(req.headers.authorization);
    if (!user) {
       // res.status(401).json({ error: 'Unauthorized' });
        //return;
    }
    
    const { error, value } = BatchACLSchema.validate(req.body);
    if (error) {
        res.status(400).json({ error: error.message });
        return;
    }
    
    const { create, update, delete: deleteIds } = value;
    
    try {
        const transactions = [
            // Handle creates
            ...(create || []).map((acl:Prisma.ACLUncheckedCreateInput) => prisma.aCL.create({
                data: {
                    ...acl,
                    enabled: acl.enabled !== undefined ? acl.enabled : true
                }
            })),
            // Handle updates
            ...(update || []).map((acl : Prisma.ACLUncheckedUpdateInput) => {
                const { id, ...updateData } = acl;
                return prisma.aCL.update({
                    where: { id: Number(id) },
                    data: updateData
                });
            }),
            // Handle deletes
            ...(deleteIds || []).map((id: number) => prisma.aCL.delete({
                where: { id }
            }))
        ];
        
        if (transactions.length === 0) {
             res.json({ data: [], message: 'No operations performed' });
             return;
        }
        
        const results = await prisma.$transaction(transactions);
        res.json({ data: results });
    } catch (error) {
        console.error('Error processing batch operation:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific Prisma errors
            if (error.code === 'P2002') {
                res.status(409).json({ error: 'Conflict: An ACL with this zone domain already exists' });
            } else if (error.code === 'P2003') {
                res.status(404).json({ error: 'Related zone not found' });
            } else {
                res.status(400).json({ error: `Database error: ${error.message}` });
            }
        } else {
            res.status(500).json({ error: 'Failed to process batch operation' });
        }
    }
});

export default router;
