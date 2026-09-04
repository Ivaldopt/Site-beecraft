import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.config.get<string>('ADMIN_API_KEY');
    if (!configuredKey) {
      throw new ServiceUnavailableException(
        'Acesso administrativo não configurado',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const receivedKey = request.header('x-admin-key') ?? '';
    const expected = Buffer.from(configuredKey);
    const received = Buffer.from(receivedKey);

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException('Credencial administrativa inválida');
    }

    return true;
  }
}
