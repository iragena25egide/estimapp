import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DrawingService } from './drawing.service';
import { DrawingController } from './drawing.controller';

const ALLOWED_EXTENSIONS = ['.ifc', '.pln', '.pdf', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
const MAX_FILE_SIZE_MB = 100;

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const ext = '.' + (file.originalname.split('.').pop()?.toLowerCase() || '');
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
            ),
            false,
          );
        }
      },
    }),
  ],
  providers: [DrawingService],
  controllers: [DrawingController],
})
export class DrawingModule {}
