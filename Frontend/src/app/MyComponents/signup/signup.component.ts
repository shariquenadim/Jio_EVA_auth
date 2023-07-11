import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})

export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  response: any;
  hidePassword: boolean = true;
  isButtonDisabled = false;


  constructor(private formBuilder: FormBuilder, private http: HttpClient) { }

  ngOnInit() {
    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/)]],
      repassword: ['', [Validators.required, this.passwordMatchValidator]]
    });
  }
  
  validatePhoneNumber(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    const input = event.target.value + String.fromCharCode(charCode);
    
    if (input.length === 1 && (charCode < 54 || charCode > 57)) {
      event.preventDefault();
    }
    
    if (input.length > 1 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
  validateEmail() {
    const emailFormControl = this.signupForm.get('email');
    if (emailFormControl && emailFormControl.value) {
      const pattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
      const isValid = pattern.test(emailFormControl.value);
      emailFormControl.setErrors(isValid ? null : { invalidEmail: true });
    }
  }

  onSubmit() {
    console.log('Submitting signup form');
    this.isButtonDisabled = true;

    if (this.signupForm.valid) {
      console.log('Form is valid');

      const name = this.signupForm.value.name;
      const phone = this.signupForm.value.phoneNumber;
      const email = this.signupForm.value.email;
      const password = this.signupForm.value.password;
      const repassword = this.signupForm.value.repassword;

      const credentials = {
        name: name,
        phone: phone,
        email: email,
        password: password,
        confirmPassword: repassword
      };

      console.log('Sending signup request');

      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

      const httpOptions = {
        headers: headers,
        withCredentials: true
      };

      // Send the form data to the backend using HttpClient
      this.http.post<any>('http://localhost:3000/signup', credentials, httpOptions)
        .pipe(
          catchError((error: HttpErrorResponse) => this.handleError(error))
        )
        .subscribe(
          (response: any) => {
            // Handle the success response from the backend
            // console.log('Signup success:', response);
            // console.log('Response:', response);
            // Access the status code
            // console.log('Status code:', response.status);
            this.response = response;

            // Reset the form if status code is 201
            if (response && response === 'User created successfully') {
              // console.log("Inside if block")
              this.signupForm.reset();
              this.response = response.message;
            }
            this.isButtonDisabled = false;
          },
          (error: HttpErrorResponse) => {
            // Handle the error response from the backend
            console.error('Signup error:', error);
            console.log('Status code:', error.status);

            // Assign error response to display appropriate messages
            if (error.status === 400) {
              this.response = { status: error.status, message: 'User already exists. Please sign in instead.' };
            } else {
              this.response = { status: error.status, message: 'An error occurred during signup. Please try again later.' };
            }
            this.isButtonDisabled = false;
          }
        );
    } else {
      console.log('Form is invalid');
    }
  }


  passwordMatchValidator(control: FormControl) {
    const password = control.root.get('password');
    const repassword = control.value;

    if (password && repassword && password.value !== repassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      console.log('Server error response:', error.error);
      console.dir(error) // Log the server error response for debugging
    }
    console.error(errorMessage, error);
    return throwError(errorMessage);
  }
}
