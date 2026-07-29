// Add custom types for the server side here.
import type { Struct } from '@strapi/strapi';

declare module '@strapi/types' {
  export module Public {
    export module Registries {
      export interface ContentTypeSchemas {
        'plugin::elasticsearch.task': Struct.CollectionTypeSchema & {
          attributes: Struct.SchemaAttributes & {
            collection_name: { type: 'string'; required: true };
            item_document_id: { type: 'string' };
            indexing_status: { type: 'enumeration'; enum: ['to-be-done', 'done']; required: true; default: 'to-be-done' };
            full_site_indexing: { type: 'boolean' };
            indexing_type: { type: 'enumeration'; enum: ['add-to-index', 'remove-from-index']; required: true; default: 'add-to-index' };
          };
        };
        'plugin::elasticsearch.indexing-log': Struct.CollectionTypeSchema & {
          attributes: Struct.SchemaAttributes & {
            status: { type: 'enumeration'; enum: ['pass', 'fail']; required: true };
            details: { type: 'text' };
          };
        };
      }
    }
  }
}
