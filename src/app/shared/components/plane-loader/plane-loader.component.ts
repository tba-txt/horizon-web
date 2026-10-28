import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plane-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plane-loader.component.html',
  styleUrls: ['./plane-loader.component.scss']
})
export class PlaneLoaderComponent {
  @Input() size: number = 130;
}
