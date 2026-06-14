import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { DeepbookModule } from './deepbook/deepbook.module.js';
import { SuiModule } from './sui/sui.module.js';
import { PtbModule } from './ptb/ptb.module.js';
import { IndexerModule } from './indexer/indexer.module.js';
import { AgentModule } from './agent/agent.module.js';

@Module({
  imports: [DeepbookModule, SuiModule, PtbModule, IndexerModule, AgentModule],
  controllers: [AppController],
})
export class AppModule { }
