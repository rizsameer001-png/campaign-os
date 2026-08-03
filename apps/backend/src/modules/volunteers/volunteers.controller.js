import { sendSuccess, sendPaginated } from '../../utils/responseFormatter.js';
import * as volunteersService from './volunteers.service.js';

export async function invite(req, res, next) {
  try {
    const result = await volunteersService.inviteVolunteer(req.user.id, req.body.email);
    return sendSuccess(res, { data: result, message: 'Invitation sent', status: 201 });
  } catch (err) { next(err); }
}

export async function completeSignup(req, res, next) {
  try {
    const result = await volunteersService.completeVolunteerSignup(req.body.token, req.body);
    return sendSuccess(res, { data: { volunteerId: result.volunteer.id }, message: 'Signup complete. Awaiting candidate approval.', status: 201 });
  } catch (err) { next(err); }
}

export async function review(req, res, next) {
  try {
    const result = await volunteersService.reviewVolunteerApplication(req.user.id, req.params.id, req.body.decision);
    return sendSuccess(res, { data: result, message: `Application ${req.body.decision}d` });
  } catch (err) { next(err); }
}

export async function list(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await volunteersService.listVolunteers(req.user.id, {
      status,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
    });
    return sendPaginated(res, result);
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const result = await volunteersService.getVolunteer(req.user.id, req.params.id);
    return sendSuccess(res, { data: result });
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const result = await volunteersService.updateVolunteer(req.user.id, req.params.id, req.body);
    return sendSuccess(res, { data: result, message: 'Volunteer updated' });
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const result = await volunteersService.removeVolunteer(req.user.id, req.params.id);
    return sendSuccess(res, { data: result, message: result.message });
  } catch (err) { next(err); }
}
