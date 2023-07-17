import { ComponentFixture, TestBed, tick, fakeAsync, flush } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { ForgetPasswordComponent } from './forget-password.component';
import { Router } from '@angular/router';

describe('ForgetPasswordComponent', () => {
  let component: ForgetPasswordComponent;
  let fixture: ComponentFixture<ForgetPasswordComponent>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      declarations: [ForgetPasswordComponent],
      imports: [
        ReactiveFormsModule,
        HttpClientModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
      ],
      providers: [
        FormBuilder,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForgetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate email', () => {
    const emailFormControl = component.forgetpasswordForm.get('email');
    if (emailFormControl) {
      emailFormControl.setValue('test@example.com');
      component.validateEmail();
      expect(emailFormControl.errors).toBeNull();

      emailFormControl.setValue('invalid-email');
      component.validateEmail();
      expect(emailFormControl.errors).toEqual({ invalidEmail: true });
    }
  });

  it('should send password reset email successfully', fakeAsync(() => {
    const email = 'test@example.com';
    const response = { message: 'Password reset email sent successfully' };
  
    httpClientSpy.post.and.returnValue(of(response));
  
    component.forgetpasswordForm.setValue({ email });
  
    component.onSubmit();
  
    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/forget-password', { email });
    expect(snackBarSpy.open).toHaveBeenCalledWith('A reset password link is sent to your registered email.', 'Close', { duration: 4000 });
    expect(component.isButtonDisabled).toBeTrue();
  }));
  
  it('should handle error response', fakeAsync(() => {
    const email = 'test@example.com';
    const response = { message: 'An error occurred' };
  
    httpClientSpy.post.and.returnValue(of(response));
  
    component.forgetpasswordForm.setValue({ email });
  
    component.onSubmit();
  
    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/forget-password', { email });
    expect(snackBarSpy.open).toHaveBeenCalledWith('An error occurred. Please try again.', 'Close', { duration: 4000 });
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    expect(component.isButtonDisabled).toBeFalse();
  }));

  it('should handle user not found', fakeAsync(() => {
    const email = 'test@example.com';
    const response = { message: 'User not found' };

    httpClientSpy.post.and.returnValue(of(response));

    component.forgetpasswordForm.setValue({ email });

    component.onSubmit();
    tick();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/forget-password', { email });
    expect(snackBarSpy.open).toHaveBeenCalledWith('User not found. Please register first.', 'Close', { duration: 4000 });
    expect(component.isButtonDisabled).toBeFalse();
  }));

  it('should handle error during password reset email request', fakeAsync(() => {
    const email = 'test@example.com';

    httpClientSpy.post.and.returnValue(throwError({ status: 500 }));

    component.forgetpasswordForm.setValue({ email });

    component.onSubmit();
    tick();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/forget-password', { email });
    expect(snackBarSpy.open).toHaveBeenCalledWith('An error occurred. Please try again.', 'Close', { duration: 4000 });
    expect(component.isButtonDisabled).toBeFalse();
  }));

  it('should handle invalid form submission', () => {
    component.onSubmit();
    expect(httpClientSpy.post).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(component.isButtonDisabled).toBeTrue();
  });

  it('should handle error status 401', fakeAsync(() => {
    const email = 'test@example.com';

    httpClientSpy.post.and.returnValue(throwError({ status: 401 }));

    component.forgetpasswordForm.setValue({ email });

    component.onSubmit();
    tick();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/forget-password', { email });
    expect(snackBarSpy.open).toHaveBeenCalledWith('User not found. Please register first.', 'Close', { duration: 4000 });
    expect(component.isButtonDisabled).toBeFalse();
  }));

  it('should handle error status other than 401', fakeAsync(() => {
    const email = 'test@example.com';

    httpClientSpy.post.and.returnValue(throwError({ status: 500 }));

    component.forgetpasswordForm.setValue({ email });

    component.onSubmit();
    tick();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/forget-password', { email });
    expect(snackBarSpy.open).toHaveBeenCalledWith('An error occurred. Please try again.', 'Close', { duration: 4000 });
    expect(component.isButtonDisabled).toBeFalse();
  }));

  it('should open a snackbar with the given message and duration', () => {
    const message = 'Test Message';
    const duration = 2000;

    component.openSnackBar(message, duration);

    expect(snackBarSpy.open).toHaveBeenCalledWith(message, 'Close', { duration });
  });
});
