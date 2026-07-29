import type { Core } from '@strapi/strapi';

interface DocumentsMiddlewareContext {
  action: string;
  uid: string;
  params: { documentId?: string; [key: string]: unknown };
  contentType: { options?: { draftAndPublish?: boolean; [key: string]: unknown } };
}

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.documents.use(async (context: DocumentsMiddlewareContext, next: () => Promise<unknown>) => {
    const result = await next();
    const scheduleIndexingService = strapi.plugins['elasticsearch'].services.scheduleIndexing;
    const elasticsearchConfig = (strapi as unknown as { elasticsearch: { collections: string[] } }).elasticsearch;
    if (['create', 'update', 'delete', 'publish', 'unpublish'].includes(context.action)
    && elasticsearchConfig.collections.includes(context.uid)) {
      console.log('Document services context : ', context.action, ' ', context.uid, ' ', context.params.documentId);
      if (context.contentType.options.draftAndPublish === true) {
        //publish, unpublish
        if (context.action === 'publish') {
          await scheduleIndexingService.addItemToIndex({
            collectionUid: context.uid,
            recordId: context.params.documentId
          });
        }
        else if (context.action === 'unpublish') {
          await scheduleIndexingService.removeItemFromIndex({
            collectionUid: context.uid,
            recordId: context.params.documentId
          });
        }
      }
      else {
        if (['create', 'update'].includes(context.action)) {
          await scheduleIndexingService.addItemToIndex({
            collectionUid: context.uid,
            recordId: context.params.documentId
          });
        }
      }
      if (context.action === 'delete') {
        await scheduleIndexingService.removeItemFromIndex({
          collectionUid: context.uid,
          recordId: context.params.documentId
        });
      }
    }
  return result;
  });
};

export default register;
