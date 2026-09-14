# GitHub Authentication

Cartographer supports two GitHub authentication mechanisms. Browser builds use
OAuth redirect authentication, while Android and desktop Tauri builds use
GitHub Device Flow.

## Browser OAuth flow

`src/views/Auth.vue` provides the `AuthCallback` view mounted at `/callback`.
The flow is:

1. `auth/login` generates a random OAuth `state`, stores it in
   `sessionStorage`, and redirects the browser to GitHub.
2. GitHub redirects to `/callback` with an authorization `code` and `state`.
3. `AuthCallback` verifies that the returned state matches the stored value.
4. The view dispatches `auth/authenticate` with the authorization code.
5. The store calls the same-origin `/auth` endpoint. The development proxy or
   nginx forwards the request to GitHub and injects the client secret on the
   server side.
6. The access token is stored in `sessionStorage`, the user profile is loaded,
   and the router returns to the home page.

Authentication errors are displayed in the callback view. The token has a
one-hour local expiry and is removed when it expires or the user logs out.

### Browser configuration

| Variable | Purpose |
| --- | --- |
| `GH_APP_CLIENT_ID` | Public GitHub OAuth App client ID |
| `GH_APP_CALL_BACK` | Registered browser callback URL |
| `GH_APP_CLIENT_SECRET` | Server-side token-exchange secret; never expose it in the browser bundle |

## Native Tauri Device Flow

Android and desktop Tauri builds cannot rely on the browser callback flow. The
`auth/loginDevice` action instead uses GitHub Device Flow:

1. `MainMenu.vue` detects the Tauri runtime and dispatches `auth/loginDevice`.
2. The store invokes the Rust `gh_device_code` command.
3. The command requests a device code from
   `https://github.com/login/device/code` with the `repo user:email` scopes.
4. The store publishes the verification URL and user code through
   `auth.state.devicePrompt`.
5. `MainMenu.vue` displays the code and a copy button while the user authorizes
   the request at <https://github.com/login/device>.
6. The store periodically invokes `gh_poll_token`. The Rust command polls
   GitHub's access-token endpoint until authorization succeeds.
7. The token is stored, `auth/fetchUser` loads the authenticated profile, and
   the device prompt is cleared after successful authorization.

GitHub may return `authorization_pending` while waiting or `slow_down` when the
polling interval must be increased. The store handles both responses.

### Native configuration

1. Enable **Device Flow** in the GitHub OAuth App settings.
2. Set `GH_APP_CLIENT_ID` in `.env.local` before running or building Tauri.
3. Rebuild the native application when changing the client ID because it is
   included at build time.

Native builds do not require `GH_APP_CLIENT_SECRET` or `GH_APP_CALL_BACK`.
Never bundle a GitHub client secret into a native application.

## Relevant files

| File | Responsibility |
| --- | --- |
| `src/views/Auth.vue` | Validates and completes the browser OAuth callback |
| `src/store/modules/auth.js` | Manages browser and Device Flow authentication state |
| `src/components/MainMenu.vue` | Starts login and displays the native device prompt |
| `src-tauri/src/lib.rs` | Sends native Device Flow requests to GitHub |
| `vue.config.js` | Configures browser OAuth values and the development token proxy |
| `nginx.conf` | Performs the production browser token exchange |

## Security considerations

- Browser OAuth state is validated to reduce CSRF risk.
- The browser client secret remains in the development proxy or nginx and is
  never sent in the frontend bundle.
- Native applications use Device Flow and must not contain a client secret.
- Users should enter a device code only when they initiated login in
  Cartographer.
- Access tokens are stored in `sessionStorage`, cleared on logout, and given a
  one-hour local expiry.
