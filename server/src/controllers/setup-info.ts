import type { Core } from '@strapi/strapi';
import type { Context as KoaContext } from 'koa';

type Ctx = KoaContext;

export default ({ strapi }: { strapi: Core.Strapi }) => {
    const helperService = strapi.plugins['elasticsearch'].services.helper as any;
    const getElasticsearchInfo = async (ctx: Ctx) => {
        return helperService.getElasticsearchInfo();
    }

    return {
        getElasticsearchInfo,
    };
}
