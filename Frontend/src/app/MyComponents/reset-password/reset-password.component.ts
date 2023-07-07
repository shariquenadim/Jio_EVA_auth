import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  hidePassword = true;
  token: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]],
      repassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const newPassword = this.resetForm.value.password;
      const confirmPassword = this.resetForm.value.repassword;
  
      // Check if the new password and confirm password match
      if (newPassword !== confirmPassword) {
        this.openSnackBar('Passwords do not match', 4000, 'warning-message');
        return;
      }
  
      // Check if the token is empty or not found
      if (!this.token) {
        this.openSnackBar('Token not found. Please try again.', 4000, 'warning-message');
        return;
      }
  
      // Make the API call to the reset password endpoint with the token
      this.http.post<any>('http://localhost:3000/reset-password', { token: this.token, newPassword, confirmPassword }).subscribe(
        response => {
          this.handleResetPasswordResponse(response);
        },
        error => {
          this.handleResetPasswordError(error);
        }
      );
    }
  }
  
  handleResetPasswordResponse(response: any): void {
    const { message } = response;
    const statusCode = response.status;
  
    if (statusCode === 200) {
      this.openSnackBar(message, 5000, 'success-message'); // Password reset successful
    } else if (statusCode === 400) {
      this.openSnackBar(message, 4000, 'warning-message'); // New password cannot be the same as the old password
    } else if (statusCode === 401) {
      this.openSnackBar(message, 4000, 'error-message'); // Token has expired
    } else if (statusCode === 403) {
      this.openSnackBar(message, 4000, 'warning-message'); // Passwords do not match
    } else if (statusCode === 404) {
      this.openSnackBar(message, 4000, 'error-message'); // User not found
    } else {
      this.openSnackBar('An error occurred. Please try again.', 4000, 'warning-message');
    }
  }
  
  handleResetPasswordError(error: any): void {
    console.error(error);
    if (error.status === 401) {
      this.openSnackBar('Token has expired', 4000,'error-message');
    } else {
      this.openSnackBar('An error occurred. Please try again.', 4000, 'warning-message');
    }
  }
  

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  openSnackBar(message: string, duration: number, messageType: string): void {
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: messageType
    });
  }
}
