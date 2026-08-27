import { Request, Response } from 'express';
import { AiService } from './ai.service';
import { AuthError } from '../../shared/errors/appErrors';

export class AiController {
  constructor(private readonly aiService: AiService = new AiService()) {}

  chat = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AuthError('Bạn chưa đăng nhập để sử dụng Trợ lý AI');
    }

    const response = await this.aiService.chat(userId, req.body);
    res.status(200).json({
      success: true,
      data: response
    });
  };
}
