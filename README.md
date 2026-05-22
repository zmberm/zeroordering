# Zero Ordering prototype

This workspace currently contains three web app surfaces:

- `/` customer direct-ordering menu
- `/dashboard/` one-takeaway control center
- `/master/` Zero Ordering multi-takeaway operations dashboard

## Current prototype workflows

- Menu items, prices, live/paused state, option groups, choices, add-on prices
- Customer basket with item customisations, delivery or collection, promo entry, timing, payment choice, notes, order tracking stub
- Takeaway controls for orders, hours, holiday closures, delivery zones, fulfilment settings, and promotions
- Master portfolio view with takeaway onboarding, live/paused stores, weekly orders, revenue, and saved commission figures

The prototype data/API boundary lives in `menu-api.js`. It uses browser storage locally and is shaped so it can be replaced by backend endpoints for:

- takeaway profile and menu settings
- orders and order status updates
- master takeaway portfolio and analytics

## Production backend still needed

The front-end flows are not a production ordering platform until a backend provides authentication, database storage, payment processing, order dispatch, permissions, audit logs, customer notifications, and real analytics.
