import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environments';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppserviceService {

  constructor(private httpClient: HttpClient) { }

  checkToken() {
    return this.httpClient.get(`${environment.backend_url}authtoken`);
  }

  searchContent(data: any) {
    return this.httpClient.post(`${environment.backend_url}search`, data)
  }

  getEnv() {
    return this.httpClient.get(`${environment.backend_url}getenv`)
  }
}
