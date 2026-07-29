import pluginId from "../pluginId";
export const apiGetContentConfig = `/${pluginId}/content-config/`
export const apiGetCollectionConfig = (collectionName: string) => `/${pluginId}/collection-config/${collectionName}`
export const apiSaveCollectionConfig = (collectionName: string) => `/${pluginId}/collection-config/${collectionName}`
export const apiGetElasticsearchSetupInfo = `/${pluginId}/setup-info`
export const apiFetchRecentIndexingRunLog = `/${pluginId}/indexing-run-log`
export const apiRequestReIndexing = `/${pluginId}/reindex`
export const apiRequestCollectionIndexing = (collectionName: string) => `/${pluginId}/collection-reindex/${collectionName}`
export const apiTriggerIndexing = `/${pluginId}/trigger-indexing/`

export const apiExportContentConfig = `/${pluginId}/export-content-config/`
export const apiImportContentConfig = `/${pluginId}/import-content-config/`
export const apiGetTransformers = `/${pluginId}/list-transformers/`
