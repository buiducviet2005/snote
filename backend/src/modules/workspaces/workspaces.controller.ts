import type { Request, Response } from 'express';
import { listMembersSchema, listWorkspacesSchema, createWorkspaceSchema } from './workspaces.schemas';
import { WorkspacesService } from './workspaces.service';

export class WorkspacesController {
  constructor(private readonly service: WorkspacesService = new WorkspacesService()) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = listWorkspacesSchema.parse(req.query);
    const result = await this.service.list(req.user!.id, query);
    res.status(200).json({ success: true, ...result });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = createWorkspaceSchema.parse(req.body);
    const data = await this.service.create(req.user!.id, input);
    res.status(201).json({ success: true, data });
  };

  context = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.getContext(req.params.workspaceId as string, req.user!.id);
    res.status(200).json({ success: true, data });
  };

  members = async (req: Request, res: Response): Promise<void> => {
    const query = listMembersSchema.parse(req.query);
    const result = await this.service.listMembers(
      req.params.workspaceId as string,
      req.user!.id,
      query.cursor,
      query.limit
    );
    res.status(200).json({ success: true, ...result });
  };
}
