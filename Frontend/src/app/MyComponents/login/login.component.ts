import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  otpForm!: FormGroup;
  showOTP: boolean = false;
  remainingTime: number = 120;
  displayTime: string = '';
  emailNotVerified: boolean = false;
  errorMessage: string = '';
  timer: any;
  isRedText: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    if (token) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });

    this.otpForm = this.formBuilder.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]]
    });
  }

  onRememberMeChange(event: any) {
    const rememberMe = event.checked;
    this.loginForm.get('rememberMe')?.setValue(rememberMe);
  }

  onSubmit() {
    console.log("Form clicked");
    if (this.loginForm.valid && !this.showOTP) {
      const email = this.loginForm.value.email;
      const password = this.loginForm.value.password;
      const rememberMe = this.loginForm.value.rememberMe;

      const credentials = {
        email: email,
        password: password,
        rememberMe: rememberMe
      };

      console.log("Valid form submitted");

      this.http.post('http://localhost:3000/login', credentials, { withCredentials: true })
        .pipe(
          catchError(error => {
            console.error('Login failed');
            console.error(error);
            if (error.status === 400) {
              const errorMessage = error.error;
              if (errorMessage === 'User not found.') {
                this.errorMessage = 'User not found.';
              } else if (errorMessage === 'Email address not verified') {
                this.emailNotVerified = true;
              } else if (errorMessage === 'Invalid email or password') {
                this.errorMessage = 'Invalid email or password';
              }
            }

            throw error;
          })
        )
        .subscribe((response: any) => {
          if (response.message === 'An otp has been sent to your email') {
            this.showOTP = true;
            this.startTimer(); 
            console.log("OTP sent to email");
          } else if (response.token) {
            console.log("Login successful");
          }
        });
    }
  }

  onOtpSubmit() {
    if (this.otpForm.valid) {
      let otp = this.otpForm.value.otp;
      otp = otp.toString();
      console.log("OTP submitted:", otp);

      const otpCredentials = {
        otp: otp
      };

      this.http.post('http://localhost:3000/otp', otpCredentials, { withCredentials: true })
        .pipe(
          catchError(error => {
            console.error('OTP verification failed');
            console.error(error);
            this.errorMessage = 'OTP verification failed';
            throw error;
          })
        )
        .subscribe((response: any) => {
          console.log('OTP verification successful');
          console.log(response);
          if (response.token) {
            console.log("OTP verification successful. Login complete.");
            console.log('Received token:', response.token);
            localStorage.setItem('token', response.token);
            console.log('Token stored in localStorage');
            this.router.navigate(['/dashboard']);
          }
        });

      this.otpForm.reset();
      this.showOTP = false;
      clearInterval(this.timer); // Clear the timer when OTP is submitted
    }
  }

  startTimer() {
    this.remainingTime = 120; // Reset the remaining time to 120 seconds
    this.updateDisplayTime(); // Update the initial display time
    this.timer = setInterval(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
        this.updateDisplayTime();
        this.checkRedText(); // Check if the timer text should be red
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  updateDisplayTime() {
    const minutes = Math.floor(this.remainingTime / 60);
    const seconds = this.remainingTime % 60;
    this.displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.checkRedText(); // Check if the timer text should be red
  }

  checkRedText() {
    this.isRedText = this.remainingTime <= 10;
  }
}
