import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css']
})
export class ForgetPasswordComponent implements OnInit {
  forgetpasswordForm!: FormGroup;
  isButtonDisabled = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.forgetpasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$')]]
    });
  }

  validateEmail() {
    const emailFormControl = this.forgetpasswordForm.get('email');
    if (emailFormControl && emailFormControl.value) {
      const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
      const isValid = pattern.test(emailFormControl.value);
      emailFormControl.setErrors(isValid ? null : { invalidEmail: true });
    }
  }

  onSubmit() {
    this.isButtonDisabled = true;
    if (this.forgetpasswordForm.valid) {
      const email = this.forgetpasswordForm.value.email;

      this.http.post<any>('http://localhost:3000/forget-password', { email }).subscribe(
        response => {
          console.log("response:", response);

          if (response?.message === 'User not found') {
            this.openSnackBar('User not found. Please register first.', 4000);
            this.isButtonDisabled = false;
          } else if (response?.message === 'Password reset email sent successfully') {
            this.openSnackBar('A reset password link is sent to your registered email.', 4000);
            setTimeout(() => {
              window.location.href = '/login';
            }, 5000);
            this.isButtonDisabled = true; 
          } else {
            this.openSnackBar('An error occurred. Please try again.', 4000);
            this.isButtonDisabled = false;
          }
        },
        error => {
          console.error(error);
          if (error.status === 401) {
            this.openSnackBar('User not found. Please register first.', 4000);
            this.isButtonDisabled = false;
          } else {
            this.openSnackBar('An error occurred. Please try again.', 4000);
            this.isButtonDisabled = false;
          }
        }
      );
    }
  }

  openSnackBar(message: string, duration: number) {
    this.snackBar.open(message, 'Close', { duration });
  }
}
