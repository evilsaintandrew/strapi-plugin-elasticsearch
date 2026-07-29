import type { Core } from '@strapi/strapi';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  getWelcomeMessage(): string {
    return 'Welcome to Strapi 🚀';
  },
});

export default service;
