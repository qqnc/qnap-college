import { CourseDoc } from './../../_models/document';
import { ModalService } from './../../_services/modal.service';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { Category } from '../../_models/category';
import { CategoryService } from '../../_services/category.service';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { Course } from '../../_models/course';
// import { NgxScreensizeModule } from '../../modules/ngx-screensize';
import { NgxScreensizeService } from '../../modules/ngx-screensize/_services/ngx-screensize.service';
// import { CoursesComponent } from '../../admin/courses/courses.component';
import { CourseService } from '../../_services/course.service';

import * as _ from 'lodash';
import { AuthService } from '../../auth/_services/auth.service';
import { FavService } from '../../_services/favorite.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cElement', {read: ElementRef}) cElement: ElementRef;
  @ViewChild('collection', {read: ElementRef}) collectionEl: ElementRef;
  private sub: any;
  categories: Category [];
  courses: Course [];
  cGridWidth: Number;
  gridCol: Number;
  gridClass: String;
  toCollection: boolean;
  menuOpen: boolean;
  menuOpenForStyle: boolean;
  displayOptions;
  currentDisplay;
  loading;
  cs;
  page = 1;
  loadingmore = false;
  totalPages = 0;
  finished = false;
  loggedIn: boolean = false;
  currentUser = null;
  currentUserAbbvName = 'JD';

  @HostListener('window:scroll', ['$event'])
  currentPosition() {
    if (window.pageYOffset + 300 > this.collectionEl.nativeElement.offsetHeight) {
      this.toCollection = false;  // set true if wanna enable the collection button.
    } else {
      this.toCollection = false;
    }
  }

  constructor(
    private _categoryService: CategoryService,
    private _favService: FavService,
    private _route: ActivatedRoute,
    private _modalService: ModalService,
    private _ssService: NgxScreensizeService,
    private _courseService: CourseService,
    private _router: Router,
    private _authService: AuthService) {
    }

  ngOnInit() {
    const localColSetting = localStorage.getItem('grid-col');
    this.cGridWidth = 0;
    this.categories = [];
    this.courses = [];
    this.gridCol = localColSetting ? + localColSetting : 2;
    this.gridCol === 2 ? this.gridClass = 'col-md-5' : this.gridClass = 'col-md-4';
    this.menuOpen = false;
    this.menuOpenForStyle = false;
    this.displayOptions = this._courseService.options;
    this.loading = false;
    this.currentDisplay = localStorage.getItem('currentDisplay');
    if (this.currentDisplay) {
      this.cs = this._courseService.optionsMapping[this.currentDisplay];
    }
    

    this._authService.verify().subscribe(
      (res) => {
        if (res && res.success) {
          this.loggedIn = true;
          this.displayOptions.push({name: 'My Favorite', value: 'favorites'});
          // console.log(this.displayOptions)
          
          this.currentUser = this._authService.getUser();
          
          this.currentUserAbbvName = this.currentUser.name.split(" ").map((n)=>n[0]).join("")

          if (this.currentUser && this.currentUser.favorites != []) {
            this.courses.forEach((item, index) => {
              if (this.currentUser.favorites.indexOf(this.courses[index]._id) != -1)
                this.courses[index].isFavorited = true;
              else
                this.courses[index].isFavorited = false;
            })

            // console.log(this.courses)
          } else {
            // Should remove my favorite
            this.removeFavoriteOption();
          }
        }

        // console.log(this.currentUser);
      },
      (err) => {
        // console.log(err);
      }
    );

    this.sub = this._route.data.subscribe(
      (data: Data) => {
        if (data.coursedoc) {
          // console.log(data.coursedoc);
          this.courses = data.coursedoc.docs;
          this.totalPages = data.coursedoc.pages;
          setTimeout( () => {
            const screenClass = this._ssService.sizeClass();
            if (screenClass === 'xs' || screenClass === 'sm') {
              this.cGridWidth = this.cElement.nativeElement.offsetWidth / 3;
            } else {
              this.cGridWidth = this.cElement.nativeElement.offsetWidth;
            }
            // console.log(this.cElement.nativeElement.offsetWidth);
            }, 100);
        }

        if (data.categories) {
          this.categories = data.categories;
        }
      }
    );
  }

  ngAfterViewInit() {
    // const cs = localStorage.getItem('currentDisplay');
    setTimeout(() => {
      if (this.cs) {
      } else {
        this.currentDisplay = 'Latest';
      }
    }, 0);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onGridSelect(grid: number) {
    this.gridCol = grid;
    localStorage.setItem('grid-col', this.gridCol.toString());
  }

  onModalPop(course: Course) {
    this._courseService.quickClicked(course);
    this._modalService.popModal(course.youtube_ref);
  }

  toggleMenu() {
    if ( !this.menuOpen ) {
      setTimeout(() => {
        this.menuOpenForStyle = !this.menuOpenForStyle;
      }, 400);
    } else {
      this.menuOpenForStyle = !this.menuOpenForStyle;
    }
    this.menuOpen = !this.menuOpen;
  }

  changeDisplayTo(option) {
    this.loading = true;
    localStorage.setItem('currentDisplay', option.name);
    this.currentDisplay = option.name;
    this.cs = option.value;
    this.page = 1;
    this.toggleMenu();
    let promise;

    if (this.loggedIn && option.value === 'favorites'){
      promise = this._courseService.getFavoritedCourses(6, this.page);
    } else {
      promise = this._courseService.all(6, option.value, this.page);
    }
    
    promise.subscribe(
      (coursedoc: CourseDoc) => {
        this.courses = coursedoc.docs;
        this.runCheckFavorites(this.courses);
        this.loading = false;
      },
      (error) => {
        console.log('Something went wrong!');
        this.loading = false;
      }
    );
  }

  onScroll () {
    // console.log('scrolled!!');
    this.loadingmore = true;
    this.page += 1;
    let promise;

    console.log(this.loggedIn)
    console.log(this.cs)
    if (this.loggedIn && this.cs === 'favorites'){
      promise = this._courseService.getFavoritedCourses(6, this.page);
    } else {
      if (this.cs === 'favorites') {
        this.cs === 'publishedDate';
        this.changeDisplayTo({name: 'Latest', value: 'publishedDate'})
        
      }
      promise = this._courseService.all(6, this.cs, this.page);
    }
    promise.subscribe(
      (newcoursedoc: CourseDoc) => {
        // console.log(newcoursedoc);
        for ( const doc of newcoursedoc.docs) {
          if (this.currentUser && this.currentUser.favorites != []) {
            if (this.currentUser.favorites.indexOf(doc._id) != -1) {
              doc.isFavorited = true;
            }
            else {
              doc.isFavorited = false;
            }
          }
          this.courses.push(doc);
        }

        if (this.page === this.totalPages) {
          this.finished = true;
          // console.log('finished.');
        }

        this.loadingmore = false;
      },
      (err) => {
        this._router.navigate(['/maintenance']);
      return [];
      }
    );
  }

  onNavigate(e) {
    e.stopPropagation();
  }

  onToggleFavorite(e, cid: string) {
    e.stopPropagation();
    if(!this.loggedIn) {
      this._router.navigate(['/login'], { queryParams: { returnUrl: '/' }})
      return;
    }
    this._favService.toggleFav(cid).subscribe(
      (res) => {
        if (res['success']) {
          this.courses.forEach((item, index) => {
            if (this.courses[index]._id === cid) {
              this.courses[index].isFavorited = !this.courses[index].isFavorited;
            }
          })
          this._favService.ToggleFavAndupdateInLocalStorage(cid);
        }
      }, (error) =>{
      }
    )
  }
  removeFavoriteOption() {
    this.displayOptions.forEach((option, index) => {
      if (this.displayOptions[index].value === 'favorites') {
        this.displayOptions.splice(index,1);
      }
    });
  }

  runCheckFavorites(docs){
    for ( const doc of docs) {
      if (this.currentUser && this.currentUser.favorites != []) {
        if (this.currentUser.favorites.indexOf(doc._id) != -1) {
          doc.isFavorited = true;
        }
        else {
          doc.isFavorited = false;
        }
      }
    }
  }
}
