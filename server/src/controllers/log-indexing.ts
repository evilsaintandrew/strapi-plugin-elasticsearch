import type { Core } from '@strapi/strapi';
import type { Context as KoaContext } from 'koa';

type Ctx = KoaContext;

export default ({ strapi }: { strapi: Core.Strapi }) => {
    const logIndexingService = strapi.plugins['elasticsearch'].services.logIndexing as any;
    const fetchRecentRunsLog = async (ctx: Ctx) => {
        return await logIndexingService.fetchIndexingLogs();
    }

    return {
        fetchRecentRunsLog
    };
}
