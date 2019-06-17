import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CarDetailsService } from '../carDetails.service';
// import { Router } from '@angular/Router';

@Component({
  selector: 'app-show-cars',
  templateUrl: './show-cars.component.html',
  styleUrls: ['./show-cars.component.css']
})
export class ShowCarsComponent implements OnInit {

  appUserId: any;
  roleOfLoggedInUser: any;
  cars: any;
  constructor(private service: CarDetailsService, private router: Router) { }

  ngOnInit() {
    this.showCars();
  }

  showCars() {
    let token = localStorage.getItem('token') ? localStorage.getItem('token'): null;
    this.appUserId = token ? JSON.parse(token).appUserId : null;
    this.roleOfLoggedInUser = token ? JSON.parse(token).role : null;

    if(this.roleOfLoggedInUser !== 'ADMIN') {
        this.service.listCars(this.appUserId).toPromise()
        .then((response:any)=>{
          this.cars = JSON.parse(response['_body']).data;
        })
    }
};
}