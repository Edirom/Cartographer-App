# check=skip=SecretsUsedInArgOrEnv
# ---- 1) Base build stage ----
FROM node:24-alpine AS base
WORKDIR /app

# Install deps first (cache-friendly)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --legacy-peer-deps; \
    else \
      npm install --legacy-peer-deps; \
    fi

# Bring in the full source (SPA + docs)
COPY . .

# ---- 2) Build frontend (SPA) ----
FROM base AS build-app

# Build-time only: vue.config.js (DefinePlugin) inlines these into the bundle.
# They hold placeholder strings that 40-create-ghcred.sh replaces with real
# values at container start. NOTE: the runtime stage below declares variables
# with the SAME names — there they carry the real values. The stages are
# isolated; the name reuse is intentional (one variable vocabulary), but don't
# confuse build-time placeholder with runtime real value.
ENV GH_APP_CLIENT_ID=__GH_CLIENT_ID__
ENV GH_APP_CALL_BACK=__GH_CALLBACK_URL__
RUN npm run build

# ---- 3) Build VuePress docs ----
FROM base AS build-docs
RUN npm run docs:build

# ---- 4) Runtime: Nginx ----
FROM nginx:alpine

# Default public path; can be overridden at runtime
ENV APP_PUBLIC_PATH=""
# GitHub OAuth credentials — injected at runtime via 40-create-ghcred.sh
ENV GH_APP_CLIENT_ID=""
ENV GH_APP_CALL_BACK=""
ENV GH_APP_CLIENT_SECRET=""

# Imprint & collaborators — optional runtime overrides, injected by
# 50-configure-app.sh. Empty = show the built-in defaults.
ENV APP_IMPRINT_INSTITUTION="" \
    APP_IMPRINT_STREET="" \
    APP_IMPRINT_ZIP="" \
    APP_IMPRINT_CITY="" \
    APP_IMPRINT_COUNTRY="" \
    APP_IMPRINT_PHONE="" \
    APP_IMPRINT_CONTACT_PERSON="" \
    APP_IMPRINT_EMAIL="" \
    APP_IMPRINT_LINK="" \
    APP_COLLABORATORS=""

# Copy final single-file nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Startup scripts (run in alphabetical order by the nginx entrypoint):
#   40-create-ghcred.sh  — GitHub OAuth credential injection
#   50-configure-app.sh  — public path, imprint, collaborators
COPY 40-create-ghcred.sh /docker-entrypoint.d/40-create-ghcred.sh
COPY 50-configure-app.sh /docker-entrypoint.d/50-configure-app.sh
RUN chmod +x /docker-entrypoint.d/40-create-ghcred.sh /docker-entrypoint.d/50-configure-app.sh

# Copy built files into container
COPY --from=build-app  /app/dist/                 /usr/share/nginx/html/
COPY --from=build-docs /app/docs/.vuepress/dist/  /usr/share/nginx/html/docs/

# Built-in logos under a stable, un-hashed path so APP_COLLABORATORS can
# reference them, e.g.:
#   /myAppPlaceholder/logos/zenmem_logo_de_einfarbig_ultrablau.png
#   /myAppPlaceholder/logos/NFDI4C_Logo_DyptichText.png
COPY --from=build-app /app/src/assets/logos/ /usr/share/nginx/html/logos/

EXPOSE 80