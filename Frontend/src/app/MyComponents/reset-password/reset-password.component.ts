import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  hidePassword = true;
  token: string = '';
  isButtonDisabled = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
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
    this.isButtonDisabled = true;

    if (this.resetForm.valid) {
      const newPassword = this.resetForm.value.password;
      const confirmPassword = this.resetForm.value.repassword;

      if (newPassword !== confirmPassword) {
        this.openSnackBar('Passwords do not match', 'warning-message');
        this.isButtonDisabled = false;
        return;
      }

      if (!this.token) {
        this.handleTokenNotFound();
        return;
      }

      const requestPayload = {
        token: this.token,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };

      this.http.post('http://localhost:3000/reset-password', requestPayload)
        .subscribe(
          (response: any) => {
            this.handleResetPasswordResponse(response);
          },
          (error: HttpErrorResponse) => {
            this.handleResetPasswordError(error);
          }
        );
    }
  }

  handleResetPasswordResponse(response: any): void {
    const { message } = response;

    this.openSnackBar(message, 'success-message');

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 5000);
  }

  handleResetPasswordError(error: HttpErrorResponse): void {
    if (error.status === 400) {
      this.openSnackBar(error.error.message, 'warning-message');
    } else if (error.status === 401) {
      this.openSnackBar(error.error.message, 'error-message');
    } else if (error.status === 403) {
      this.openSnackBar(error.error.message, 'warning-message');
    } else if (error.status === 404) {
      this.openSnackBar(error.error.message, 'error-message');
    } else {
      this.openSnackBar('An error occurred. Please try again.', 'warning-message');
    }

    this.isButtonDisabled = false;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  openSnackBar(message: string, messageType: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: messageType
    });
  }
  handleTokenNotFound(): void {
    this.openSnackBar('Token not found', 'warning-message');
    this.isButtonDisabled = false;
  }
}
