import { z } from 'zod';
import { json, registry } from '../registry.js';

const HealthResponse = registry.register(
  'HealthResponse',
  z.object({
    success: z.boolean(),
    data: z.object({
      status: z.enum(['healthy', 'ready', 'not_ready']),
      database: z.enum(['connected', 'disconnected']).optional(),
      uptime: z
        .number()
        .int()
        .meta({ description: 'Seconds since the process started' }),
      timestamp: z.iso.datetime(),
    }),
  }),
);

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Health'],
  summary: 'Liveness check',
  description:
    'Always 200 while the process is serving requests. Never touches the database, so use it for platform health checks.',
  responses: {
    200: { description: 'Process is up', content: json(HealthResponse) },
  },
});

registry.registerPath({
  method: 'get',
  path: '/health/ready',
  tags: ['Health'],
  summary: 'Readiness check',
  description: 'Pings the database (2 second timeout).',
  responses: {
    200: { description: 'Database reachable', content: json(HealthResponse) },
    503: {
      description: 'Database not reachable',
      content: json(HealthResponse),
    },
  },
});
