import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ResetPasswordComponent } from './reset-password.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let httpClientSpy: { post: jasmine.Spy };
  let snackBarSpy: { open: jasmine.Spy };
  let routerSpy: { navigate: jasmine.Spy };
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ResetPasswordComponent],
      imports: [
        ReactiveFormsModule,
        HttpClientModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
        HttpClientTestingModule,
      ],
      providers: [
        FormBuilder,
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => 'example-token' } } } },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();
  });
  
  beforeEach(() => {
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty password fields', () => {
    expect(component.resetForm.get('password')?.value).toEqual('');
    expect(component.resetForm.get('repassword')?.value).toEqual('');
  });

  it('should retrieve the token from query parameters on initialization', () => {
    expect(component.token).toEqual('example-token');
  });

  it('should toggle the password visibility', () => {
    expect(component.hidePassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeTrue();
  });

  it('should open a snackbar with the given message and message type', () => {
    component.openSnackBar('Test message', 'test-type');
    expect(snackBarSpy.open).toHaveBeenCalledWith('Test message', 'Close', {
      duration: 4000,
      panelClass: 'test-type'
    });
  });

  it('should handle password reset error: same passwords', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 400,
      error: { message: 'Same password' }
    });
    component.handleResetPasswordError(errorResponse);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Same password', 'Close', {
      duration: 4000,
      panelClass: 'warning-message'
    });
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle password reset error: expired token', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 401,
      error: { message: 'Expired token' }
    });
    component.handleResetPasswordError(errorResponse);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Expired token', 'Close', {
      duration: 4000,
      panelClass: 'error-message'
    });
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle password reset error: passwords do not match', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 403,
      error: { message: 'Passwords do not match' }
    });
    component.handleResetPasswordError(errorResponse);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Passwords do not match', 'Close', {
      duration: 4000,
      panelClass: 'warning-message'
    });
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle password reset error: user not found', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 404,
      error: { message: 'User not found' }
    });
    component.handleResetPasswordError(errorResponse);
    expect(snackBarSpy.open).toHaveBeenCalledWith('User not found', 'Close', {
      duration: 4000,
      panelClass: 'error-message'
    });
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle generic password reset error', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 500,
      error: { message: 'Internal server error' }
    });
    component.handleResetPasswordError(errorResponse);
    expect(snackBarSpy.open).toHaveBeenCalledWith('An error occurred. Please try again.', 'Close', {
      duration: 4000,
      panelClass: 'warning-message'
    });
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle password reset success', fakeAsync(() => {
    const response = { message: 'Password reset successful' };
    component.handleResetPasswordResponse(response);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Password reset successful', 'Close', {
      duration: 4000,
      panelClass: 'success-message'
    });
    expect(component.isButtonDisabled).toBeFalse();
    
    tick(5000); // Simulate 5 seconds of time
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle form submission with invalid form: empty form', () => {
    component.onSubmit();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
    expect(component.isButtonDisabled).toBeTrue();
  });

  it('should handle form submission with invalid form: passwords do not match', () => {
    component.resetForm.patchValue({
      password: 'NewPassword@01',
      repassword: 'WrongPassword@01',
    });
  
    component.onSubmit();
  
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Passwords do not match',
      'Close',
      jasmine.objectContaining({
        duration: 4000,
        panelClass: 'warning-message'
      })
    );
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle form submission with valid form', fakeAsync(() => {
    component.token = 'example-token';
    component.resetForm.patchValue({
      password: 'NewPassword@01',
      repassword: 'NewPassword@01',
    });

    const response = { message: 'Password reset successful' };
    httpClientSpy.post.and.returnValue(of(response));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/reset-password', {
      token: 'example-token',
      newPassword: 'NewPassword@01',
      confirmPassword: 'NewPassword@01',
    });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Password reset successful',
      'Close',
      jasmine.objectContaining({
        duration: 4000,
        panelClass: 'success-message',
      })
    );
    expect(component.isButtonDisabled).toBeTrue();

    tick(5000); // Simulate 5 seconds of time

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle form submission with invalid form: token not found', () => {
    component.resetForm.patchValue({
      password: 'NewPassword@01',
      repassword: 'NewPassword@01',
    });
  
    component.token = ''; // Set token to an empty string
  
    component.onSubmit();
  
    // Expectations for handleTokenNotFound function
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Token not found',
      'Close',
      jasmine.objectContaining({
        duration: 4000,
        panelClass: 'warning-message'
      })
    );
    expect(component.isButtonDisabled).toBeFalse();
  });

  it('should handle form submission HTTP error', fakeAsync(() => {
    component.token = 'example-token';
    component.resetForm.patchValue({
      password: 'NewPassword@01',
      repassword: 'NewPassword@01',
    });
  
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      status: 500,
      error: { message: 'Internal server error' }
    });
  
    spyOn(component, 'handleResetPasswordError').and.callThrough();
    httpClientSpy.post.and.returnValue(throwError(errorResponse));
  
    component.onSubmit();
  
    expect(httpClientSpy.post).toHaveBeenCalledWith(
      'http://localhost:3000/reset-password',
      {
        token: 'example-token',
        newPassword: 'NewPassword@01',
        confirmPassword: 'NewPassword@01',
      }
    );
  
    expect(component.isButtonDisabled).toBeFalse();
  
    tick();
  
    expect(component.handleResetPasswordError).toHaveBeenCalledWith(errorResponse);
  }));
  afterEach(() => {
    httpTestingController.verify();
  });
});
