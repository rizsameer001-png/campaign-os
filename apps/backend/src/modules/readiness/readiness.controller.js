import { sendSuccess } from '../../utils/responseFormatter.js';
import * as readinessService from './readiness.service.js';

export async function saveDraft(req, res, next) {
  try {
    const draft = await readinessService.saveDraft(req.user.id, req.body);
    return sendSuccess(res, { data: draft, message: 'Draft saved' });
  } catch (err) { next(err); }
}

export async function calculate(req, res, next) {
  try {
    const report = await readinessService.calculateReadiness(req.user.id, req.body);
    return sendSuccess(res, { data: report, message: 'Readiness calculated', status: 201 });
  } catch (err) { next(err); }
}

export async function listReports(req, res, next) {
  try {
    const reports = await readinessService.listReports(req.user.id);
    return sendSuccess(res, { data: reports });
  } catch (err) { next(err); }
}

export async function getReport(req, res, next) {
  try {
    const report = await readinessService.getReport(req.user.id, req.params.id);
    return sendSuccess(res, { data: report });
  } catch (err) { next(err); }
}

export async function createShareLink(req, res, next) {
  try {
    const result = await readinessService.createShareLink(req.user.id, req.params.id);
    return sendSuccess(res, { data: result, message: 'Share link created' });
  } catch (err) { next(err); }
}

export async function getSharedReport(req, res, next) {
  try {
    const report = await readinessService.getSharedReport(req.params.token);
    return sendSuccess(res, { data: report });
  } catch (err) { next(err); }
}
