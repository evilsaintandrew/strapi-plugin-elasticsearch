import type { Core } from '@strapi/strapi';
import type { Context as KoaContext } from 'koa';

type Ctx = KoaContext;

export default ({ strapi }: { strapi: Core.Strapi }) => {
    const indexer = strapi.plugins['elasticsearch'].services.indexer as any;
    const scheduleIndexingService = strapi.plugins['elasticsearch'].services.scheduleIndexing as any;
    const rebuildIndex = async (ctx: Ctx) => {
        return await indexer.rebuildIndex();
    }

    const indexCollection = async (ctx: Ctx) => {
        if (ctx.params.collectionname)
            return await scheduleIndexingService.addCollectionToIndex({collectionUid: ctx.params.collectionname})
        else
            return null;
    }

    const triggerIndexing = async (ctx: Ctx) => {
        return await indexer.indexPendingData()
    }

    const triggerIndexingTask = async (ctx: Ctx) => {
        return await indexer.indexPendingData()
    }

    return {
        rebuildIndex,
        indexCollection,
        triggerIndexingTask,
        triggerIndexing
    };
}
