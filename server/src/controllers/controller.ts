import type { Core } from '@strapi/strapi';
import type { Context as KoaContext } from 'koa';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  index(ctx: KoaContext) {
    ctx.body = strapi
      .plugin('strapi-plugin-elasticsearch')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },
});

export default controller;
