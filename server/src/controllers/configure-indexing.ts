import type { Core } from '@strapi/strapi';

type Ctx = Core.Context;

export default ({ strapi }: { strapi: Core.Strapi }) => {
  // Plugin services are not statically typed; cast once at the boundary.
  const configureIndexingService = strapi.plugins['elasticsearch'].services.configureIndexing as any;

  const getContentConfig = async (ctx: Ctx) => {
    return configureIndexingService.getContentConfig();
  };

  const getTransformers = async (ctx: Ctx) => {
    return configureIndexingService.getTransformers();
  };

  const saveCollectionConfig = async (ctx: Ctx) => {
    const body = ctx.request.body as Record<string, any>;
    try {
      const updatedConfig = await configureIndexingService.setContentConfig({collection: ctx.params.collectionname, config : body.data});
      return updatedConfig;
    } catch (err) {
      ctx.throw(500, err);
    }
  };

  const importContentConfig = async (ctx: Ctx) => {
    const body = ctx.request.body as Record<string, any>;
    try {
      if (body['data'])
      {
        const updatedConfig = await configureIndexingService.importContentConfig({config : body['data']});
        return updatedConfig;
      }
      else
        ctx.throw(400, 'Invalid parameters')
    } catch (err) {
      ctx.throw(500, err);
    }
  }

  const exportContentConfig = async (ctx: Ctx) => {
    return configureIndexingService.getContentConfig();
  }

  const setContentConfig = async (ctx: Ctx) => {
    const body = ctx.request.body as Record<string, any>;
    try {
        const updatedConfig = await configureIndexingService.setContentConfig({config : body});
        return updatedConfig;
      } catch (err) {
        ctx.throw(500, err);
      }
  }

  const getCollectionConfig = async (ctx: Ctx) => {
    if (ctx.params.collectionname)
      return configureIndexingService.getCollectionConfig({collectionName: ctx.params.collectionname})
    else
      return null;
  }

  return {
    getContentConfig,
    setContentConfig,
    getCollectionConfig,
    saveCollectionConfig,
    exportContentConfig,
    importContentConfig,
    getTransformers
  };
};
