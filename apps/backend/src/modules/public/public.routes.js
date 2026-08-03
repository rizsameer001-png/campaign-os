import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { publicFormLimiter } from '../../middleware/rateLimiter.js';
import { sendSuccess, sendPaginated } from '../../utils/responseFormatter.js';

const router = Router();

router.get('/services', async (req, res, next) => {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { title: 'asc' } });
    return sendSuccess(res, { data: services });
  } catch (err) { next(err); }
});

router.get('/services/:slug', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({ where: { slug: req.params.slug } });
    if (!service || !service.isActive) return sendSuccess(res, { data: null, message: 'Service not found', status: 404 });
    return sendSuccess(res, { data: service });
  } catch (err) { next(err); }
});

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

router.post('/contact', publicFormLimiter, validateRequest(contactSchema), async (req, res, next) => {
  try {
    const lead = await prisma.lead.create({
      data: { ...req.body, source: 'contact_form' },
    });
    const { notifyAdminsOfNewLead } = await import('../notifications/notifications.service.js');
    await notifyAdminsOfNewLead(lead).catch(() => {});
    return sendSuccess(res, { data: { id: lead.id }, message: "Thanks - we'll be in touch soon.", status: 201 });
  } catch (err) { next(err); }
});

const serviceInquirySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  serviceInterest: z.string().min(1),
  message: z.string().optional(),
});

router.post('/service-inquiry', publicFormLimiter, validateRequest(serviceInquirySchema), async (req, res, next) => {
  try {
    const lead = await prisma.lead.create({ data: { ...req.body, source: 'service_inquiry' } });

    const { notifyAdminsOfNewLead, sendServiceInquiryAutoReply } = await import('../notifications/notifications.service.js');
    await Promise.all([
      notifyAdminsOfNewLead(lead).catch(() => {}),
      sendServiceInquiryAutoReply(req.body.email).catch(() => {}),
    ]);

    return sendSuccess(res, { data: { id: lead.id }, message: "Thanks - we'll follow up shortly.", status: 201 });
  } catch (err) { next(err); }
});

router.get('/candidate/:slug', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, name: true, bio: true, profilePhotoUrl: true, socialLinks: true,
        state: true, constituencyName: true, party: true, profileVisibility: true,
      },
    });
    if (!user || !user.profileVisibility) {
      return sendSuccess(res, { data: null, message: 'Profile not found', status: 404 });
    }

    const { id, profileVisibility, ...publicFields } = user;

    const manifestoLog = await prisma.aiUsageLog.findFirst({
      where: { userId: id, toolType: 'manifesto' },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, {
      data: { ...publicFields, manifestoSummary: manifestoLog?.metadata?.sections?.[0]?.content ?? null },
    });
  } catch (err) { next(err); }
});

router.post('/candidate/:slug/support', publicFormLimiter, validateRequest(z.object({ email: z.string().email() })), async (req, res, next) => {
  try {
    const candidate = await prisma.user.findUnique({ where: { slug: req.params.slug } });
    if (!candidate) return sendSuccess(res, { data: null, message: 'Candidate not found', status: 404 });

    await prisma.lead.create({
      data: { name: 'Supporter', email: req.body.email, source: 'referral', serviceInterest: `Support: ${candidate.name}` },
    });
    return sendSuccess(res, { message: 'Thanks for your support!' });
  } catch (err) { next(err); }
});

router.get('/constituencies', async (req, res, next) => {
  try {
    const { state, page = 1, limit = 50 } = req.query;
    const where = state ? { state } : {};
    const [items, total] = await Promise.all([
      prisma.constituency.findMany({
        where, orderBy: { name: 'asc' }, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        select: { id: true, name: true, state: true, population: true },
      }),
      prisma.constituency.count({ where }),
    ]);
    return sendPaginated(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (err) { next(err); }
});

router.get('/constituency/:name', async (req, res, next) => {
  try {
    const state = req.query.state;
    const constituency = await prisma.constituency.findFirst({
      where: { name: req.params.name, ...(state ? { state } : {}) },
      select: { name: true, state: true, population: true, literacyRate: true, urbanPercent: true, pastWinner: true, pastWinnerParty: true },
    });
    if (!constituency) return sendSuccess(res, { data: null, message: 'Constituency not found', status: 404 });
    return sendSuccess(res, { data: constituency });
  } catch (err) { next(err); }
});

export default router;
