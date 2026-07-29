interface Route {
  method: string;
  path: string;
  handler: string;
  config: { policies: string[] };
}

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
    ] as Route[],
  };
