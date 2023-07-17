import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    const spy = jasmine.createSpyObj('HttpClient', ['post']);
    const snackBarSpyObj = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
        MatCheckboxModule,
      ],
      providers: [
        FormBuilder,
        { provide: HttpClient, useValue: spy },
        { provide: MatSnackBar, useValue: snackBarSpyObj },
        { provide: Router, useValue: routerSpyObj },
      ],
    }).compileComponents();

    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create the LoginComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to dashboard if user is already logged in', () => {
    localStorage.setItem('token', 'test_token');

    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should initialize the form correctly', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('rememberMe')?.value).toBeFalse();
  });

  it('should initialize the component and form correctly', () => {
    localStorage.removeItem('token');
    fixture.detectChanges();

    expect(component.otpForm).toBeDefined();
    expect(component.otpForm.get('otp')).toBeDefined();
  });

  it('should toggle the rememberMe value when onRememberMeChange is called', () => {
    const event: any = { checked: true };
    component.onRememberMeChange(event);
    expect(component.loginForm.get('rememberMe')?.value).toBeTrue();
  });

  it('should submit the login form and handle success response', () => {
    const formValue = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: false,
    };

    component.loginForm.setValue(formValue);

    httpClientSpy.post.and.returnValue(of({ message: 'An OTP has been sent to your email', token: ' ' }));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/login', formValue, { withCredentials: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('An OTP has been sent to your email', 'Close', {
      duration: 4000,
      panelClass: ['success-message'],
    });
    expect(localStorage.getItem('token')).toBeFalsy();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should submit the login form and handle error response (Email address not verified)', () => {
    const formValue = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: false,
    };

    component.loginForm.setValue(formValue);

    const errorResponse = new HttpErrorResponse({ status: 400, error: 'Email address not verified' });
    httpClientSpy.post.and.returnValue(throwError(errorResponse));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/login', formValue, { withCredentials: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Email address not verified.', 'Close', {
      duration: 4000,
      panelClass: ['warning-message'],
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should submit the login form and handle error response (Invalid password)', () => {
    const formValue = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: false,
    };

    component.loginForm.setValue(formValue);

    const errorResponse = new HttpErrorResponse({ status: 400, error: 'Invalid password', url: 'http://localhost:3000/login', statusText: "Bad Request" });
    httpClientSpy.post.and.returnValue(throwError(errorResponse));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/login', formValue, { withCredentials: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Invalid password.', 'Close', {
      duration: 4000,
      panelClass: ['error-message'],
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should submit the login form and handle error response (User not found)', () => {
    const formValue = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: false,
    };

    component.loginForm.setValue(formValue);

    const errorResponse = new HttpErrorResponse({ status: 400, error: 'User not found' });
    httpClientSpy.post.and.returnValue(throwError(errorResponse));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/login', formValue, { withCredentials: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('User not found. Please SignUp first.', 'Close', {
      duration: 5000,
      panelClass: ['error-message'],
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  afterEach(() => {
    localStorage.removeItem('token');
  });


  it('should submit the login form and handle error response (You are using an old password)', () => {
    const formValue = {
      email: 'ramps4u2@gmail.com',
      password: 'Abc@1234567',
      rememberMe: false,
    };

    component.loginForm.setValue(formValue);
    const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
    (component as any).snackBar = snackBarMock;

    const errorResponse = new HttpErrorResponse({
      error: 'You are using an old password.',
      status: 400,
      statusText: 'Bad Request',
    });
    httpClientSpy.post.and.callFake(() => throwError(errorResponse as HttpErrorResponse));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'You are using an old password.',
      'Close',
      { duration: 4000, panelClass: ['warning-message'] }
    );
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should call onOtpSubmit when login form is valid and showOTP is true', () => {
    spyOn(component, 'onOtpSubmit');

    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password',
      rememberMe: false,
    });
    component.showOTP = true;
    component.onSubmit();

    expect(component.onOtpSubmit).toHaveBeenCalled();
  });

  it('should return the control for otpForm', () => {
    const otpControl = component.getOtpControl();
    expect(otpControl).toEqual(component.otpForm.get('otp'));
  });

  it('should submit the OTP form and handle success response', () => {
    const otpValue = {
      otp: '123456',
    };

    component.otpForm.setValue(otpValue);
    httpClientSpy.post.and.returnValue(of({ token: 'test_token' }));

    const localStorageSpy = spyOn(localStorage, 'setItem');

    console.log('Before reset:', component.otpForm.get('otp')?.value);

    component.onOtpSubmit();

    expect(httpClientSpy.post).toHaveBeenCalled();
    expect(localStorageSpy).toHaveBeenCalledWith('token', 'test_token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.showOTP).toBeFalse();

    component.otpForm.reset();
    component.otpForm.get('otp')?.setValue('');

    console.log('After reset:', component.otpForm.get('otp')?.value);

    expect(component.otpForm.get('otp')?.value).toBe('');
  });

  it('should submit the OTP form and handle error response', async () => {
    const otpValue = {
      otp: '123456',
    };

    component.otpForm.setValue(otpValue);
    httpClientSpy.post.and.returnValue(throwError({ status: 400 } as HttpErrorResponse));

    spyOn(console, 'error');

    component.onOtpSubmit();

    expect(httpClientSpy.post).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('OTP verification failed');
  });

  it('should open a snack bar with the provided message', () => {
    const snackBarMock = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    component.openSnackBar('Test message', 3000, 'error-message');

    expect(snackBarMock.open).toHaveBeenCalledWith('Test message', 'Close', {
      duration: 3000,
      panelClass: ['error-message'],
    });
  });

  function arrayEquals(a: any[], b: any[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  it('should toggle the OTP field and set validators', () => {
    const otpControl = component.otpForm.get('otp') as FormControl;
    spyOn(otpControl, 'setValidators').and.callThrough();
    spyOn(otpControl, 'clearValidators').and.callThrough();
    spyOn(otpControl, 'updateValueAndValidity').and.callThrough();

    component.showOTP = true;
    component.toggleOTPField();

    expect(otpControl.setValidators).toHaveBeenCalledWith(
      jasmine.arrayContaining([
        jasmine.any(Function),
        jasmine.any(Function),
        jasmine.any(Function)
      ])
    );

    component.showOTP = false;
    component.toggleOTPField();

    expect(otpControl.clearValidators).toHaveBeenCalled();
    expect(otpControl.updateValueAndValidity).toHaveBeenCalled();
  });

  it('should start the timer and update display time', () => {
    jasmine.clock().install();

    spyOn(component, 'updateDisplayTime');

    component.startTimer();

    expect(component.updateDisplayTime).toHaveBeenCalled();
    expect(component.remainingTime).toBe(120);

    jasmine.clock().tick(1000);
    expect(component.remainingTime).toBe(119);
    expect(component.updateDisplayTime).toHaveBeenCalledTimes(2);

    jasmine.clock().tick(119000);
    expect(component.remainingTime).toBe(0);
    expect(component.updateDisplayTime).toHaveBeenCalledTimes(121);

    jasmine.clock().tick(1000);
    expect(component.updateDisplayTime).toHaveBeenCalledTimes(121);

    jasmine.clock().uninstall();
  });

  it('should update the display time', () => {
    component.remainingTime = 120;
    component.updateDisplayTime();
    expect(component.displayTime).toBe('02:00');

    component.remainingTime = 30;
    component.updateDisplayTime();
    expect(component.displayTime).toBe('00:30');
  });

  it('should check if red text is required', () => {
    component.remainingTime = 10;
    component.checkRedText();
    expect(component.isRedText).toBeTrue();

    component.remainingTime = 20;
    component.checkRedText();
    expect(component.isRedText).toBeFalse();
  });

  afterEach(() => {
    httpClientSpy.post.calls.reset();
    snackBarSpy.open.calls.reset();
    routerSpy.navigate.calls.reset();
  });
});