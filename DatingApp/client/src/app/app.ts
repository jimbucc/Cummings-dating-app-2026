import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  // Inject HttpClient into the component
  private http = inject(HttpClient);
  protected readonly title = 'Dating App';
  protected members =  signal<any>([]);
  
  async ngOnInit() {
    // returns an Observable
    // this.http.get("https://localhost:5001/api/members")
    //   .subscribe({  // need to subscribe because of async nature of returned Promise
    //     next: response => this.members.set(response),
    //     error: error => console.log(error),
    //     complete: () => console.log('Completed the http request') // automatically unsubscribed for http request
    //   })
    this.members.set(await this.getMembers())
  }

  async getMembers() {
    try {
      return lastValueFrom(this.http.get('https://localhost:5001/api/members'));     
    } catch (error) {
      console.log(error)
      throw error;
    }
  }
}
