import { sendSuccess } from '../../utils/responseFormatter.js';
import * as planService from './campaign-plan.service.js';

export async function generate(req, res, next) {
  try {
    const plan = await planService.generatePlan(req.user.id, req.body);
    return sendSuccess(res, { data: plan, message: 'Campaign plan generated', status: 201 });
  } catch (err) { next(err); }
}

export async function regenerate(req, res, next) {
  try {
    const plan = await planService.regeneratePlan(req.user.id, req.params.id, req.body);
    return sendSuccess(res, { data: plan, message: 'Campaign plan regenerated' });
  } catch (err) { next(err); }
}

export async function list(req, res, next) {
  try {
    const plans = await planService.listPlans(req.user.id);
    return sendSuccess(res, { data: plans });
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const plan = await planService.getPlan(req.user.id, req.params.id);
    return sendSuccess(res, { data: { ...plan, progress: planService.computePlanProgress(plan) } });
  } catch (err) { next(err); }
}

export async function updateItem(req, res, next) {
  try {
    const { weekNumber, itemId, status } = req.body;
    const plan = await planService.updateItemStatus(req.user.id, req.params.id, weekNumber, itemId, status);
    return sendSuccess(res, { data: plan, message: 'Item updated' });
  } catch (err) { next(err); }
}

export async function addItem(req, res, next) {
  try {
    const { weekNumber, category, title } = req.body;
    const plan = await planService.addCustomItem(req.user.id, req.params.id, weekNumber, { category, title });
    return sendSuccess(res, { data: plan, message: 'Custom task added' });
  } catch (err) { next(err); }
}
