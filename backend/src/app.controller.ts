import { Controller, Get, Param } from '@nestjs/common';
import { getEvents } from './events/store.js';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('agent/:id/events')
  getAgentEvents(@Param('id') agentId: string) {
    return getEvents(agentId);
  }
}
