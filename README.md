# Specialist Frontend

Frontend for the marketplace of verified professionals in Bariloche.

## Technologies

- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Static typing
- **TailwindCSS** - Utility-first CSS framework
- **TanStack Query** - Remote state management and caching
- **Axios** - HTTP client

## Requirements

- Node.js 20+ (recommended: 20.19.5 or higher)
- npm or yarn

### Node.js Version Management

This project requires Node.js 20+. If you have multiple Node.js versions, we recommend using [nvm](https://github.com/nvm-sh/nvm):

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load nvm in your current session
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify version
node --version  # Should show v20.x.x
```

The project includes a `.nvmrc` file, so you can simply run `nvm use` in the project directory.

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env.local` file in the project root with the following configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Development

### Local Development (without Docker)

```bash
# Make sure you're using Node.js 20+
# If using nvm, run: nvm use

# Start development server
npm run dev

# Or use the helper script (automatically loads nvm)
./scripts/dev.sh
```

The frontend will be available at `http://localhost:3000`

### Development with Docker

```bash
# Build and start container
docker-compose -f docker-compose.dev.yml up --build

# Or in detached mode
docker-compose -f docker-compose.dev.yml up -d --build
```

The frontend will be available at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the application for production
- `npm run start` - Starts the production server
- `npm run lint` - Runs the linter
- `npm run format` - Formats code with Prettier

## Project Structure

```
specialist-fe/
├── app/              # Next.js 15 App Router
│   ├── layout.tsx    # Main layout
│   ├── page.tsx      # Home page
│   ├── providers.tsx # Providers (TanStack Query)
│   └── globals.css   # Global styles with Tailwind
├── components/       # Reusable React components
├── lib/              # Utilities and configurations
│   └── api-client.ts # API client with Axios
├── types/            # TypeScript types
├── public/           # Static files
├── docker-compose.dev.yml
├── Dockerfile.dev
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Features

### Responsive Design
- Mobile-first design with TailwindCSS
- Responsive breakpoints for all devices
- Adaptive components

### TanStack Query
- Automatic request caching
- Smart refetching
- Loading and error states handled automatically
- Configured in `app/providers.tsx`

### Backend Connection
- API client configured in `lib/api-client.ts`
- Interceptors for authentication
- Automatic error handling
- Rewrites configured in `next.config.js` for development

## Backend Separation

This frontend is completely separated from the backend:

- ✅ Independent project with its own `package.json`
- ✅ Separate Docker Compose
- ✅ Independent environment variables (`NEXT_PUBLIC_API_URL`)
- ✅ Independent build and deploy
- ✅ Different port (3001 in Docker, 3000 locally)
- ✅ Independent repository (recommended)

## Production

To build the application for production:

```bash
npm run build
npm run start
```

Optimized files will be generated in the `.next/` folder.

## Notes

- Next.js 15 uses App Router by default
- Public environment variables must start with `NEXT_PUBLIC_`
- TanStack Query is configured with optimized options for development
- TailwindCSS is configured with automatic dark mode
