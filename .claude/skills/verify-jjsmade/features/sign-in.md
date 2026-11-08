# Sign in

Every page except `/login` requires the admin password. A correct password stores `jjs_auth=true` in localStorage and opens the dashboard. A wrong one shows an inline error.

## Sub-features

- `signin-redirect`: a protected route sends a signed-out browser to `/login`.
- `signin-wrong`: a wrong password shows `Incorrect password. Please try again.`
- `signin-ok`: the correct password lands on the dashboard.
- `signout`: `Sign out` in the top bar returns to `/login`.

## How to get to it (user POV)

- Open any URL while signed out.
- Choose `Sign out` in the top bar, then sign in again.

## Driving it with verify.mjs

Preconditions:

- Baseline. The harness password is `verify-password`.

- **Redirect.** Open the order form while signed out. Run `V browser goto --route orders/new` and `V browser url --matches '^login$'`. The command prints `login`.
- **Wrong password.** Run `V browser fill --label Password --value nope` and `V browser click --role button --name "Sign in"`, then `V browser expect --text "Incorrect password. Please try again."`.
- **Sign in.** Run `V browser fill --label Password --value verify-password`, `V browser click --role button --name "Sign in"`, and `V browser url --matches '^$'`. The command prints an empty path, which is the dashboard.
- **Sign out.** Run `V browser click --role button --name "Sign out"` and `V browser url --matches '^login$'`.
- **Proof.** Run `V browser snapshot --path sign-in/dashboard.aria.txt` after signing in. The snapshot shows the sidebar links `Dashboard`, `Orders`, and `Customers`.

## Gotchas

- Auth is only a localStorage flag. A new `up` gives a fresh Chrome profile, so you must sign in again.
- The password is checked by the `auth:validatePassword` action against `ADMIN_PASSWORD` on the local deployment. If sign-in fails with `ADMIN_PASSWORD env variable not set`, `up` did not finish. Run `V doctor`.
