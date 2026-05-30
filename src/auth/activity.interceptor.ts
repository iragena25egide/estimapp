import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationsService } from './notification.service';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(private readonly notificationsService: NotificationsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;

    return next.handle().pipe(
      tap(() => {
        // Only log write methods for authenticated users
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && user) {
          let actionDescription = `${method.toLowerCase()}d resource at ${url}`;

          // Format clean, professional descriptions dynamically
          if (url.includes('/projects')) {
            if (method === 'POST') actionDescription = `created a new project: "${body.name || 'Unnamed'}"`;
            if (method === 'PATCH' || method === 'PUT') actionDescription = `updated project details for "${body.name || 'Unnamed'}"`;
            if (method === 'DELETE') actionDescription = `deleted an estimation project`;
          } else if (url.includes('/drawing')) {
            if (method === 'POST') actionDescription = `uploaded a new drawing sheet: "${body.title || body.drawingNo || 'Unnamed'}"`;
            if (method === 'PATCH' || method === 'PUT') actionDescription = `updated drawing specifications for "${body.title || 'Unnamed'}"`;
            if (method === 'DELETE') actionDescription = `deleted a drawing registration`;
          } else if (url.includes('/boq-item')) {
            if (method === 'POST') actionDescription = `added a new BOQ line item: "${body.description || 'Unnamed'}"`;
            if (method === 'PATCH' || method === 'PUT') actionDescription = `updated BOQ item: "${body.description || 'Unnamed'}"`;
            if (method === 'DELETE') actionDescription = `deleted a BOQ item from estimate`;
          } else if (url.includes('/dimension')) {
            if (method === 'POST') actionDescription = `added a dimension sheet take-off: "${body.description || 'Unnamed'}"`;
            if (method === 'PATCH' || method === 'PUT') actionDescription = `updated dimension sheet entry for "${body.description || 'Unnamed'}"`;
            if (method === 'DELETE') actionDescription = `deleted a dimension sheet entry`;
          } else if (url.includes('/reports')) {
            if (url.includes('/generate')) actionDescription = `compiled a new estimation PDF report`;
            if (url.includes('/send')) actionDescription = `sent an estimation report via email`;
          } else if (url.includes('/rate-library')) {
            if (url.includes('/import')) actionDescription = `bulk imported a new Excel standard rates booklet`;
          }

          // Trigger async notification call to online Admins
          this.notificationsService.notifyAdminActivity(user.id, actionDescription);
        }
      }),
    );
  }
}
