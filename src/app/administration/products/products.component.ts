import { TableConfigService } from '../shared-admin/services/table-config.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Product } from './../../models/interfaces/products.interface';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { StoreService } from 'src/app/store/store.service';
import { filterConfig } from 'src/app/models/interfaces/default-config.interface';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent implements OnInit, OnDestroy {
  public data$: Product[] = [];
  public copyArr: Product[] = [];
  private baseData: Product[] = [];
  private filterSubj$: Subscription;
  private dataSubj$: Subscription;
  public loading$ = new BehaviorSubject<boolean>(true);
  public pageIndex: number = 0;
  public dataLength: number;

  constructor(
    private storeService: StoreService,
    private tableConfigService: TableConfigService
  ) {}

  ngOnInit(): void {
    this.dataSubj$ = this.storeService.data.subscribe((data) => {
      this.data$ = [...data];
      this.baseData = [...data];
      this.copyArr = [...data];
      this.dataLength = data.length;

      if (this.data$.length) this.loading$.next(false);

      this.firstPage()
    });

    this.filterSubj$ = this.tableConfigService.configuration$.subscribe(
      (elem) => this.changeData(elem)
    );
  }

  changePage(event: any) {
    let index = event.pageIndex;
    let lastIndex = event.previousPageIndex;
    if (index > lastIndex) {
      this.data$ = this.copyArr.slice((lastIndex + 1) * 5, (index + 1) * 5);
      this.pageIndex++;
    }
    if (index < lastIndex) {
      this.data$ = this.copyArr.slice(index * 5, lastIndex * 5);
      this.pageIndex--;
    }
  }

  firstPage() {
    this.data$ = this.copyArr.slice(0, 5)
  }

  changeData(elem: filterConfig) {

    if (elem.search) {
      this.data$ = this.baseData.filter(
        (prod) => prod.name.toLowerCase().search(elem.search.toLowerCase()) >= 0
      );
    }

    if (!elem.search && !elem.price) {
      this.data$ = this.baseData;
    }

    if (elem.price) {
      this.data$ = (elem.search ? this.data$ : this.baseData).filter((prod) =>
        elem.priceSelect == 'more'
          ? prod.price > elem.price
          : prod.price < elem.price
      );
    }

    if (elem.sort && elem.sortFrom) {
      this.data$ = [
        ...(elem.search || elem.price ? this.data$ : this.baseData),
      ];

      this.data$.sort(this.byField(elem.sort, elem.sortFrom));
    }
    this.pageIndex = 0;
    this.dataLength = this.data$.length;
    this.copyArr = [...this.data$]
    this.firstPage()
  }

  byField(field: string, from: string) {
    return (a: any, b: any) =>
      from == 'more'
        ? a[field] < b[field]
          ? 1
          : -1
        : a[field] > b[field]
        ? 1
        : -1;
  }

  ngOnDestroy() {
    this.filterSubj$.unsubscribe();
    this.dataSubj$.unsubscribe();
  }
}
