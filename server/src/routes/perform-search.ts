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
        path: '/search',
        handler: 'performSearch.search',
        config: {
            policies: []
        },
      }
    ] as Route[],
  };
