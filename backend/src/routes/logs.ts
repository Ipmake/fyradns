import express, { Request, Response } from 'express';
import { AuthUser } from '../utils/authUser';
import { logger, prisma } from '..';

const router = express.Router();

router.get('/', async (req, res) => {
    const token = req.headers.authorization;

    const user = await AuthUser(token);
    if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const lines = parseInt(req.query.lines as string || "100")

    const logs = await logger.readLogEntries(Date.now(), lines);

    res.json({
        data: logs
    });
});

export default router;