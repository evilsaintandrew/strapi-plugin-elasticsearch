import type { Core } from '@strapi/strapi';


export default {
    // accessible only from admin UI
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/setup-info',
        handler: 'setupInfo.getElasticsearchInfo',
        config: { policies: [] },
      }
    ] as Core.RouteInput[],
  };
