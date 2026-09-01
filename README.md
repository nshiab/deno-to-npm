# deno-to-npm

A simple script to transform a Deno library into an npm package. Package
descriptions, keywords, licenses, and repositories are copied from `deno.json`.
The generated package also includes `README.md`, `LICENSE`, and optional
agent-readable `llm.md` and `llms.txt` files when present.

## Maintenance

The library is maintained by [Nael Shiab](http://naelshiab.com/), computational
journalist and senior data producer for [CBC News](https://www.cbc.ca/news).
