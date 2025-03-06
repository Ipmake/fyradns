import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { prisma } from '..';
import { updateForwarderServers } from '../dns';

const router = express.Router();

const actions = {
    'refreshForwarders': async () => {
        // refresh forwarders
        updateForwarderServers();
        return { success: true };
    }
}

router.post('/:action', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    switch(req.params.action) {
        case 'refreshForwarders':
            res.json(await actions.refreshForwarders());
            break;
        default:
            res.status(404).json({ error: 'Action not found' });
    }
})

export default router;