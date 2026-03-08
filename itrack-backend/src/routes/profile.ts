import type { FastifyPluginAsync } from "fastify";

import * as backboardService from "../services/backboardService.js";

const profileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { userId: string } }>("/:userId", async (request) => {
    const { userId } = request.params;
    const profile = await backboardService.getStoredProfile(userId);
    const session = backboardService.getSession(userId);

    return {
      user_id: userId,
      profile,
      dwell_event_count: backboardService.getDwellCount(userId),
      session_dwell_count: session.dwell_count,
    };
  });

  fastify.delete<{ Params: { userId: string } }>("/:userId", async (request) => {
    const { userId } = request.params;
    backboardService.clearProfile(userId);
    return { deleted: true, user_id: userId };
  });
};

export default profileRoutes;
