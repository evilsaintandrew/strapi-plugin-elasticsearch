import type { Core } from '@strapi/strapi';

type Ctx = Core.Context;

export default ({ strapi }: { strapi: Core.Strapi }) => {
    const helperService = strapi.plugins['elasticsearch'].services.helper as any;
    const getElasticsearchInfo = async (ctx: Ctx) => {
        return helperService.getElasticsearchInfo();
    }

    return {
        getElasticsearchInfo,
    };
}
