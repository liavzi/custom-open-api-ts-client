import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'src/app/contracts/Backend_internal-api.json',
  output: 'src/app/contracts/generated-client',
  plugins: [{
    name: "@hey-api/typescript",
    enums: "typescript"
  },{
    dates: true,
    name: '@hey-api/transformers',
  }
  ]
});
