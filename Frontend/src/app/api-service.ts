import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = '';

  constructor(private http: HttpClient) {
  }

  get(endpoint: string, params?: RequestParam): Observable<any> {
    return this.http.get(this.buildFullUrl(endpoint));
  }

  post(endpoint: string, body: any, params?: RequestParam): Observable<any> {
    return this.http.post(this.buildFullUrl(endpoint), body);
  }

  put(endpoint: string, body: any, params?: RequestParam): Observable<any> {
    return this.http.put(this.buildFullUrl(endpoint), body);
  }

  delete(endpoint: string, params?: RequestParam): Observable<any> {
    return this.http.delete(this.buildFullUrl(endpoint));
  }

  private buildFullUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  handleInternalApiCall(args: InternalApiCallArgs) {
    const url = this.buildInternalApiUrl(args);
    return this.makeApiCall(url, args);
  }

  private makeApiCall(url: string, args: InternalApiCallArgs) {
    if (args.httpVerb === 'post') {
      return this.post(url, args.requestBody, args.apiServiceRequestParams);
    }
    if (args.httpVerb === 'put') {
      return this.put(url, args.requestBody, args.apiServiceRequestParams);
    }
    if (args.httpVerb === 'delete') {
      return this.delete(url, args.apiServiceRequestParams);
    }
    if (args.httpVerb === 'get') {
      return this.get(url, args.apiServiceRequestParams);
    }
    throw new Error("Unsupported HTTP verb");
  }

  private buildInternalApiUrl(args: InternalApiCallArgs) {
    let url = this.interpolatePathParams(args.url, args.pathParams);
    url = this.addQueryParams(url, args.queryParams);
    // remove leading slash
    return url.slice(1);
  }

  private interpolatePathParams(url: string, pathParams: Record<string, any>) {
    if (!pathParams || Object.keys(pathParams).length === 0) {
      return url;
    }
    for (const pathParamName of Object.keys(pathParams)) {
      url = url.replace(`{${pathParamName}}`, this.getUrlParamValue(pathParams[pathParamName]));
    }
    return url;
  }

  private addQueryParams(url: string, queryParams: Record<string, any>) {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return url;
    }
    const searchParams = new URLSearchParams();
    for (const queryParamName of Object.keys(queryParams)) {
      searchParams.append(queryParamName, this.getUrlParamValue(queryParams[queryParamName]));
    }
    return `${url}?${searchParams.toString()}`;
  }

  private getUrlParamValue(urlParamValue: any) {
    if (urlParamValue instanceof Date) {
      return urlParamValue.toDateString();
    }
    return urlParamValue;
  }
}

export interface InternalApiCallArgs {
  url: string;
  pathParams: Record<string, any>;
  queryParams: Record<string, any>;
  requestBody?: any;
  httpVerb: 'get' | 'post' | 'put' | 'delete';
  apiServiceRequestParams?: RequestParam;
}

export class RequestParam {
  cache?: boolean;
}
