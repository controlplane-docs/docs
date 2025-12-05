# Control Plane Corporation Documentation

This repository contains the documentation for [Control Plane Corporation](https://controlplane.com).

## 👩‍💻 Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

    npm i -g mintlify

Run the following command at the root of your documentation (where mint.json is)

    mintlify dev

    mintlify broken-links

## 🔄 Syncing API Reference from OpenAPI Specs

To sync the API reference pages with the latest OpenAPI specifications, run:

```bash
npx @mintlify/scraping@latest openapi-file https://api.cpln.io/openapi.json -o api-reference
npx @mintlify/scraping@latest openapi-file https://audit.cpln.io/openapi.json -o api-reference/audit
```
