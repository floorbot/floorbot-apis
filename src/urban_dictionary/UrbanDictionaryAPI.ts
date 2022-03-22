import { UrbanDictionaryAPIAutocomplete } from './interfaces/UrbanDictionaryAPIAutocomplete.js';
import { UrbanDictionaryAPIData } from './interfaces/UrbanDictionaryAPIData.js';
import fetch, { Headers } from 'node-fetch';
import { Redis } from 'ioredis';

export { UrbanDictionaryAPIAutocomplete, UrbanDictionaryAPIData };

/** UrbanDictionaryAPI class options to use for caching */
export interface UrbanDictionaryAPIOptions {
    /** A redis connection to use for caching */
    redis: Redis;
    /** The time to live (milliseconds) for a cached response (default 1 hour) */
    ttl?: number;
    /** An optional id to use for this API instance */
    id?: string;
}

/** The UrbanDictionaryAPI class for making API calls */
export class UrbanDictionaryAPI {

    /** The redis connection to use for caching */
    public readonly redis: Redis;
    /** The time to live (milliseconds) for each cached response (default 1 hour) */
    public readonly ttl: number;
    /** The optional id to keep api instance caches separate */
    public readonly id: string;

    /**
     * Creates an UrbanDictionaryAPI instance with provided options
     * @param options The options to use for response caching
     */
    constructor(options: UrbanDictionaryAPIOptions) {
        this.redis = options.redis;
        this.ttl = options.ttl ?? 1000 * 60 * 60;
        this.id = options.id ?? '';
    }

    /**
     * Makes a raw API request for given details
     * @param endpoint The API endpoint to use
     * @param params The API params to use
     * @returns The raw API response
     */
    public async request(endpoint: string, params?: [string, string | number][]): Promise<any> {
        const paramString = (params || []).map((param) => `${param[0]}=${param[1]}`).join('&');
        const url = `http://api.urbandictionary.com/v0/${endpoint}?${paramString}`;
        const cached = await this.redis.get(url);
        if (cached) return JSON.parse(cached);
        const options = { method: 'GET', headers: new Headers() };
        const res = fetch(`${this.id}${url}`, options).then(res => res.json());
        await this.redis.set(`${this.id}${url}`, JSON.stringify(res), 'PX', this.ttl);
        return res;
    }

    /**
     * Fetch an array of random definitions
     * @returns An array or definitions
     */
    public async random(): Promise<UrbanDictionaryAPIData[]> {
        return this.request('random').then(res => res.list ?? []);
    }

    /**
     * Fetch an array or word definitions for specified term
     * @param term The term to get definitions for
     * @returns An array or definitions
     */
    public async define(term?: string | null): Promise<UrbanDictionaryAPIData[]> {
        if (!term) return this.random();
        const res = await this.request('define', [['term', term]]);
        return res.list ?? [];
    }

    /**
     * Fetch potential autocomplete suggestions for a (partial) term
     * @param term The (partial) term to get use
     * @returns An array of autocomplete suggestions
     */
    public async autocomplete(term: string): Promise<UrbanDictionaryAPIAutocomplete[]> {
        const res = await this.request('autocomplete-extra', [['term', term]]);
        return res.results ?? [];
    }
}
