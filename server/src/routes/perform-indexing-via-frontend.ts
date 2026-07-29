import type { Core } from '@strapi/strapi';


export default {
    // accessible only from admin UI
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/trigger-indexing/',
        handler: 'performIndexing.triggerIndexing',
        config: { policies: [] },
      },
    ] as Core.RouteInput[],
  };
