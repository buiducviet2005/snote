import { Request, Response } from 'express';
import { ClassesService } from './classes.service';
import {
  addClassMemberSchema, addGroupMemberSchema, createClassProjectSchema, createClassSchema,
  createGroupSchema, groupMemberParamSchema, groupParamSchema, groupProjectParamSchema,
  idParamSchema, memberParamSchema, projectParamSchema, reportParamSchema,
  reviewProgressSchema, setClassMemberRoleSchema, setGroupLeaderSchema,
  submitProgressSchema, updateClassProjectSchema, updateClassSchema, updateGroupSchema
} from './classes.schemas';
import { z } from 'zod';

const teacherSchema = z.object({ email: z.string().trim().email() });

export class ClassesController {
  constructor(private readonly service = new ClassesService()) {}

  list = async (req: Request, res: Response) => {
    res.json({ success: true, data: await this.service.list(req.user!.id) });
  };

  get = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ success: true, data: await this.service.get(id, req.user!.id) });
  };

  overview = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    res.json({ success: true, data: await this.service.overview(id, req.user!.id) });
  };

  create = async (req: Request, res: Response) => {
    const data = createClassSchema.parse(req.body);
    res.status(201).json({ success: true, data: await this.service.create(req.user!.id, data) });
  };

  update = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = updateClassSchema.parse(req.body);
    res.json({ success: true, data: await this.service.update(id, req.user!.id, data) });
  };

  addMember = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const { email } = addClassMemberSchema.parse(req.body);
    res.status(201).json({ success: true, data: await this.service.addMember(id, req.user!.id, email) });
  };

  setMemberRole = async (req: Request, res: Response) => {
    const { id, userId } = memberParamSchema.parse(req.params);
    const { role } = setClassMemberRoleSchema.parse(req.body);
    res.json({ success: true, data: await this.service.setMemberRole(id, req.user!.id, userId, role) });
  };

  removeMember = async (req: Request, res: Response) => {
    const { id, userId } = memberParamSchema.parse(req.params);
    await this.service.removeMember(id, req.user!.id, userId);
    res.json({ success: true });
  };

  createGroup = async (req: Request, res: Response) => {
    const { id } = idParamSchema.parse(req.params);
    const data = createGroupSchema.parse(req.body);
    res.status(201).json({ success: true, data: await this.service.createGroup(id, req.user!.id, data) });
  };

  updateGroup = async (req: Request, res: Response) => {
    const { id, groupId } = groupParamSchema.parse(req.params);
    const { name } = updateGroupSchema.parse(req.body);
    res.json({ success: true, data: await this.service.updateGroup(id, groupId, req.user!.id, name) });
  };

  deleteGroup = async (req: Request, res: Response) => {
    const { id, groupId } = groupParamSchema.parse(req.params);
    await this.service.deleteGroup(id, groupId, req.user!.id);
    res.json({ success: true });
  };

  addGroupMember = async (req: Request, res: Response) => {
    const { id, groupId } = groupParamSchema.parse(req.params);
    const { userId } = addGroupMemberSchema.parse(req.body);
    res.status(201).json({ success: true, data: await this.service.addGroupMember(id, groupId, req.user!.id, userId) });
  };

  removeGroupMember = async (req: Request, res: Response) => {
    const { id, groupId, userId } = groupMemberParamSchema.parse(req.params);
    await this.service.removeGroupMember(id, groupId, req.user!.id, userId);
    res.json({ success: true });
  };

  setLeader = async (req: Request, res: Response) => {
    const { id, groupId } = groupParamSchema.parse(req.params);
    const { userId } = setGroupLeaderSchema.parse(req.body);
    await this.service.setLeader(id, groupId, req.user!.id, userId);
    res.json({ success: true });
  };

  createProject = async (req: Request, res: Response) => {
    const { id, groupId } = groupProjectParamSchema.parse(req.params);
    const data = createClassProjectSchema.parse(req.body);
    res.status(201).json({ success: true, data: await this.service.createProject(id, groupId, req.user!.id, data) });
  };

  updateProject = async (req: Request, res: Response) => {
    const { id, projectId } = projectParamSchema.parse(req.params);
    const data = updateClassProjectSchema.parse(req.body);
    res.json({ success: true, data: await this.service.updateProject(id, projectId, req.user!.id, data) });
  };

  deleteProject = async (req: Request, res: Response) => {
    const { id, projectId } = projectParamSchema.parse(req.params);
    await this.service.deleteProject(id, projectId, req.user!.id);
    res.json({ success: true });
  };

  listReports = async (req: Request, res: Response) => {
    const { id, projectId } = projectParamSchema.parse(req.params);
    res.json({ success: true, data: await this.service.listReports(id, projectId, req.user!.id) });
  };

  submitReport = async (req: Request, res: Response) => {
    const { id, projectId } = projectParamSchema.parse(req.params);
    const data = submitProgressSchema.parse(req.body);
    res.status(201).json({ success: true, data: await this.service.submitReport(id, projectId, req.user!.id, data) });
  };

  reviewReport = async (req: Request, res: Response) => {
    const { id, projectId, reportId } = reportParamSchema.parse(req.params);
    const data = reviewProgressSchema.parse(req.body);
    res.json({ success: true, data: await this.service.reviewReport(id, projectId, reportId, req.user!.id, data) });
  };

  grantTeacher = async (req: Request, res: Response) => {
    const { email } = teacherSchema.parse(req.body);
    res.json({ success: true, data: await this.service.grantTeacher(req.user!.id, email) });
  };
}
