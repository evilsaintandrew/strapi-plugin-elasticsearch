interface Route {
  method: string;
  path: string;
  handler: string;
  config: { policies: string[] };
}

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
    ] as Route[],
  };
