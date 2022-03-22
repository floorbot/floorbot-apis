# [UrbanDictionary](https://www.urbandictionary.com/) API

An Urban Dictionary API module with redis response caching

## Installation

```bash
npm install github:floorbot/floorbot-apis#urban-dictionary
```

## Example

```js
import { UrbanDictionaryAPI } from 'urban-dictionary';
import Redis from 'redis';

const redis = new Redis({ /** options */ });
const api = new UrbanDictionaryAPI({ redis });

console.log(await api.random());                         // Get the definitions of a random word
console.log(await api.define('word'));                   // Get the definitions of a specified word
console.log(await api.autocomplete('wo'));               // Get autocomplete suggestions
```
