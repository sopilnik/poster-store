# Security Policy

This is a demo storefront running Stripe in test mode. It keeps no order database of its own. On the card-payment path your order lines and the email you type go to the checkout function and on to Stripe's test mode, where they stay with the checkout session; the name and address you type in the store stay in your browser.

When a test payment succeeds, Stripe notifies a separate demo admin panel built for this store, and the panel fetches the order from Stripe. The panel stores the order lines, the amounts, the delivery type, the email and the customer name that Stripe holds, plus the city and country when Stripe has them. They sit in the store owner's private workspace, which only the owner can open. A daily job replaces the name, email, city and country of each customer first seen 30 or more days ago with invented ones; the orders and amounts stay. The panel's public demo shows these orders only under invented names, emails and places.

If you find a security issue, report it privately through the contact details on https://sopilnik.dev — never in a public issue.

GitHub's private vulnerability reporting form on this repository's Security tab works as well.

Expect a reply within five working days.

This project does not run a bug bounty.
