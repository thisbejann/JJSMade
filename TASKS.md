# Personal + Orders Fix Tasks

- [x] 1. Make header `New Item` route context-aware (`/personal/new` in Personal section, `/orders/new` elsewhere).
- [x] 2. Add Personal page titles in TopBar for list/new/edit/detail routes.
- [x] 3. Make `Has Local Shipping` and `Bought by Forwarder` mutually exclusive in Personal form.
- [x] 4. Make `Has Local Shipping` and `Bought by Forwarder` mutually exclusive in Orders form.
- [x] 5. Change forwarder buy commission formula to exactly 10% of item price (remove `+ 10 CNY`) in frontend computed costs.
- [x] 6. Change forwarder buy commission formula to exactly 10% of item price (remove `+ 10 CNY`) in backend derived-field helper.
- [x] 7. Enforce forwarder-buy conversion to use only `Forwarder Buy Service Rate (CNY to PHP)` in backend calculations.
- [x] 8. Update form UI copy from `10% of item + 10 CNY` to `10% of item`.
- [ ] 9. Manual QA: verify Personal create/edit flow with forwarder-buy on/off and local shipping on/off combinations.
- [ ] 10. Manual QA: verify Orders create/edit flow with forwarder-buy on/off and local shipping on/off combinations.

# Order Detail UX Tasks

- [x] 1. Move Quick Actions status control to a prominent top section on the order detail page.
- [x] 2. When status changes to `QC Sent`, open a popup to upload QC photos and set QC status without entering edit mode.
- [x] 3. Add progressive step popups for later statuses (`Item Shipout`, `Arrived in PH`, `Delivered`) to collect required details inline.
     np
