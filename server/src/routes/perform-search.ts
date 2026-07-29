import type { Core } from '@strapi/strapi';


export default {
    // accessible only from admin UI
    type: 'content-api',
    routes: [
      {
        method: 'GET',
        path: '/search',
        handler: 'performSearch.search',
        config: {
            policies: []
        },
      }
    ] as Core.RouteInput[],
  };
