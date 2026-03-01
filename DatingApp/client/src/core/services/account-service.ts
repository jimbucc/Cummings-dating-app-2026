import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { LoginCreds, RegisterCreds, User } from '../../types/user';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LikesService } from './likes-service';
import { PresenceService } from './presence-service';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private likesService = inject(LikesService);
  private presenceService = inject(PresenceService);
  currentUser = signal<User | null>(null);
  private baseUrl = environment.apiUrl;

  register(creds: RegisterCreds) {
    return this.http
      .post<User>(this.baseUrl + 'account/register', creds, { withCredentials: true })
      .pipe(
        tap((user) => {
          if (user) {
            this.setCurrentUser(user);
            this.startTokenRefreshInterval();
          }
        }),
      );
  }

  login(creds: LoginCreds) {
    return this.http
      .post<User>(this.baseUrl + 'account/login', creds, { withCredentials: true })
      .pipe(
        tap((user) => {
          if (user) {
            this.setCurrentUser(user);
            this.startTokenRefreshInterval();
          }
        }),
      );
  }

  refreshToken() {
    return this.http.post<User>(
      this.baseUrl + 'account/refresh-token',
      {},
      { withCredentials: true },
    );
  }

  startTokenRefreshInterval() {
    setInterval(() => {
      this.http.post<User>(this.baseUrl + 'account/refresh-token', {}, 
        { withCredentials: true }).subscribe({
          next: user => {
            this.setCurrentUser(user)
          },
          error: () => {
            console.log('Error setting refresh token')
            this.logout();
          }
        })
    }, 5 * 60 * 1000)
  }

  setCurrentUser(user: User) {
    user.roles = this.getRolesFromToken(user);
    this.currentUser.set(user);
    this.likesService.getLikeIds();
    if (this.presenceService.hubConnection?.state !== HubConnectionState.Connected) {
      this.presenceService.createHubConnection(user);
    }
  }

  logout() {
    localStorage.removeItem('filters');
    this.likesService.clearLikeIds();
    if (this.presenceService.hubConnection?.state === HubConnectionState.Connected) {
      this.presenceService.stopHubConnection();
    }
    this.currentUser.set(null);
  }

  private getRolesFromToken(user: User): string[] {
    const payload = user.token.split('.')[1];
    const decoded = atob(payload);
    const jsonPayload = JSON.parse(decoded);
    return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
  }
}

// import { HttpClient } from '@angular/common/http';
// import { inject, Injectable, signal } from '@angular/core';
// import { LoginCreds, RegisterCreds, User } from '../../types/user';
// import { tap } from 'rxjs';
// import { environment } from '../../environments/environment';
// import { LikesService } from './likes-service';

// @Injectable({
//   providedIn: 'root',
// })
// export class AccountService {
//   private http = inject(HttpClient);
//   private likesService = inject(LikesService);
//   currentUser = signal<User | null>(null);
//   private baseUrl = environment.apiUrl;

//   register(creds: RegisterCreds) {
//     return this.http
//       .post<User>(this.baseUrl + 'account/register', creds, { withCredentials: true })
//       .pipe(
//         tap((user) => {
//           if (user) {
//             this.setCurrentUser(user);
//             this.startTokenRefreshInterval();
//           }
//         }),
//       );
//   }

//   login(creds: LoginCreds) {
//     return this.http
//       .post<User>(this.baseUrl + 'account/login', creds, { withCredentials: true })
//       .pipe(
//         tap((user) => {
//           if (user) {
//             this.setCurrentUser(user);
//             this.startTokenRefreshInterval();
//           }
//         }),
//       );
//   }

//   refreshToken() {
//     return this.http.post<User>(
//       this.baseUrl + 'account/refresh-token',
//       {},
//       { withCredentials: true },
//     );
//   }

//   // startTokenRefreshInterval() {
//   //   setInterval(() => {
//   //     this.http
//   //       .post<User>(this.baseUrl + 'account/refresh-token', {}, { withCredentials: true })
//   //       .subscribe({
//   //         next: user => {
//   //           this.setCurrentUser(user);
//   //           console.log("Generating new refresh token...")
//   //         },
//   //         error: () => {
//   //           this.logout();
//   //         },
//   //       });
//   //   }, 1 * 10 * 1000);
//   // }

//   startTokenRefreshInterval() {
//     setInterval(
//       () => {
//         this.http
//           .post<User>(this.baseUrl + 'account/refresh-token', {}, { withCredentials: true })
//           .subscribe({
//             next: (user) => {
//               this.setCurrentUser(user);
//             },
//             error: () => {
//               this.logout();
//             },
//           });
//       },
//       1 * 10 * 1000,
//     );
//   }

//   setCurrentUser(user: User) {
//     user.roles = this.getRolesFromToken(user);
//     this.currentUser.set(user);
//     this.likesService.getLikeIds();
//   }

//   logout() {
//     localStorage.removeItem('filters');
//     this.currentUser.set(null);
//     this.likesService.clearLikeIds();
//   }

//   private getRolesFromToken(user: User): string[] {
//     console.log('GetRolesFromToken() - user token: ', user.token);
//     const payload = user.token.split('.')[1]; // 2nd part of token is payload
//     console.log('GetRolesFromToken() - payload is:', payload);
//     const decoded = atob(payload);

//     const jsonPayload = JSON.parse(decoded);
//     console.log('GetRolesFromToken() - jsonPayload is:', jsonPayload);

//     return Array.isArray(jsonPayload.role) ? jsonPayload.role : [jsonPayload.role];
//   }
// }
