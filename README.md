# video-call

Experimental WebRTC videoconferencing app (Work In Progress)

## Client

### Environment

Copy from example and fill .env file

```
VITE_API_URI=
```

#### Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

#### Development Server

```bash
pnpm run dev
```

#### Production

Build the application for production:

```bash
pnpm run build
```

## API

### Environment

Copy from example and fill .env file

```
PORT=
CLIENT_URI=
API_URI=
DATABASE_URL=
NODE_ENV=

# JWT
JWT_ACCESS_SECRET=
JWT_ISSUER=
JWT_AUDIENCE=

#Email
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=[true || false]
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

#### Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

#### Development Server

```bash
pnpm run dev
```
