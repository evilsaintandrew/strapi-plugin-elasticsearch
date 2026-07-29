import type { Core } from '@strapi/strapi';

interface ElasticsearchState {
  initialized?: boolean;
  collections?: string[];
  collectionsconfig?: string[];
}

interface StrapiWithElasticsearch extends Core.Strapi {
  elasticsearch?: ElasticsearchState;
}

interface PluginElasticsearchConfig {
  allowIndexingMetadataFields?: boolean;
  [key: string]: unknown;
}

interface AttributeConfig {
  index: boolean;
  type: string;
}

type CollectionConfig = Record<string, AttributeConfig>;
type ContentConfig = Record<string, CollectionConfig>;

// `strapi` is provided as a global by the Strapi runtime (used by getPluginStore below).
declare const strapi: StrapiWithElasticsearch;

const getPluginStore = () => {
  return strapi.store({
    environment: '',
    type: 'plugin',
    name: 'elasticsearch',
  });
}

export default ({ strapi }: { strapi: StrapiWithElasticsearch }) => ({
  async initializeStrapiElasticsearch() {
    await this.cacheConfig();
  },
  async markInitialized() {
    if (!strapi.elasticsearch)
      strapi.elasticsearch = {}
    strapi.elasticsearch.initialized = true;
  },
  isInitialized(): boolean {
    return strapi.elasticsearch?.initialized || false
  },
  async cacheConfig() {
    if (!strapi.elasticsearch)
      strapi.elasticsearch = {}
    strapi.elasticsearch.collectionsconfig = await this.getCollectionsConfiguredForIndexing();
    strapi.elasticsearch.collections = await this.getCollectionsConfiguredForIndexing();
  },
  async getCollectionConfig({collectionName}: {collectionName: string}) {
    const contentConfig = await this.getContentConfig();
    if (Object.keys(contentConfig).includes(collectionName))
    {
      const ob: ContentConfig = {}
      ob[collectionName] = contentConfig[collectionName];
      return ob;
    }
    else
      return null;
  },
  async getCollectionsConfiguredForIndexing(): Promise<string[]> {
    const contentConfig = await this.getContentConfig();
    if (contentConfig)
      return Object.keys(contentConfig).filter((i) => {
        let hasAtleastOneIndexableAttribute = false;
        const attribs = Object.keys(contentConfig[i])
        for (let k=0; k<attribs.length; k++)
        {
          if (contentConfig[i][attribs[k]]['index'] === true)
          {
            hasAtleastOneIndexableAttribute = true;
            break;
          }
        }
        return hasAtleastOneIndexableAttribute;
      })
    else
      return [];
  },
  async isCollectionConfiguredToBeIndexed({collectionName}: {collectionName: string}): Promise<boolean> {
    const collectionsToIndex = await this.getCollectionsConfiguredForIndexing();
    return collectionsToIndex.includes(collectionName);
  },
  async getContentConfig(): Promise<ContentConfig> {
    const pluginConfig = strapi.config.get('plugin::elasticsearch') as PluginElasticsearchConfig;
    const fieldsToExclude: string[] = typeof pluginConfig.allowIndexingMetadataFields == 'boolean' &&  pluginConfig.allowIndexingMetadataFields == true ? [] : ['createdAt', 'createdBy', 'publishedAt', 'publishedBy', 'updatedAt', 'updatedBy']
    const pluginStore = getPluginStore();
    const settings = await pluginStore.get({ key: 'configsettings' }) as string | null;
    const contentTypes = strapi.contentTypes as Record<string, { attributes: Record<string, Record<string, unknown>> }>;
    const apiContentTypes = Object.keys(contentTypes).filter((c) => c.includes('api::'));
    const apiContentConfig: ContentConfig = {};
    for (let r = 0; r < apiContentTypes.length; r++)
    {
      apiContentConfig[apiContentTypes[r]] = {};
      const collectionAttributes = contentTypes[apiContentTypes[r]].attributes
      const listOfAttributes = Object.keys(collectionAttributes).filter(
        (i) => fieldsToExclude.includes(i) === false
      );

      for (let k = 0; k < listOfAttributes.length; k++)
      {
        const currentAttribute = listOfAttributes[k];
        let attributeType = "regular";
        if (typeof collectionAttributes[currentAttribute]["type"] !== "undefined"
          && collectionAttributes[currentAttribute]["type"] !== null)
          {
            if (collectionAttributes[currentAttribute]["type"] === "component")
              attributeType = "component"
            else if (collectionAttributes[currentAttribute]["type"] === "dynamiczone")
              attributeType = "dynamiczone"
          }
        apiContentConfig[apiContentTypes[r]][listOfAttributes[k]] = {index: false,
            type: attributeType}
      }

    }
    if (settings)
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objSettings: Record<string, any> = JSON.parse(settings);
      if (Object.keys(objSettings).includes('contentConfig'))
      {
        const collections = Object.keys(apiContentConfig);
        for (let r=0; r< collections.length; r++)
        {
          if (Object.keys(objSettings['contentConfig']).includes(collections[r]))
          {
            const attribsForCollection = Object.keys(apiContentConfig[collections[r]])
            for (let s = 0; s < attribsForCollection.length; s++)
            {
              if (!Object.keys(objSettings['contentConfig'][collections[r]]).includes(attribsForCollection[s]))
              {
                objSettings['contentConfig'][collections[r]][attribsForCollection[s]] = {index: false,
                  type: apiContentConfig[collections[r]][attribsForCollection[s]].type}
              }
              else
              {
                if (!Object.keys(objSettings['contentConfig'][collections[r]][attribsForCollection[s]]).includes('type'))
                  objSettings['contentConfig'][collections[r]][attribsForCollection[s]]['type'] = apiContentConfig[collections[r]][attribsForCollection[s]].type
              }
            }
          }
          else
            objSettings['contentConfig'][collections[r]] = apiContentConfig[collections[r]]
        }
        return objSettings['contentConfig'];
      }
      else
        return apiContentConfig
    }
    else
      return apiContentConfig;
  },
  getTransformers(): string[] {
    const elasticsearchPlugin = strapi.plugins['elasticsearch'] as unknown as { config: (key: string) => Record<string, unknown> | undefined };
    return Object.keys(elasticsearchPlugin.config('transformers') || {});
  },
  async importContentConfig({config}: {config: string}){
    const pluginStore = getPluginStore();
    const settings = await pluginStore.get({ key: 'configsettings' }) as string | null;
    if (settings)
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objSettings: Record<string, any> = JSON.parse(settings);
      objSettings['contentConfig'] = JSON.parse(config)
      const stringifySettings = JSON.stringify(objSettings);
      await pluginStore.set({ key: 'configsettings', value : stringifySettings });
    }
    else
    {
      const newSettings =  JSON.stringify({'contentConfig' : config})
      await pluginStore.set({ key: 'configsettings', value : newSettings});
    }
    const updatedSettings = await pluginStore.get({ key: 'configsettings' }) as Record<string, any> | null;
    await this.cacheConfig();
    if (updatedSettings && Object.keys(updatedSettings).includes('contentConfig'))
      return updatedSettings['contentConfig']
    else
      return {};
  },
  async setContentConfig({collection, config}: {collection?: string, config: Record<string, unknown>}){
    const pluginStore = getPluginStore();
    const settings = await pluginStore.get({ key: 'configsettings' }) as string | null;
    if (settings)
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objSettings: Record<string, any> = JSON.parse(settings);
      if (Object.keys(objSettings).includes('contentConfig'))
      {
        const prevConfig = objSettings['contentConfig'];
        const changedConfigKey = Object.keys(config)[0];
        const newConfig = prevConfig;
        newConfig[changedConfigKey] = config[changedConfigKey]
        objSettings['contentConfig'] = newConfig
      }
      else
        objSettings['contentConfig'] = config;
      const stringifySettings = JSON.stringify(objSettings);
      await pluginStore.set({ key: 'configsettings', value : stringifySettings });
    }
    else
    {
      const newSettings =  JSON.stringify({'contentConfig' : config})
      await pluginStore.set({ key: 'configsettings', value : newSettings});
    }
    const updatedSettings = await pluginStore.get({ key: 'configsettings' }) as Record<string, any> | null;
    await this.cacheConfig();
    if (updatedSettings && Object.keys(updatedSettings).includes('contentConfig'))
      return updatedSettings['contentConfig']
    else
      return {};
  },
});
