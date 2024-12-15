import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from 'src/environments/environments';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AppserviceService } from './appservice.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'DocuSearch';
  dropdownOptions: any[] = [
    { label: 'Select', value: 'select' }
  ];
  searchResult: any[] = [];
  resultAreaContent: string = '';
  contentSearchForm: FormGroup;
  isAuthenticated: boolean = false;
  isfileDropdown: boolean = true;
  isResultArea: boolean = true;
  successMessage: string = '';
  errorMessage: string = '';
  isSearching: boolean = false;
  textRegex: RegExp = /^[a-zA-Z0-9 ,.-]*$/s;
  refreshInterval: any;
  envVariables: any;

  constructor(private appService: AppserviceService) { }

  ngOnInit(): void {

    this.getEnv();
    this.createContentForm();
    this.checkUserToken();
    this.refreshInterval = this.getRefresh();
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshInterval)
  }

  getEnv() {
    this.appService.getEnv().subscribe({
      next: (res: any) => {
        this.envVariables = res;
      },
      error: (err: any) => {
        this.errorMessage = 'Something went wrong, please try again!!!'
        this.clearAlertMessage();
      }
    })
  }

  createContentForm() {
    this.contentSearchForm = new FormGroup({
      search_area: new FormControl('', [Validators.required])
    })
  }

  checkUserToken() {
    let authenticationResult: any = localStorage.getItem('is_authenticated') ? JSON.parse(localStorage.getItem('is_authenticated')) : '';
    this.appService.checkToken().subscribe({
      next: (res: any) => {
        if (res.success && authenticationResult.is_authenticated) {
          localStorage.setItem('access_token', res.data);
          this.isAuthenticated = true;
          this.successMessage = 'Authentication with Dropbox was successful. You can now proceed with your search.'
          this.clearAlertMessage();
        }
        else {
          this.isAuthenticated = false;
        }
      },
      error: (err: any) => {
        this.errorMessage = 'Something went wrong, please try again!!!'
        this.clearAlertMessage();
      }
    })
  }

  authenticateWithDropbox() {
    if (this.envVariables && this.envVariables.client_id) {
      localStorage.setItem('is_authenticated', JSON.stringify({ is_authenticated: true }));
      const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${this.envVariables.client_id}&response_type=code&redirect_uri=${environment.redirect_Uri}`;
      window.location.href = authUrl;
    }
    else {
      this.errorMessage = 'Something went wrong, please refresh the page and try again.'
      this.clearAlertMessage();
    }
  }

  searchContent() {
    if (this.isAuthenticated) {
      if (this.contentSearchForm.valid) {
        let searchValue: any = this.contentSearchForm.value;
        if ((searchValue.search_area.trim()).length < 5) {
          this.errorMessage = 'Search requires at least 5 characters.';
          this.clearAlertMessage();
        }
        else if ((searchValue.search_area.trim()).length > 500) {
          this.errorMessage = 'Search input is limited to a maximum of 500 characters.';
          this.clearAlertMessage();
        }
        else if (!this.textRegex.test(searchValue.search_area.trim())) {
          this.errorMessage = 'Only alphanumeric characters are allowed.';
          this.clearAlertMessage();
        }
        else {
          this.setInitial();
          this.isSearching = true
          let data = {
            search: searchValue.search_area.trim()
          }
          this.appService.searchContent(data).subscribe({
            next: (res: any) => {
              if (res.success) {
                if (res.data.length) {
                  this.successMessage = "The following files contain the content you're searching for. Please select a file from the dropdown to view the results."
                  this.clearAlertMessage();
                  this.searchResult = res.data;
                  this.dropdownOptions = [{ label: 'Select', value: 'select' }];
                  res.data.forEach((elem: any) => {
                    this.dropdownOptions.push({ label: elem.name, value: elem.name });
                  });
                  this.isfileDropdown = false;
                }
                else {
                  this.errorMessage = 'No results found for your search.'
                  this.clearAlertMessage();
                }
              }
              else {
                this.errorMessage = 'Search could not be completed. Please try again.'
                this.clearAlertMessage();
              }
              this.isSearching = false;
            },
            error: (err: any) => {
              this.errorMessage = 'Something went wrong, please try again!!!'
              this.clearAlertMessage();
              this.isSearching = false;
            }
          })
        }
      }
      else {
        this.errorMessage = 'Please provide content to proceed with the search.';
        this.clearAlertMessage();
      }
    }
    else {
      this.errorMessage = 'Please log in to Dropbox to continue.';
      this.clearAlertMessage();
    }
  }

  setInitial() {
    this.dropdownOptions = [{ label: 'Select', value: 'select' }];
    this.isfileDropdown = true;
    this.resultAreaContent = '';
    this.isResultArea = true;
  }

  reset() {
    this.isAuthenticated = false;
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('access_token');
    this.dropdownOptions = [{ label: 'Select', value: 'select' }];
    this.isfileDropdown = true;
    this.resultAreaContent = '';
    this.isResultArea = true;
    this.contentSearchForm.controls['search_area'].setValue('');
  }

  chooseFile(event: any) {
    if (event.target.value && event.target.value !== 'select') {
      let content: any = this.searchResult.find((elem: any) => elem.name === event.target.value);
      this.resultAreaContent = content.content;
      this.isResultArea = false;
    }
    else {
      this.resultAreaContent = '';
      this.isResultArea = true;
    }
  }

  clearAlertMessage() {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 5000);
  }

  getRefresh() {
    return setInterval(() => {
      localStorage.removeItem('is_authenticated');
      localStorage.removeItem('access_token');
      window.location.reload();
    }, 1000 * 60 * 20);
  }
}
