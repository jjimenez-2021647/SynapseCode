import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'UP',
    service: 'SynapseCode-ServicePlans',
    timestamp: new Date().toISOString(),
  });
});

export default router;
