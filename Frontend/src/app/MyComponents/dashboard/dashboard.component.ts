import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';


interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | undefined;
  isDropdownOpen: boolean = false;
  query = '';
  recommendations: any[] = [];
  isSuggestionListActive = false;
  selectedCity: string = '';
  selectedState: string = '';
  isButtonHidden = true;
  isCityDetailsPopupOpen = false;
  cityPopulation: number = 0;
  cityLatitude: number = 0;
  cityLongitude: number = 0;
  selectedRating: number = 0;
  showReview: boolean = false;
  isRatingSelected: boolean = false;
  selectedReviews: string[] = [];
  isReviewOptionSelected(option: string): boolean {
    return this.selectedReviews.includes(option);
  };  

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getUser();
  }

  getUser() {
    this.http.get<User>('http://localhost:3000/me', { withCredentials: true })
      .subscribe(
        (response: User) => {
          this.user = response;
        },
        (error) => {
          console.error('Error retrieving user:', error);
          // Redirect to login if user is not logged in
          this.router.navigate(['/login']);
        }
      );
  }

  logout() {
    this.http.post('http://localhost:3000/logout', {}, { withCredentials: true })
      .subscribe(
        () => {
          // After successful logout, remove the token from localStorage and clear cookies
          localStorage.clear();
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

          // Navigate to the login page
          this.router.navigate(['/login']);
        },
        (error) => {
          console.error('Error during logout:', error);
        }
      );
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdown = document.querySelector('.profile-dropdown');
    if (!dropdown || !dropdown.contains(event.target as Node)) {
      this.isDropdownOpen = false;
    }
  }
  // Function to search cities based on the query
  searchCities() {
    if (this.query) {
      console.log('Performing city search with query:', this.query);

      this.http.get<any[]>('http://localhost:3000/cities/search', { params: { q: this.query } }).subscribe(
        (response) => {
          // Search successful, assign results to recommendations array
          console.log('Search results:', response);
          this.recommendations = response;
          this.isSuggestionListActive = this.recommendations.length > 0;
        },
        (error) => {
          // Handle error during search
          console.error('Error occurred while searching for cities:', error);
          this.recommendations = []; // Reset recommendations array
          this.isSuggestionListActive = false;
        }
      );
    } else {
      // Empty query, reset recommendations array
      console.log('Empty query. Resetting recommendations array.');
      this.recommendations = [];
      this.isSuggestionListActive = false;
    }
  }

  toggleButtonVisibility() {
    this.isButtonHidden = !this.query || this.isSuggestionListActive;
    // Hide button if query is empty or suggestion list is active
  }

  selectCity(cityName: string, stateName: string) {
    this.query = cityName;
    this.selectedCity = cityName;
    this.selectedState = stateName;
    this.isSuggestionListActive = false;
    this.toggleButtonVisibility();
  }

  openCityDetailsPopup() {
    this.http.get<any>('http://localhost:3000/cities/details', { params: { city: this.selectedCity, state: this.selectedState } }).subscribe(
      (response) => {
        // Fetch successful, assign city details
        console.log('City details:', response);
        this.cityPopulation = response.population;
        this.cityLatitude = response.latitude;
        this.cityLongitude = response.longitude;
        this.isCityDetailsPopupOpen = true;
      },
      (error) => {
        // Handle error during fetching city details
        console.error('Error occurred while fetching city details:', error);
      }
    );
  }

  closeCityDetailsPopup() {
    this.isCityDetailsPopupOpen = false;
  }

  goToCity() {
    // Handle the action when the user clicks the "GO" button
    console.log('Navigating to city:', this.selectedCity, ', state:', this.selectedState);
    this.openCityDetailsPopup();
  }

  updateRating(rating: number) {
    this.selectedRating = rating;
    console.log('Selected Rating:', this.selectedRating);
    this.isRatingSelected = true;
    // Update showReview flag based on the rating
    this.showReview = rating < 5;
  }

  getStarStyles(index: number): string {
    if (index <= this.selectedRating) {
      return `color: #fc0; text-shadow: #fc0 0 0 20px;`;
    }
    return '';
  }

  openMap() {
    // Handle the action when the user clicks the "GO" button
    console.log('Navigating to city:', this.selectedCity, ', state:', this.selectedState);
    window.open(`https://www.google.com/maps/search/?api=1&query=${this.selectedCity},${this.selectedState}`, '_blank');
  }

  toggleReviewOption(option: string) {
    const index = this.selectedReviews.indexOf(option);
  
    if (index > -1) {
      this.selectedReviews.splice(index, 1);
      console.log(`Removed option: ${option}`);
    } else {
      this.selectedReviews.push(option);
      console.log(`Added option: ${option}`);
    }
  }

  submitReview() {
    const userId = this.user?._id;
    const cityId = this.recommendations[0]?.id;
    const rating = this.selectedRating;
  
    // Check if the required data is available
    if (!userId || !cityId || !rating) {
      console.error('Missing required data for review submission.');
      return;
    }
  
    const reviewData = {
      userId,
      cityId,
      rating,
      cityName: this.recommendations[0]?.name,
      reviews: this.selectedReviews
    };
  
    // Make an HTTP POST request to the '/reviews' endpoint
    this.http.post<any>('http://localhost:3000/reviews', reviewData, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Review submitted successfully:', response);
          // Show a snackbar or notification
          this.snackBar.open('Thank You! Review Submitted.', 'Close', {
            duration: 4000, // Duration in milliseconds
          });
          // Reset the selected rating, reviews, and showReview flag
          this.selectedRating = 0;
          this.selectedReviews = [];
          this.showReview = false;
          this.isRatingSelected = false;
        },
        (error) => {
          console.error('Error occurred while submitting the review:', error);
          // Handle error or show error message
        }
      );
  }  

}
