interface Route {
  method: string;
  path: string;
  handler: string;
  config: { policies: string[] };
}

export default [
  {
    method: 'GET',
    path: '/',
    // name of the controller file & the method.
    handler: 'controller.index',
    config: {
      policies: [],
    },
  },
] as Route[];
