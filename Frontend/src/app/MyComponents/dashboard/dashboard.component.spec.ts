import { ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardComponent } from './dashboard.component';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    httpClientSpy.get.and.returnValue(of([]));
    httpClientSpy.post.and.returnValue(of({}));
  
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [
        HttpClientModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [
        FormBuilder,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch user data on initialization', () => {
    const userData = {
      _id: 'test_id',
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
    };

    httpClientSpy.get.and.returnValue(of(userData));

    component.ngOnInit();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/me', { withCredentials: true });
    expect(component.user).toEqual(userData);
  });

  it('should redirect to login if user retrieval fails', fakeAsync(() => {
    httpClientSpy.get.and.returnValue(throwError('Error retrieving user'));

    component.ngOnInit();
    tick();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/me', { withCredentials: true });
    expect(component.user).toBeUndefined();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should logout the user', () => {
    httpClientSpy.post.and.returnValue(of({}));
  
    spyOn(localStorage, 'clear');
    spyOnProperty(document, 'cookie').and.returnValue('');
  
    component.logout();
  
    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/logout', {}, { withCredentials: true });
    expect(localStorage.clear).toHaveBeenCalled();
    expect(document.cookie).toBe('');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should toggle the dropdown', () => {
    component.isDropdownOpen = false;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBeTrue();

    component.isDropdownOpen = true;
    component.toggleDropdown();
    expect(component.isDropdownOpen).toBeFalse();
  });

  it('should close the dropdown when clicking outside', () => {
    const dropdownElement = document.createElement('div');
    const dropdownContentElement = document.createElement('div');
  
    spyOn(document, 'querySelector').and.returnValues(dropdownElement, dropdownContentElement);
  
    const event = new MouseEvent('click');
    component.isDropdownOpen = true;
    component.onDocumentClick(event);
  
    expect(component.isDropdownOpen).toBeFalse();
    expect(component.onDocumentClick(event)).toBeUndefined();
  });

  it('should not close the dropdown when clicking inside', () => {
    const dropdown = document.createElement('div');
    const event = new MouseEvent('click');
  
    spyOn(document, 'querySelector').and.returnValue(dropdown);
  
    component.isDropdownOpen = true;
    component.onDocumentClick(event);
  
    expect(component.isDropdownOpen).toBeFalse();
  });

  it('should search for cities', () => {
    const query = 'test';

    httpClientSpy.get.and.returnValue(of([]));

    component.query = query;
    component.searchCities();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/search', { params: { q: query } });
    expect(component.recommendations).toEqual([]);
    expect(component.isSuggestionListActive).toBeFalse();
  });

  it('should handle error during city search', () => {
    const query = 'test';

    httpClientSpy.get.and.returnValue(throwError('Error searching for cities'));

    component.query = query;
    component.searchCities();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/search', { params: { q: query } });
    expect(component.recommendations).toEqual([]);
    expect(component.isSuggestionListActive).toBeFalse();
  });

  it('should toggle button visibility', () => {
    component.query = '';
    component.isSuggestionListActive = false;
    component.toggleButtonVisibility();
    expect(component.isButtonHidden).toBeTrue();

    component.query = 'test';
    component.isSuggestionListActive = false;
    component.toggleButtonVisibility();
    expect(component.isButtonHidden).toBeFalse();

    component.query = '';
    component.isSuggestionListActive = true;
    component.toggleButtonVisibility();
    expect(component.isButtonHidden).toBeTrue();

    component.query = 'test';
    component.isSuggestionListActive = true;
    component.toggleButtonVisibility();
    expect(component.isButtonHidden).toBeTrue();
  });

  it('should handle empty query', () => {
    component.query = '';
    component.recommendations = [{ name: 'City 1' }, { name: 'City 2' }];
    component.isSuggestionListActive = true;
  
    component.searchCities();
  
    expect(component.query).toBe('');
    expect(component.recommendations).toEqual([]);
    expect(component.isSuggestionListActive).toBeFalse();
  });

  it('should select a city', () => {
    const cityId = 'test_id';
    const cityName = 'Test City';
    const stateName = 'Test State';

    component.query = 'test';
    component.recommendations = [
      { _id: cityId, name: cityName, state: stateName },
    ];

    component.selectCity(cityId, cityName, stateName);

    expect(component.query).toBe(cityName);
    expect(component.selectedCity).toBe(cityName);
    expect(component.selectedState).toBe(stateName);
    expect(component.selectedCityId).toBe(cityId);
    expect(component.isSuggestionListActive).toBeFalse();
    expect(component.isButtonHidden).toBeFalse();
    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/reviews', { params: { city: cityName } });
  });

  it('should open the city details popup', () => {
    const city = 'Test City';
    const state = 'Test State';
    const population = 10000;
    const latitude = 0;
    const longitude = 0;

    httpClientSpy.get.and.returnValue(of({
      population: population,
      latitude: latitude,
      longitude: longitude,
    }));

    component.selectedCity = city;
    component.selectedState = state;

    component.openCityDetailsPopup();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/details', { params: { city: city, state: state } });
    expect(component.cityPopulation).toBe(population);
    expect(component.cityLatitude).toBe(latitude);
    expect(component.cityLongitude).toBe(longitude);
    expect(component.isCityDetailsPopupOpen).toBeTrue();
    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/reviews', { params: { city: city } });
  });

  it('should handle error when opening city details popup', () => {
    const city = 'Test City';
    const state = 'Test State';

    httpClientSpy.get.and.returnValue(throwError('Error fetching city details'));

    component.selectedCity = city;
    component.selectedState = state;

    component.openCityDetailsPopup();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/details', { params: { city: city, state: state } });
    expect(component.isCityDetailsPopupOpen).toBeFalse();
  });

  it('should close the city details popup', () => {
    component.isCityDetailsPopupOpen = true;
    component.closeCityDetailsPopup();
    expect(component.isCityDetailsPopupOpen).toBeFalse();
  });

  it('should navigate to city details', () => {
    component.selectedCity = 'Test City';
    component.selectedState = 'Test State';
  
    const openSpy = spyOn(window, 'open').and.stub();
  
    component.goToCity();
  
    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Test%20City,Test%20State',
      '_blank'
    );
  });

  it('should update the selected rating', () => {
    component.selectedRating = 0;
    component.showReview = false;
    component.isRatingSelected = false;

    component.updateRating(3);

    expect(component.selectedRating).toBe(3);
    expect(component.isRatingSelected).toBeTrue();
    expect(component.showReview).toBeTrue();

    component.updateRating(5);

    expect(component.selectedRating).toBe(5);
    expect(component.isRatingSelected).toBeTrue();
    expect(component.showReview).toBeFalse();
  });

  it('should return star styles', () => {
    component.selectedRating = 3;
  
    expect(component.getStarStyles(1)).toBe('');
    expect(component.getStarStyles(3)).toBe('color: #fc0; text-shadow: #fc0 0 0 20px;');
    expect(component.getStarStyles(5)).toBe('');
  });

  it('should open the map in a new tab', () => {
    component.selectedCity = 'Test City';
    component.selectedState = 'Test State';

    spyOn(window, 'open');

    component.openMap();

    expect(window.open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=Test City,Test State',
      '_blank'
    );
  });

  it('should add otherOptionText to reviews when "Other" option is selected and otherOptionText is not empty', () => {
    const userId = 'test_user_id';
    const cityId = 'test_city_id';
    const cityName = 'Test City';
    const rating = 5;
  
    const reviewData = {
      userId: userId,
      cityId: cityId,
      rating: rating,
      cityName: cityName,
      reviews: ['Other', 'Some other review'],
    };
  
    const otherOptionText = 'Some other review';
  
    component.user = { _id: userId } as any;
    component.selectedCityId = cityId;
    component.selectedCity = cityName;
    component.selectedRating = rating;
    component.selectedReviews = ['Other'];
    component.otherOptionText = otherOptionText;
  
    httpClientSpy.post.and.returnValue(of({}));
  
    component.submitReview();
  
    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/reviews', reviewData, { withCredentials: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Thank You! Review Submitted.', 'Close', { duration: 4000 });
    expect(component.selectedRating).toBe(0);
    expect(component.selectedReviews).toEqual([]);
    expect(component.showReview).toBeFalse();
    expect(component.isRatingSelected).toBeFalse();
    expect(component.otherOptionText).toBe('');
  });

  it('should toggle review option', () => {
    component.selectedReviews = [];
    component.otherOptionText = '';

    component.toggleReviewOption('Other');

    expect(component.selectedReviews).toEqual(['Other']);

    component.toggleReviewOption('Other');

    expect(component.selectedReviews).toEqual([]);

    component.toggleReviewOption('Option 1');

    expect(component.selectedReviews).toEqual(['Option 1']);

    component.toggleReviewOption('Option 1');

    expect(component.selectedReviews).toEqual([]);
  });

  it('should submit the review', fakeAsync(() => {
    const userId = 'test_user_id';
    const cityId = 'test_city_id';
    const cityName = 'Test City';
    const rating = 5;

    const reviewData = {
      userId: userId,
      cityId: cityId,
      rating: rating,
      cityName: cityName,
      reviews: ['Review 1', 'Review 2'],
    };

    httpClientSpy.post.and.returnValue(of({}));

    component.user = { _id: userId } as any;
    component.selectedCityId = cityId;
    component.selectedCity = cityName;
    component.selectedRating = rating;
    component.selectedReviews = ['Review 1', 'Review 2'];

    component.submitReview();
    tick();

    expect(httpClientSpy.post).toHaveBeenCalledWith('http://localhost:3000/reviews', reviewData, { withCredentials: true });
    expect(snackBarSpy.open).toHaveBeenCalledWith('Thank You! Review Submitted.', 'Close', { duration: 4000 });
    expect(component.selectedRating).toBe(0);
    expect(component.selectedReviews).toEqual([]);
    expect(component.showReview).toBeFalse();
    expect(component.isRatingSelected).toBeFalse();
    expect(component.otherOptionText).toBe('');
  }));

  it('should handle missing data for review submission', () => {
    const reviewData = {
      userId: undefined,
      cityId: undefined,
      rating: undefined,
      cityName: '',
      reviews: [],
    };
  
    component.user = undefined;
    component.selectedCityId = '';
    component.selectedCity = '';
    component.selectedRating = 0;
    component.selectedReviews = [];
  
    component.submitReview();
  
    expect(httpClientSpy.post).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should handle error during review submission', fakeAsync(() => {
    httpClientSpy.post.and.returnValue(throwError('Error submitting review'));

    component.user = { _id: 'test_user_id' } as any;
    component.selectedCityId = 'test_city_id';
    component.selectedCity = 'Test City';
    component.selectedRating = 5;
    component.selectedReviews = ['Review 1', 'Review 2'];

    component.submitReview();
    tick();

    expect(httpClientSpy.post).toHaveBeenCalledWith(
      'http://localhost:3000/reviews',
      jasmine.any(Object),
      { withCredentials: true }
    );
    expect(snackBarSpy.open).not.toHaveBeenCalledWith('Thank You! Review Submitted.', 'Close', { duration: 4000 });
  }));

  it('should fetch city reviews', () => {
    const city = 'Test City';
    const avgRating = '4.5';
    const uniqueUsers = 10;

    httpClientSpy.get.and.returnValue(of({ avgRating: avgRating, uniqueUsers: uniqueUsers }));

    component.selectedCity = city;

    component.fetchCityReviews();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/reviews', { params: { city: city } });
    expect(component.avgRating).toBe(parseFloat(avgRating));
    expect(component.numReviews).toBe(uniqueUsers);
  });

  it('should handle error during fetching city reviews', () => {
    const city = 'Test City';

    httpClientSpy.get.and.returnValue(throwError('Error fetching city reviews'));

    component.selectedCity = city;

    component.fetchCityReviews();

    expect(httpClientSpy.get).toHaveBeenCalledWith('http://localhost:3000/cities/reviews', { params: { city: city } });
    expect(component.avgRating).toBe(0);
    expect(component.numReviews).toBe(0);
  });
});
