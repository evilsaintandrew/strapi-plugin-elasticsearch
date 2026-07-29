import type { Core } from '@strapi/strapi';
import type { Context as KoaContext } from 'koa';
import qs from 'qs';

type Ctx = KoaContext;

// `strapi` is provided as a global by the Strapi runtime (matches original behavior).
declare const strapi: Core.Strapi;

export default {
  search : async (ctx: Ctx) => {
    try {
        const esInterface = strapi.plugins['elasticsearch'].services.esInterface as any;
        if (ctx.query.query)
        {
          const query = qs.parse(ctx.query.query as string);
          const resp = await esInterface.searchData(query);
          if (resp?.hits?.hits)
          {
            const filteredData = resp.hits.hits.filter((dt: { _source: unknown }) => dt._source !== null);
            const filteredMatches = filteredData.map((dt: { _source: unknown }) => dt['_source']);
            ctx.body = filteredMatches;
          }
          else
            ctx.body = {}
        }
        else
          ctx.body = {}
      } catch (err) {
        ctx.response.status = 500;
        ctx.body = "An error was encountered while processing the search request."
        console.log('An error was encountered while processing the search request.')
        console.log(err);
      }
  }
};
