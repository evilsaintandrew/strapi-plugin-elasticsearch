import type { Core, Modules } from '@strapi/strapi';

type DocumentMiddlewareContext = Modules.Documents.Middleware.Context;

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.documents.use(async (context, next) => {
    const ctx = context as DocumentMiddlewareContext;
    const result = await next();
    const scheduleIndexingService = strapi.plugins['elasticsearch'].services.scheduleIndexing;
    const elasticsearchConfig = (strapi as unknown as { elasticsearch: { collections: string[] } }).elasticsearch;
    if (['create', 'update', 'delete', 'publish', 'unpublish'].includes(ctx.action)
    && elasticsearchConfig.collections.includes(ctx.uid)) {
      console.log('Document services context : ', ctx.action, ' ', ctx.uid, ' ', (ctx.params as { documentId?: string }).documentId);
      if (ctx.contentType.options.draftAndPublish === true) {
        //publish, unpublish
        if (ctx.action === 'publish') {
          await scheduleIndexingService.addItemToIndex({
            collectionUid: ctx.uid,
            recordId: (ctx.params as { documentId?: string }).documentId as string
          });
        }
        else if (ctx.action === 'unpublish') {
          await scheduleIndexingService.removeItemFromIndex({
            collectionUid: ctx.uid,
            recordId: (ctx.params as { documentId?: string }).documentId as string
          });
        }
      }
      else {
        if (['create', 'update'].includes(ctx.action)) {
          await scheduleIndexingService.addItemToIndex({
            collectionUid: ctx.uid,
            recordId: (ctx.params as { documentId?: string }).documentId as string
          });
        }
      }
      if (ctx.action === 'delete') {
        await scheduleIndexingService.removeItemFromIndex({
          collectionUid: ctx.uid,
          recordId: (ctx.params as { documentId?: string }).documentId as string
        });
      }
    }
  return result;
  });
};

export default register;
