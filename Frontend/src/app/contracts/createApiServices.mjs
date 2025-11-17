import { Project, QuoteKind, Scope } from "ts-morph";
import * as path from "path";

import internalApiDefinition from "./Backend_internal-api.json" with { type: 'json' };

const project = new Project({
  manipulationSettings: { quoteKind: QuoteKind.Single },
});

// base dir for the generated api services
const baseDir = path.resolve(`${import.meta.dirname}/generated-client/api-services`);
console.log(baseDir);


// iterate over all api operations and create a service object with method definitions descriptions
const servicesByName = new Map();
for (const [pathKey, pathValue] of Object.entries(internalApiDefinition.paths)) {
  for (const [methodKey, methodValue] of Object.entries(pathValue)) {
    const serviceName = (methodValue.tags ? methodValue.tags[0] : 'Default') + 'ApiService';
    let service = servicesByName.get(serviceName);
    if (!service) {
      service = {name: serviceName, methods: []};
      servicesByName.set(serviceName, service);
    }
    // the url of the method i.e. /api/books
    methodValue.url = pathKey;
    // GET or POST...
    methodValue.httpVerb = methodKey;
    service.methods.push(methodValue);
  }
}


// iterate over all the service objects and create a matching file i.e. books-api.service.ts
for (const [serviceName, service] of servicesByName) {
  const filePath = path.join(baseDir, `${pascalCaseToKebabCase(serviceName).replace("-service", "")}.service.ts`);
  const file = project.createSourceFile(filePath, '', { overwrite: true });

  file.addImportDeclarations([
    { namedImports: ['Injectable'], moduleSpecifier: '@angular/core' },
    { namedImports: ['ApiService', 'RequestParam'], moduleSpecifier: '../../../api-service' },
    { namedImports: ['Observable'], moduleSpecifier: 'rxjs' },
  ]);

  const serviceClassDefinition = file.addClass({
    name: `${serviceName}`,
    isExported: true,
    decorators: [{ name: 'Injectable', arguments: ['{ providedIn: \'root\' }'] }],
  });

  serviceClassDefinition.addConstructor({
    parameters: [{ name: 'apiService', type: 'ApiService', scope: Scope.Private, isReadonly: true }],
  });

  // add methods to the service
  for (const methodOpenApiSpec of service.methods) {
    const pathParams = (methodOpenApiSpec.parameters || []).filter(x => x.in === 'path');
    const queryParams = (methodOpenApiSpec.parameters || []).filter(x => x.in === 'query');

    let methodName = pascalCaseToCamelCase(methodOpenApiSpec["x-method-name"]);
    serviceClassDefinition.addMethod({
      // to camelCase the method name
      name: methodName,
      parameters: getMethodParams(file, methodOpenApiSpec),
      returnType: getReturnType(methodOpenApiSpec, file),
      statements: createMethodStatements(methodOpenApiSpec, pathParams, queryParams),
    });
  }
}

function getMethodParams(file,methodOpenApiSpec) {
  const methodPrams = (methodOpenApiSpec.parameters || []).map((param) => ({
    name: param.name,
    type: getTypescriptTypeFromOpenApiType(file, param.schema),
  }));
  if (methodOpenApiSpec.requestBody)
    methodPrams.push({
      name: "requestBody",
      type: getTypescriptTypeFromOpenApiType(file, methodOpenApiSpec.requestBody.content["application/json"].schema)
    });
  methodPrams.push({
    name: "apiServiceRequestParams",
    type: "RequestParam",
    hasQuestionToken: true
  });
  return methodPrams;
}


function getReturnType(methodOpenApiSpec, file) {
  if (!methodOpenApiSpec.responses ||
    !methodOpenApiSpec.responses['200'] ||
    !methodOpenApiSpec.responses['200'].content ||
    !methodOpenApiSpec.responses['200'].content["application/json"] ||
    !methodOpenApiSpec.responses['200'].content["application/json"].schema
  )
    return undefined;
  return `Observable<${getTypescriptTypeFromOpenApiType(file, methodOpenApiSpec.responses['200'].content["application/json"].schema)}>`;
}

// pascal case to camel case
function pascalCaseToCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function createMethodStatements(methodOpenApiSpec, pathParams, queryParams) {
  return `return this.apiService.handleInternalApiCall({
    url: \"${methodOpenApiSpec.url}\",
    pathParams: {${pathParams.map(x => x.name).join(', ')}},
    queryParams: {${queryParams.map(x => x.name).join(', ')}},
    httpVerb: \"${methodOpenApiSpec.httpVerb}\",
    requestBody: ${methodOpenApiSpec.requestBody ? 'requestBody' : 'undefined'},
    apiServiceRequestParams
});`;
}

function getTypescriptTypeFromOpenApiType(file, {type:openApiType, format:openApiFormat,$ref,...schema}){
  if (openApiType === "array")
  {
    const singleItemType = getTypescriptTypeFromOpenApiType(file, schema.items);
    return `${singleItemType}[]`;
  }
  if ($ref) {
    let interfaceName = getInterfaceName($ref);
    addImportToFileIfNotExists(file, interfaceName);
    return interfaceName;
  }
  if (openApiType === 'integer' || openApiType === 'number') return "number";
  if (openApiType === 'string' && openApiFormat === "date-time") return "Date";
  return openApiType;
}

function getInterfaceName($ref) {
  // get the last part of the $ref after the last / i.e., #/components/schemas/ModelName => ModelName
  let interfaceName = $ref.split('/').pop().replaceAll("`", "");
  return normalizePascalCase(interfaceName);
}

// fix consecutive uppercase
function normalizePascalCase(str) {
  return str.replace(/([A-Z])([A-Z]+)([A-Z][a-z])/g, (match, p1, p2, p3) => { return p1 + p2[0].toLowerCase() + p3; });
}

function addImportToFileIfNotExists(file, interfaceName) {
  if (!importExists(file, interfaceName))
    file.addImportDeclarations([
      {namedImports: [interfaceName], moduleSpecifier: '@contracts'}
    ]);
}

function importExists(file, interfaceName) {
  return file.getImportDeclaration(importDeclaration => importDeclaration.getModuleSpecifierValue() === "@contracts" && importDeclaration.getNamedImports().some(namedImport => namedImport.getName() === interfaceName));
}


function pascalCaseToKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // insert - between lower/number and upper
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // handle consecutive capitals
    .toLowerCase();
}


await project.save();
console.log('All services generated successfully!');

