import type { Request, Response } from 'express';
import {
  listMembersSchema,
  listWorkspacesSchema,
  createWorkspaceSchema,
  addWorkspaceMemberSchema,
  joinWorkspaceSchema
} from './workspaces.schemas';
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

  addMember = async (req: Request, res: Response): Promise<void> => {
    const input = addWorkspaceMemberSchema.parse(req.body);
    const data = await this.service.addMember(
      req.params.workspaceId as string,
      req.user!.id,
      input.email,
      input.role
    );
    res.status(201).json({ success: true, data });
  };

  listInvitations = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.listInvitations(req.user!.id);
    res.status(200).json({ success: true, data });
  };

  acceptInvitation = async (req: Request, res: Response): Promise<void> => {
    const data = await this.service.acceptInvitation(req.params.memberId as string, req.user!.id);
    res.status(200).json({ success: true, data });
  };

  declineInvitation = async (req: Request, res: Response): Promise<void> => {
    await this.service.declineInvitation(req.params.memberId as string, req.user!.id);
    res.status(200).json({ success: true, message: 'Đã từ chối lời mời tham gia không gian' });
  };

  join = async (req: Request, res: Response): Promise<void> => {
    const input = joinWorkspaceSchema.parse(req.body);
    const data = await this.service.join(req.user!.id, input.codeOrId);
    res.status(200).json({ success: true, data });
  };

  updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    const data = await this.service.updateMemberRole(workspaceId as string, req.user!.id, memberId as string, role);
    res.status(200).json({ success: true, data, message: 'Đã cập nhật vai trò thành viên' });
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    const { workspaceId, memberId } = req.params;
    await this.service.removeMember(workspaceId as string, req.user!.id, memberId as string);
    res.status(200).json({ success: true, message: 'Đã xóa thành viên khỏi không gian làm việc' });
  };

  progress = async (req: Request, res: Response): Promise<void> => {
    const { workspaceId } = req.params;
    const data = await this.service.getProgress(workspaceId as string, req.user!.id);
    res.status(200).json({ success: true, data });
  };
}
