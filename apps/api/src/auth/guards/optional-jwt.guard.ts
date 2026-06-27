import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never throws — unauthenticated requests proceed with
 * req.user = null. Use on public routes that return richer data when logged in.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(_err: any, user: any) {
    return user ?? null;
  }
}
