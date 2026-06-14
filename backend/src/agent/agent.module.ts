import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller.js';
import { PtbModule } from '../ptb/ptb.module.js';

@Module({
  imports: [PtbModule],
  controllers: [AgentController],
})
export class AgentModule {}
