import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async recordIndexingPass(message: string) {
        const entry = await strapi.documents('plugin::elasticsearch.indexing-log').create({
            data : {
                status: 'pass',
                details: message
            }
        });
    },
    async recordIndexingFail(message: unknown) {
        const entry = await strapi.documents('plugin::elasticsearch.indexing-log').create({
            data : {
                status: 'fail',
                details: String(message)
            }
        });
    },
    async fetchIndexingLogs(count = 50) {
        const records = await strapi.documents('plugin::elasticsearch.indexing-log').findMany({
            sort: { createdAt: 'desc' },
            start: 0,
            limit: count
        });
        return records;
    }
});
