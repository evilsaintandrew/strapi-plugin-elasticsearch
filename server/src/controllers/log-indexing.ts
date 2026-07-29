import type { Core } from '@strapi/strapi';

type Ctx = Core.Context;

export default ({ strapi }: { strapi: Core.Strapi }) => {
    const logIndexingService = strapi.plugins['elasticsearch'].services.logIndexing as any;
    const fetchRecentRunsLog = async (ctx: Ctx) => {
        return await logIndexingService.fetchIndexingLogs();
    }

    return {
        fetchRecentRunsLog
    };
}
