import { Component, OnInit, HostListener, Renderer2 } from '@angular/core';
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
  avgRating: number = 0;
  numReviews: number = 0;
  otherOptionText: string = '';
  selectedCityId: string = '';


  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar, private renderer: Renderer2) { }
  ngOnInit() {
    this.getUser();
    this.fetchCityReviews();
  }

  getUser() {
    this.http.get<User>('http://localhost:3000/me', { withCredentials: true })
      .subscribe(
        (response: User) => {
          this.user = response;
        },
        (error) => {
          console.error('Error retrieving user:', error);
          this.user = undefined;
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
        }
      );
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const dropdown = document.querySelector('.profile-dropdown');
  const dropdownContent = document.querySelector('.dropdown-content');
  
  if (dropdown && dropdownContent) {
    if (dropdown.contains(event.target as Node) || dropdownContent.contains(event.target as Node)) {
      return;
    }
  }
  this.isDropdownOpen = false;
}
  // Function to search cities based on the query
  searchCities() {
    if (this.query !== '') {
      this.http.get<any[]>('http://localhost:3000/cities/search', { params: { q: this.query } }).subscribe(
        (response) => {
          this.recommendations = response;
          this.isSuggestionListActive = this.recommendations.length > 0;
        },
        (error) => {
          console.error('Error occurred while searching for cities:', error);
          this.recommendations = [];
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

  selectCity(cityId: string, cityName: string, stateName: string) {
    this.query = cityName;
    this.selectedCity = cityName;
    this.selectedState = stateName;
    this.selectedCityId = cityId;
    this.isSuggestionListActive = false;
    this.toggleButtonVisibility();
    this.fetchCityReviews();
  }

  openCityDetailsPopup() {
    this.http.get<any>('http://localhost:3000/cities/details', { params: { city: this.selectedCity, state: this.selectedState } }).subscribe(
      (response) => {
        this.cityPopulation = response.population;
        this.cityLatitude = response.latitude;
        this.cityLongitude = response.longitude;
        this.isCityDetailsPopupOpen = true;
        this.fetchCityReviews();
      },
      (error) => {
        console.error('Error occurred while fetching city details:', error);
      }
    );
  }

  closeCityDetailsPopup() {
    this.isCityDetailsPopupOpen = false;
  }

  goToCity() {
    const city = encodeURIComponent(this.selectedCity);
    const state = encodeURIComponent(this.selectedState);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${city},${state}`;
  
    window.open(mapUrl, '_blank');
  }

  updateRating(rating: number) {
    this.selectedRating = rating;
    console.log('Selected Rating:', this.selectedRating);
    this.isRatingSelected = true;
    // Update showReview flag based on the rating
    this.showReview = rating < 5;
  }

  getStarStyles(rating: number): string {
    if (rating <= this.selectedRating) {
      return 'color: #fc0; text-shadow: #fc0 0 0 20px;';
    } else {
      return '';
    }
  }

  openMap() {
    // Handle the action when the user clicks the "GO" button
    console.log('Navigating to city:', this.selectedCity, ', state:', this.selectedState);
    window.open(`https://www.google.com/maps/search/?api=1&query=${this.selectedCity},${this.selectedState}`, '_blank');
  }

  toggleReviewOption(option: string) {
    if (option === 'Other') {
      if (this.isReviewOptionSelected('Other')) {
        // Deselect the "Other" option
        const index = this.selectedReviews.indexOf('Other');
        if (index > -1) {
          this.selectedReviews.splice(index, 1);
        }
      } else {
        // Select the "Other" option
        this.selectedReviews.push('Other');
      }
    } else {
      const index = this.selectedReviews.indexOf(option);
  
      if (index > -1) {
        this.selectedReviews.splice(index, 1);
        console.log(`Removed option: ${option}`);
      } else {
        this.selectedReviews.push(option);
        console.log(`Added option: ${option}`);
      }
    }
  }
  
  submitReview() {
    const userId = this.user?._id;
    const cityId = this.selectedCityId; 
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
      cityName: this.selectedCity, // Use selectedCity instead of recommendations[0]?.name
      reviews: this.selectedReviews
    };
  
    // If 'Other' option is selected and the otherOptionText is not empty, add it to the reviews
    if (this.isReviewOptionSelected('Other') && this.otherOptionText.trim() !== '') {
      reviewData.reviews.push(this.otherOptionText);
    }
  
    // Make an HTTP POST request to the '/reviews' endpoint
    this.http.post<any>('http://localhost:3000/reviews', reviewData, { withCredentials: true })
      .subscribe(
        (response) => {
          // console.log('Review submitted successfully:', response);
          // Show a snackbar or notification
          this.snackBar.open('Thank You! Review Submitted.', 'Close', {
            duration: 4000, // Duration in milliseconds
          });
          // Reset the selected rating, reviews, and showReview flag
          this.selectedRating = 0;
          this.selectedReviews = [];
          this.showReview = false;
          this.isRatingSelected = false;
          this.otherOptionText = '';
        },
        (error) => {
          console.error('Error occurred while submitting the review:', error);
          // Handle error or show error message
        }
      );
  }

  // Function to fetch city reviews from the server
  fetchCityReviews() {
    const city = this.selectedCity;
    if (!city) {
      console.error('No city selected. Cannot fetch reviews.');
      return;
    }

    // Make an HTTP GET request to the server to fetch city reviews
    this.http.get<any>(`http://localhost:3000/cities/reviews`, { params: { city } })
      .subscribe(
        (response) => {
          // Update the component properties with the received data
          this.avgRating = parseFloat(response.avgRating);
          this.numReviews = response.uniqueUsers;
        },
        (error) => {
          console.error('Error occurred while fetching city reviews:', error);
          // Handle error or show error message
        }
      );
  }

}
