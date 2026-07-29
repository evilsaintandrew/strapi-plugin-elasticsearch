import type { Core } from '@strapi/strapi';


export default {
    // accessible only from admin UI
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/indexing-run-log',
        handler: 'logIndexing.fetchRecentRunsLog',
        config: { policies: [] },
      }
    ] as Core.RouteInput[],
  };
