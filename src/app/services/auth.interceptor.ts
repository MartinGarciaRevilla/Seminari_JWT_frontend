import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { switchMap } from 'rxjs/operators';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  console.log("Dentro del interceptor");

  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);

  // Si hay un token, agrega el encabezado Authorization
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Si el error es 401, intenta renovar el token
      if (error.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          return authService.refreshToken().pipe(
            switchMap((response: any) => {
              const newAccessToken = response.accessToken;

              // Guarda el nuevo token en localStorage
              localStorage.setItem('access_token', newAccessToken);

              // Reintenta la solicitud original con el nuevo token
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken}`
                }
              });
              return next(retryRequest);
            }),
            catchError((refreshError) => {
              // Si el refresh falla, cierra sesión
              console.error('Error al renovar el token:', refreshError);
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              toastr.error(
                'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
                'Sesión Expirada',
                {
                  timeOut: 3000,
                  closeButton: true
                }
              );
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // Si no hay refresh token, cierra sesión
          console.warn('No se encontró el refresh token. Cerrando sesión.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          toastr.error(
            'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
            'Sesión Expirada',
            {
              timeOut: 3000,
              closeButton: true
            }
          );
          router.navigate(['/login']);
        }
      }

      // Si no es un error 401, propaga el error
      return throwError(() => error);
    })
  );
}