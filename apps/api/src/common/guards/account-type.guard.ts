import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountType } from '@prisma/client';
import { ACCOUNT_TYPE_KEY } from '../decorators/require-account-type.decorator';

@Injectable()
export class AccountTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AccountType>(ACCOUNT_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || user.accountType !== required) {
      throw new ForbiddenException(`This action requires a ${required} account`);
    }
    return true;
  }
}
