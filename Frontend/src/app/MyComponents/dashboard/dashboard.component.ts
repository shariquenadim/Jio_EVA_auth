import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface User {
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | undefined;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.getUser();
  }

  getUser() {
    this.http.get<User>('http://localhost:3000/me', { withCredentials: true })
      .subscribe(
        (response: User) => {
          this.user = response;
        },
        (error) => {
          console.error('Error retrieving user:', error);
          // Redirect to login if user is not logged in
          this.router.navigate(['/login']);
        }
      );
  }

  logout() {
    this.http.post('http://localhost:3000/logout', {}, { withCredentials: true })
      .subscribe(
        () => {
          // After successful logout, remove the token from localStorage and clear cookies
          localStorage.clear();
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // Navigate to the login page
          this.router.navigate(['/login']);
        },
        (error) => {
          console.error('Error during logout:', error);
        }
      );
  }
}
