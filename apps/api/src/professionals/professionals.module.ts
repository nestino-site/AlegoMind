import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { AccountTypeGuard } from '../common/guards/account-type.guard';

@Module({
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, AccountTypeGuard],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
