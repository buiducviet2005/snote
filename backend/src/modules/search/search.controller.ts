import { Request, Response, NextFunction } from 'express';
import { SearchService } from './search.service';

export class SearchController {
  constructor(private readonly service: SearchService = new SearchService()) {}

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = {
        q: req.query.q as string,
        subjectId: req.query.subjectId as string,
        semesterId: req.query.semesterId as string,
        tagId: req.query.tagId as string,
        status: req.query.status as string,
        priority: req.query.priority as string,
        itemTypes: req.query.itemTypes as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        isPinned: req.query.isPinned ? req.query.isPinned === 'true' : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };

      const results = await this.service.search(userId, query);
      res.json({
        success: true,
        data: results
      });
    } catch (err) {
      next(err);
    }
  };
}
