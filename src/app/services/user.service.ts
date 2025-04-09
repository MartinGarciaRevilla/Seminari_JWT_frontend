import { Injectable, inject, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../models/user.model';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  constructor(private http: HttpClient) { }

  private apiUrl = "http://localhost:9000/api/users";

  getUsers(): Observable<User[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No se encontró el token de acceso.');
      return of([]); // Devuelve un array vacío si no hay token
    }
  
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  
    return this.http.get<User[]>(this.apiUrl, { headers: httpHeaders }).pipe(
      catchError(this.handleError<User[]>('getUsers', [])) // Retorna un array vacío si hay error
    );
  }
  
  getUser(id: number): Observable<User> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No se encontró el token de acceso.');
      return of({} as User); // Devuelve un objeto vacío si no hay token
    }
  
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  
    return this.http.get<User>(`${this.apiUrl}/${id}`, { headers: httpHeaders }).pipe(
      catchError(this.handleError<User>('getUser')) // Retorna un observable vacío en caso de error
    );
  }
  // Método genérico para manejar errores
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T); // Devuelve un valor predeterminado o vacío
    };
  }
}
