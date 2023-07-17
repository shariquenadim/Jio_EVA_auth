import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SignupComponent } from './signup.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let httpTestingController: HttpTestingController;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;

  beforeEach(
    waitForAsync(() => {
      const spy = jasmine.createSpyObj('HttpClient', ['post']);

      TestBed.configureTestingModule({
        declarations: [SignupComponent],
        imports: [
          ReactiveFormsModule,
          HttpClientTestingModule,
          MatFormFieldModule,
          MatInputModule,
          MatIconModule,
          BrowserAnimationsModule,
        ],
        providers: [FormBuilder, { provide: HttpClient, useValue: spy }],
      }).compileComponents();

      httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
      httpTestingController = TestBed.inject(HttpTestingController);
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the SignupComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form correctly', () => {
    expect(component.signupForm.get('name')?.value).toBe('');
    expect(component.signupForm.get('phoneNumber')?.value).toBe('');
    expect(component.signupForm.get('email')?.value).toBe('');
    expect(component.signupForm.get('password')?.value).toBe('');
    expect(component.signupForm.get('repassword')?.value).toBe('');
  });

  it('should enable the submit button when the form is valid', () => {
    const formValue = {
      name: 'Sharique Nadim',
      phoneNumber: '9876543210',
      email: 'abc@gmail.com',
      password: 'Abc@1234',
      repassword: 'Abc@1234'
    };
    component.signupForm.setValue(formValue);
    expect(component.signupForm.valid).toBeTrue();
  });

  it('should disable the submit button when the form is invalid', () => {
    const formValue = {
      name: '',
      phoneNumber: '9876543210',
      email: 'abc@gmail.com',
      password: 'Abc@1234',
      repassword: 'Abc@1234'
    };
    component.signupForm.setValue(formValue);
    component.onSubmit();
    console.log('Form Valid:', component.signupForm.valid);

    expect(component.signupForm.valid).toBeFalse();
  });

  describe('validatePhoneNumber', () => {
    it('should allow valid phone number input (with which code)', () => {
      const event: any = { target: { value: '123' }, which: 56, key: '8', keyCode: 56, preventDefault: jasmine.createSpy('preventDefault') };
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe('123');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  
    it('should prevent invalid phone number input (with which code)', () => {
      const event: any = { target: { value: '12A' }, which: 65, key: 'A', keyCode: 65, preventDefault: jasmine.createSpy('preventDefault') };
      const originalValue = event.target.value;
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe(originalValue);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  
    it('should allow valid phone number input (with key code)', () => {
      const event: any = { target: { value: '123' }, key: '8', keyCode: 56, preventDefault: jasmine.createSpy('preventDefault') };
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe('123');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  
    it('should prevent invalid phone number input (with key code)', () => {
      const event: any = { target: { value: '12A' }, key: 'A', keyCode: 65, preventDefault: jasmine.createSpy('preventDefault') };
      const originalValue = event.target.value;
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe(originalValue);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  
    it('should prevent invalid phone number input when input value is empty (with which code)', () => {
      const event: any = { target: { value: '' }, which: 49, key: '1', keyCode: 49, preventDefault: jasmine.createSpy('preventDefault') };
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });
  
    it('should prevent invalid phone number input when input value is empty (with key code)', () => {
      const event: any = { target: { value: '' }, key: '1', keyCode: 49, preventDefault: jasmine.createSpy('preventDefault') };
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });
  
    it('should prevent invalid phone number input when input value is empty and charCode > 57 (with which code)', () => {
      const event: any = { target: { value: '' }, which: 58, key: ':', keyCode: 58, preventDefault: jasmine.createSpy('preventDefault') };
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });
  
    it('should prevent invalid phone number input when input value is empty and charCode > 57 (with key code)', () => {
      const event: any = { target: { value: '' }, key: ':', keyCode: 58, preventDefault: jasmine.createSpy('preventDefault') };
      component.validatePhoneNumber(event);
      expect(event.target.value).toBe('');
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });  
   
  it('should validate the email input correctly', () => {
    const emailFormControl = component.signupForm.get('email');
    expect(emailFormControl).not.toBeNull();

    emailFormControl?.setValue('abc@gmail.com');
    component.validateEmail();
    expect(emailFormControl?.errors).toBeNull();

    emailFormControl?.setValue('invalid-email');
    component.validateEmail();
    expect(emailFormControl?.errors?.['invalidEmail']).toBeTruthy();
  });

  it('should make the HTTP request with the correct data', () => {
    const credentials = {
      name: 'Sharique Nadim',
      phoneNumber: '9876543210',
      email: 'abc@gmail.com',
      password: 'Abc@1234',
      repassword: 'Abc@1234'
    };
    component.signupForm.setValue(credentials);
    httpClientSpy.post.and.returnValue(of({ message: 'User created successfully' }));

    component.onSubmit();

    expect(httpClientSpy.post).toHaveBeenCalled();
    expect(component.response).toEqual('User created successfully');
  });

  it('should handle client-side errors correctly', () => {
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      error: 'User already exists',
      status: 400,
      statusText: 'Bad Request'
    });

    spyOn(component, 'handleError').and.stub();
    httpClientSpy.post.and.returnValue(throwError(errorResponse));

    const formValue = {
      name: 'Sharique Nadim',
      phoneNumber: '9876543210',
      email: 'abc@gmail.com',
      password: 'Abc@1234',
      repassword: 'Abc@1234'
    };
    component.signupForm.setValue(formValue);

    component.onSubmit();

    console.log('Form Valid:', component.signupForm.valid);
    console.log('httpClientSpy.post called:', httpClientSpy.post.calls.any());
    console.log('component.response:', component.response);

    expect(httpClientSpy.post).toHaveBeenCalledWith(
      'http://localhost:3000/signup',
      {
        name: 'Sharique Nadim',
        phone: '9876543210',
        email: 'abc@gmail.com',
        password: 'Abc@1234',
        confirmPassword: 'Abc@1234'
      },
      jasmine.any(Object)
    );
    expect(component.handleError).toHaveBeenCalledWith(errorResponse);
    expect(component.response.status).toBeUndefined();
  });

  it('should handle general errors correctly', () => {
    const errorEvent = new ErrorEvent('General Error');
    const errorResponse: HttpErrorResponse = new HttpErrorResponse({
      error: errorEvent,
      status: 0,
      statusText: 'Unknown Error'
    });
  
    spyOn(console, 'error'); 
    spyOn(component, 'handleError').and.callThrough();
    httpClientSpy.post.and.returnValue(throwError(errorResponse));
  
    const formValue = {
      name: 'Sharique Nadim',
      phoneNumber: '9876543210',
      email: 'abc@gmail.com',
      password: 'Abc@1234',
      repassword: 'Abc@1234'
    };
    component.signupForm.setValue(formValue);
  
    component.onSubmit();
  
    expect(httpClientSpy.post).toHaveBeenCalledWith(
      'http://localhost:3000/signup',
      {
        name: 'Sharique Nadim',
        phone: '9876543210',
        email: 'abc@gmail.com',
        password: 'Abc@1234',
        confirmPassword: 'Abc@1234'
      },
      jasmine.any(Object)
    );
    expect(component.handleError).toHaveBeenCalledWith(errorResponse);
    expect(component.response).toEqual({ status: undefined, message: 'An error occurred during signup. Please try again later.' });
    expect(console.error).toHaveBeenCalled(); // Verify that console.error is called
  });

  it('should validate the password match correctly', () => {
    const passwordControl = component.signupForm.get('password');
    const repasswordControl = component.signupForm.get('repassword');

    passwordControl?.setValue('Abc@1234');
    repasswordControl?.setValue('Abc@1234');
    expect(component.passwordMatchValidator(repasswordControl as FormControl)).toBeNull();

    passwordControl?.setValue('Abc@1234');
    repasswordControl?.setValue('Abc@12345');
    expect(component.passwordMatchValidator(repasswordControl as FormControl)).toEqual({ passwordMismatch: true });
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeTrue();
  });
  afterEach(() => {
    httpTestingController.verify();
  });
});
