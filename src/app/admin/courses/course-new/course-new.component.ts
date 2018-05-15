import { Course } from './../../../_models/course';
import { ActivatedRoute, Data } from '@angular/router';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Category } from '../../../_models/category';
import { UcFirstPipe } from 'ngx-pipes';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgForm } from '@angular/forms';
import { ConfirmService } from '../../../_services/confirm.service';

@Component({
  selector: 'app-course-new',
  templateUrl: '../shared/course-new.component.html',
  styleUrls: ['./course-new.component.scss']
})
export class CourseNewComponent implements OnInit, OnDestroy {

  app = 'add course';
  sub: Subscription;
  categories: Category [] = [];
  tags: string [] = [];
  course: Course;
  courseDate: NgbDateStruct;
  public options = {
    placeholder: ''
};
  constructor(
    private _route: ActivatedRoute,
    private ucfirstPipe: UcFirstPipe,
    private _confirmService: ConfirmService) {
    this.course = new Course();
   }

  ngOnInit() {
    this.sub = this._route.data.subscribe(
      (data: Data) => {
        this.categories = data.categories;
        for (const category of this.categories) {
          category.name = this.ucfirstPipe.transform(category.name);
        }
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  onSubmit(f: NgForm) {
    console.log('onSubmit');
    this._confirmService.open('Do you want to submit?').then(
      () => {
        console.log('ok');
      }).catch( () => {
        // Reject
        console.log('no');
    });
  }
}