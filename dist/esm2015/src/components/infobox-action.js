import { Directive, Input, Output, EventEmitter } from '@angular/core';
/**
 * InfoBoxAction renders an action in an info window {@link InfoBox}
 *
 * ### Example
 * ```typescript
 * import {Component} from '@angular/core';
 * import {MapComponent, MapMarkerDirective, InfoBoxComponent, InfoBoxActionDirective} from '...';
 *
 * @Component({
 *  selector: 'my-map-cmp',
 *  styles: [`
 *    .map-container { height: 300px; }
 *  `],
 *  template: `
 *    <x-map [Latitude]="lat" [Longitude]="lng" [Zoom]="zoom">
 *      <x-map-marker [Latitude]="lat" [Longitude]="lng" [Label]="'M'">
 *        <x-info-box>
 *          <x-info-box-action [Label]="actionlabel" (ActionClicked)="actionClicked(this)"></x-info-box-action>
 *        </x-info-box>
 *      </x-map-marker>
 *    </x-map>
 *  `
 * })
 * ```
 *
 * @export
 */
export class InfoBoxActionDirective {
    constructor() {
        /**
         * Emits an event when the action has been clicked
         *
         * @memberof InfoBoxActionDirective
         */
        this.ActionClicked = new EventEmitter();
    }
}
InfoBoxActionDirective.decorators = [
    { type: Directive, args: [{
                selector: 'x-info-box-action'
            },] }
];
InfoBoxActionDirective.propDecorators = {
    Label: [{ type: Input }],
    ActionClicked: [{ type: Output }]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mb2JveC1hY3Rpb24uanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJzcmMvY29tcG9uZW50cy9pbmZvYm94LWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXZFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBCRztBQUlILE1BQU0sT0FBTyxzQkFBc0I7SUFIbkM7UUFhSTs7OztXQUlHO1FBRUgsa0JBQWEsR0FBdUIsSUFBSSxZQUFZLEVBQVEsQ0FBQztJQUVqRSxDQUFDOzs7WUFyQkEsU0FBUyxTQUFDO2dCQUNQLFFBQVEsRUFBRSxtQkFBbUI7YUFDaEM7OztvQkFRSSxLQUFLOzRCQVFMLE1BQU0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEaXJlY3RpdmUsIElucHV0LCBPdXRwdXQsIEV2ZW50RW1pdHRlciB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vKipcbiAqIEluZm9Cb3hBY3Rpb24gcmVuZGVycyBhbiBhY3Rpb24gaW4gYW4gaW5mbyB3aW5kb3cge0BsaW5rIEluZm9Cb3h9XG4gKlxuICogIyMjIEV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7Q29tcG9uZW50fSBmcm9tICdAYW5ndWxhci9jb3JlJztcbiAqIGltcG9ydCB7TWFwQ29tcG9uZW50LCBNYXBNYXJrZXJEaXJlY3RpdmUsIEluZm9Cb3hDb21wb25lbnQsIEluZm9Cb3hBY3Rpb25EaXJlY3RpdmV9IGZyb20gJy4uLic7XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgc2VsZWN0b3I6ICdteS1tYXAtY21wJyxcbiAqICBzdHlsZXM6IFtgXG4gKiAgICAubWFwLWNvbnRhaW5lciB7IGhlaWdodDogMzAwcHg7IH1cbiAqICBgXSxcbiAqICB0ZW1wbGF0ZTogYFxuICogICAgPHgtbWFwIFtMYXRpdHVkZV09XCJsYXRcIiBbTG9uZ2l0dWRlXT1cImxuZ1wiIFtab29tXT1cInpvb21cIj5cbiAqICAgICAgPHgtbWFwLW1hcmtlciBbTGF0aXR1ZGVdPVwibGF0XCIgW0xvbmdpdHVkZV09XCJsbmdcIiBbTGFiZWxdPVwiJ00nXCI+XG4gKiAgICAgICAgPHgtaW5mby1ib3g+XG4gKiAgICAgICAgICA8eC1pbmZvLWJveC1hY3Rpb24gW0xhYmVsXT1cImFjdGlvbmxhYmVsXCIgKEFjdGlvbkNsaWNrZWQpPVwiYWN0aW9uQ2xpY2tlZCh0aGlzKVwiPjwveC1pbmZvLWJveC1hY3Rpb24+XG4gKiAgICAgICAgPC94LWluZm8tYm94PlxuICogICAgICA8L3gtbWFwLW1hcmtlcj5cbiAqICAgIDwveC1tYXA+XG4gKiAgYFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBvcnRcbiAqL1xuQERpcmVjdGl2ZSh7XG4gICAgc2VsZWN0b3I6ICd4LWluZm8tYm94LWFjdGlvbidcbn0pXG5leHBvcnQgY2xhc3MgSW5mb0JveEFjdGlvbkRpcmVjdGl2ZSB7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbGFiZWwgdG8gZGlzcGxheSBvbiB0aGUgYWN0aW9uXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveEFjdGlvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBJbnB1dCgpXG4gICAgTGFiZWw6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEVtaXRzIGFuIGV2ZW50IHdoZW4gdGhlIGFjdGlvbiBoYXMgYmVlbiBjbGlja2VkXG4gICAgICpcbiAgICAgKiBAbWVtYmVyb2YgSW5mb0JveEFjdGlvbkRpcmVjdGl2ZVxuICAgICAqL1xuICAgIEBPdXRwdXQoKVxuICAgIEFjdGlvbkNsaWNrZWQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxufVxuIl19