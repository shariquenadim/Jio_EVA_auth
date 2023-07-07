import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './MyComponents/login/login.component';
import { SignupComponent } from './MyComponents/signup/signup.component';
import { DashboardComponent } from './MyComponents/dashboard/dashboard.component';
import { ForgetPasswordComponent } from './MyComponents/forget-password/forget-password.component';
import { ResetPasswordComponent } from './MyComponents/reset-password/reset-password.component';

const routes: Routes = [
  {
    path:'',redirectTo:'signup',pathMatch:'full'
  },
  {
    path:'login',component:LoginComponent
  },
  {
    path:'signup',component:SignupComponent
  },
  {
    path:'dashboard',component:DashboardComponent
  },
  {
    path:'forget',component:ForgetPasswordComponent
  },
  {
    path:'reset-password',component:ResetPasswordComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
