import type { Core, UID } from '@strapi/strapi';
import { isEmpty, merge } from 'lodash/fp';
import transformServiceProvider from './transform-content';

// The original implementation relied on Strapi's global `strapi` in these
// module-level helpers. Preserve that behavior with a typed accessor that is
// resolved at call time (not at module load time).
const getStrapi = (): Core.Strapi => (globalThis as { strapi: Core.Strapi }).strapi;

///START : via https://raw.githubusercontent.com/Barelydead/strapi-plugin-populate-deep/main/server/helpers/index.js

const getPluginStore = () => {
    return getStrapi().store({
      environment: '',
      type: 'plugin',
      name: 'elasticsearch',
    });
  }

const getModelPopulationAttributes = (model: any) => {
  if (model.uid === "plugin::upload.file") {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }

  return model.attributes;
};

const getFullPopulateObject = (modelUid: string, maxDepth = 20, ignore?: string[]): any => {
  const skipCreatorFields = true;

  if (maxDepth <= 1) {
    return true;
  }
  if (modelUid === "admin::user" && skipCreatorFields) {
    return undefined;
  }

  const populate: Record<string, unknown> = {};
  const model = getStrapi().getModel(modelUid as UID.ContentType);
  if (ignore && !ignore.includes(model.collectionName)) ignore.push(model.collectionName)
  for (const [key, value] of Object.entries(
    getModelPopulationAttributes(model)
  ) as [string, any][]) {
    if (ignore?.includes(key)) continue
    if (value) {
      if (value.type === "component") {
        populate[key] = getFullPopulateObject(value.component, maxDepth - 1);
      } else if (value.type === "dynamiczone") {
        const dynamicPopulate = value.components.reduce((prev: any, cur: string) => {
          const curPopulate = getFullPopulateObject(cur, maxDepth - 1);
          return curPopulate === true ? prev : merge(prev, curPopulate);
        }, {});

        populate[key] = isEmpty(dynamicPopulate) ? true : { on: dynamicPopulate.populate };
      } else if (value.type === "relation") {
        const relationPopulate = getFullPopulateObject(
          value.target,
          (key === 'localizations') && maxDepth > 2 ? 1 : maxDepth - 1,
          ignore
        );
        if (relationPopulate) {
          populate[key] = relationPopulate;
        }
      } else if (value.type === "media") {
        populate[key] = true;
      }
    }
  }
  return isEmpty(populate) ? true : { populate };
};

///END : via https://raw.githubusercontent.com/Barelydead/strapi-plugin-populate-deep/main/server/helpers/index.js

const getPopulateObjectForComponent = (componentUid: string) => {
    const componentSchema = (getStrapi().plugin('content-manager').service('components') as any).findAllComponents().filter((c: any) => c.uid === componentUid)[0];
    const componentAttributes = componentSchema.attributes;
    const populate: Record<string, any> = {};
    for (const attributeName of Object.keys(componentAttributes)) {
      const attribute = componentAttributes[attributeName];
      if (attribute.type === 'component') {
        populate[attributeName] = getPopulateObjectForComponent(attribute.component) ;
      }
      else if (attribute.type === 'media') {
        populate[attributeName] = { fields: ['*'] };
      }
    }
    return { populate };
  }

const getPopulateForACollection = (collectionUid: string) => {
    const collection = (getStrapi().plugin('content-manager').service('content-types') as any).findAllContentTypes().filter((c: any) => c.uid === collectionUid)[0];
    const selCollAttributes = collection.attributes;
    const populate: Record<string, any> = {};
    const fields: string[] = [];
    for (const attributeName of Object.keys(selCollAttributes)) {
      const attribute = selCollAttributes[attributeName];
      if (attribute.type === 'dynamiczone') {
        populate[attributeName] = {
          on: attribute.components.reduce((acc: Record<string, any>, componentUid: string) => {
            acc[componentUid] = getPopulateObjectForComponent(componentUid);
            return acc;
          }, {})
        };
      } else if (attribute.type === 'component') {
        populate[attributeName] = getPopulateObjectForComponent(attribute.component);
      }
      else if (attribute.type === 'media') {
        populate[attributeName] = { fields: ['*'] };
      }
      else if (attribute.type === 'relation') {
        //do nothing since we currently don't support working with relations
      }
      else
      {
        fields.push(attributeName);
      }
    }
    return { populate, fields };

};

/*
//Example config to cover extraction cases
            collectionConfig[collectionName] = {
                'major' : {index: true},
                'sections' : { index: true, searchFieldName: 'information',
                    'subfields' : [
                        { 'component' : 'try.paragraph',
                            'field' : 'Text'},
                        { 'component' : 'try.paragraph',
                            'field' : 'Heading'},
                        { 'component' : 'try.footer',
                            'field' : 'footer_link',
                            'subfields' :[ {
                                'component' : 'try.link',
                                'field' : 'display_text'
                            }]
                        }] },
                'seo details' : {
                    index: true, searchFieldName: 'seo',
                    'subfields' : [
                        {
                            'component' : 'try.seo',
                            'field' : 'meta_description'
                        }
                    ]
                },
                'changelog' : {
                    index: true, searchFieldName: 'breakdown',
                    'subfields' : [
                        {
                            'component' : 'try.revision',
                            'field' : 'summary'
                        }
                    ]
                }
            }
*/
function extractSubfieldData({config, data }: {config: any[], data: any}): string {
    let returnData = '';
    if (data === null)
        return returnData;
    if (Array.isArray(data))
    {
        const dynDataItems = data;
        for (let r=0; r< dynDataItems.length; r++)
        {
            const extractItem = dynDataItems[r];
            for (let s=0; s<config.length; s++)
            {
                const conf = config[s];
                if (Object.keys(extractItem).includes('__component'))
                {
                    if (conf.component === extractItem.__component &&
                        !Object.keys(conf).includes('subfields') &&
                        typeof extractItem[conf['field']] !== "undefined" &&
                        extractItem[conf['field']])
                    {
                        let val = extractItem[conf['field']]
                        if (Object.keys(conf).includes('transform')
                            && conf['transform'] === 'markdown')
                            val = transformServiceProvider.transform({content: val, from: 'markdown'});
                        returnData = returnData + '\n' + val;
                    }
                    else if (conf.component === extractItem.__component &&
                        Object.keys(conf).includes('subfields'))
                    {
                        returnData = returnData + '\n' + extractSubfieldData({
                            config: conf['subfields'], data: extractItem[conf['field']]});
                    }
                }
                else
                {
                    if (!Object.keys(conf).includes('subfields') &&
                    typeof extractItem[conf['field']] !== "undefined" &&
                    extractItem[conf['field']])
                    {
                        let val = extractItem[conf['field']]
                        if (Object.keys(conf).includes('transform')
                            && conf['transform'] === 'markdown')
                            val = transformServiceProvider.transform({content: val, from: 'markdown'});
                        returnData = returnData + '\n' + val;
                    }
                    else if (Object.keys(conf).includes('subfields'))
                    {
                        returnData = returnData + '\n' + extractSubfieldData({
                            config: conf['subfields'], data: extractItem[conf['field']]});
                    }
                }
            }
        }
    }
    else //for single component as a field
    {
        for (let s=0; s<config.length; s++)
        {
            const conf = config[s];
            if (!Object.keys(conf).includes('subfields') &&
            typeof data[conf['field']] !== "undefined" &&
            data[conf['field']])
                returnData = returnData + '\n' + data[conf['field']]
            else if (Object.keys(conf).includes('subfields'))
            {
                returnData = returnData + '\n' + extractSubfieldData({
                    config: conf['subfields'], data: data[conf['field']]});
            }
        }
    }
    return returnData;
}

const tranformValueBeforeSubmittingToElasticsearch = (val: any, transformerFunctionName: string) => {
  const transformerFunctionsList = (getStrapi().plugins['elasticsearch'] as any).config('transformers');
  if (Object.keys(transformerFunctionsList).includes(transformerFunctionName)) {
    const transformerFunction = transformerFunctionsList[transformerFunctionName];
    return transformerFunction(val);
  }
  else
    return val;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async getElasticsearchInfo() {
        const configureService = (strapi.plugins['elasticsearch'] as any).services.configureIndexing;
        const esInterface = (strapi.plugins['elasticsearch'] as any).services.esInterface;
        const pluginConfig: any = await strapi.config.get('plugin::elasticsearch');

        const connected = pluginConfig.searchConnector && pluginConfig.searchConnector.host
         ? await esInterface.checkESConnection() : false;

        return {
            indexingCronSchedule : pluginConfig.indexingCronSchedule || "Not configured",
            elasticHost : pluginConfig.searchConnector ?
                            pluginConfig.searchConnector.host || "Not configured" : "Not configured",
            elasticUserName : pluginConfig.searchConnector ?
                            pluginConfig.searchConnector.username || "Not configured" : "Not configured",
            elasticCertificate : pluginConfig.searchConnector ?
            pluginConfig.searchConnector.certificate || "Not configured" : "Not configured",
            elasticIndexAlias : pluginConfig.indexAliasName || "Not configured",
            connected : connected,
            initialized : configureService.isInitialized()
        }
    },
    isCollectionDraftPublish({collectionName}: {collectionName: string}) {
        const model = strapi.getModel(collectionName as UID.ContentType);
        return 'publishedAt' in model.attributes ? true : false
    },
    getPopulateAttribute({collectionName}: {collectionName: string}) {
        //TODO : We currently have set populate to upto 4 levels, should
        //this be configurable or a different default value?
        return getFullPopulateObject(collectionName, 4, []);
    },
    getPopulateForACollection({collectionName}: {collectionName: string}) {
        return getPopulateForACollection(collectionName);
    },
    getIndexItemId ({collectionName, itemDocumentId}: {collectionName: string, itemDocumentId: string}) {
        return collectionName+'::' + itemDocumentId;
    },
    async getCurrentIndexName (): Promise<string> {
        const pluginStore = getPluginStore();
        const settings: any = await pluginStore.get({ key: 'configsettings' });
        let indexName = 'strapi-plugin-elasticsearch-index_000001';
        if (settings)
        {
          const objSettings = JSON.parse(settings);
          if (Object.keys(objSettings).includes('indexConfig'))
          {
            const idxConfig = objSettings['indexConfig'];
            indexName = idxConfig['name'];
          }
        }
        return indexName;
    },
    async getIncrementedIndexName (): Promise<string> {
        const currentIndexName = await this.getCurrentIndexName();
        const number = parseInt(currentIndexName.split('index_')[1]);
        return 'strapi-plugin-elasticsearch-index_' + String(number+1).padStart(6,'0');
    },
    async storeCurrentIndexName (indexName: string) {
        const pluginStore = getPluginStore();
        const settings: any = await pluginStore.get({ key: 'configsettings' });
        if (settings)
        {
            const objSettings = JSON.parse(settings);
            objSettings['indexConfig'] = {'name' : indexName};
            await pluginStore.set({ key: 'configsettings', value : JSON.stringify(objSettings)});
        }
        else
        {
            const newSettings =  JSON.stringify({'indexConfig' : {'name' : indexName}})
            await pluginStore.set({ key: 'configsettings', value : newSettings});
        }
    },
    modifySubfieldsConfigForExtractor(collectionConfig: any) {
        const collectionName = Object.keys(collectionConfig)[0];
        const attributes = Object.keys(collectionConfig[collectionName]);
        for (let r=0; r< attributes.length; r++)
        {
            const attr = attributes[r];
            const attribFields = Object.keys(collectionConfig[collectionName][attr]);
            if (attribFields.includes('subfields'))
            {
                const subfielddata = collectionConfig[collectionName][attr]['subfields'];
                if (subfielddata.length > 0)
                {
                    try {
                        const subfieldjson = JSON.parse(subfielddata)
                        if (Object.keys(subfieldjson).includes('subfields'))
                            collectionConfig[collectionName][attr]['subfields'] = subfieldjson['subfields']
                    }
                    catch(err)
                    {
                        continue;
                    }
                }
            }
        }
        return collectionConfig;
    },
    extractDataToIndex({collectionName, data, collectionConfig}: {collectionName: string, data: any, collectionConfig: any}) {
        collectionConfig = this.modifySubfieldsConfigForExtractor(collectionConfig);
        const fti = Object.keys(collectionConfig[collectionName]);
        const document: Record<string, any> = {}
        for (let k = 0; k < fti.length; k++)
        {
            const fieldConfig = collectionConfig[collectionName][fti[k]];
            if (fieldConfig.index)
            {
                let val = null;
                if (Object.keys(fieldConfig).includes('subfields'))
                {
                    val = extractSubfieldData({config: fieldConfig['subfields'], data: data[fti[k]]})
                    val = val ? val.trim() : val
                }
                else
                {
                    val = data[fti[k]];
                    if (Object.keys(fieldConfig).includes('transform') &&
                        fieldConfig['transform'] === 'markdown')
                        val = transformServiceProvider.transform({content: val, from: 'markdown'});
                }

                if (Object.keys(fieldConfig).includes('searchFieldName'))
                    document[fieldConfig['searchFieldName']] = fieldConfig['transformerFunction'] ? tranformValueBeforeSubmittingToElasticsearch(val, fieldConfig['transformerFunction']) : val;
                else
                    document[fti[k]] = fieldConfig['transformerFunction'] ? tranformValueBeforeSubmittingToElasticsearch(val, fieldConfig['transformerFunction']) : val;
            }
        }
        return document;
    }
});
