# Streamkit - Anime Embed API

A production-ready API for embedding anime players with HLS streaming, multi-language subtitles, and DevTools protection.

## Features

- 🎬 **Embed Player** - Turn AniList/MAL IDs into fully-featured video players
- 🌐 **Multi-language Subtitles** - Support for 9 languages
- 🎨 **Multi-quality Streaming** - Adaptive HLS (1080p, 720p, 480p)
- 🔒 **DevTools Protection** - Prevent network request sniffing in production
- ⚡ **Edge Runtime** - Fast, scalable proxy with no timeouts
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd anime-embed-api
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your configuration:
```env
# Required: Get your JW Player license key from https://www.jwplayer.com/
JW_PLAYER_KEY=your_license_key_here

# Optional: Change the port (default: 3000)
PORT=3000
```

5. Run the development server:
```bash
pnpm dev
```

To use a custom port:
```bash
# On Linux/Mac
PORT=4000 pnpm dev

# On Windows PowerShell
$env:PORT=4000; pnpm dev

# Or edit .env.local and set PORT=4000
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port for the development/production server |
| `JW_PLAYER_KEY` | **Yes** | - | Your JW Player license key |
| `SOURCE_ORIGIN` | No | `https://player.yenime.net/anime-src` | Anime source API endpoint |
| `SOURCE_REFERER` | No | `https://yenime.net/` | Referer header for source requests |
| `NODE_ENV` | No | `development` | Environment (development/production) |

## API Usage

### Embed Endpoint

```
GET /api/embed?anilistId={id}&episode={number}&audio={sub|dub}&autoplay={true|false}
```

**Parameters:**

- `anilistId` or `malId` (required) - Anime ID from AniList or MyAnimeList
- `episode` (optional, default: 1) - Episode number
- `audio` (optional, default: sub) - Audio preference (`sub` or `dub`)
- `autoplay` (optional, default: false) - Enable autoplay

**Example:**

```html
<iframe
  src="http://localhost:3000/api/embed?anilistId=154587&episode=1&audio=sub"
  allow="autoplay; fullscreen"
  allowfullscreen
  style="width: 100%; height: 100vh; border: none;"
></iframe>
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── embed/       # Main embed player endpoint
│   │   └── proxy/       # HLS proxy with smart fallback
│   ├── docs/            # API documentation page
│   ├── page.tsx         # Homepage with playground
│   └── globals.css      # Global styles
├── components/
│   └── Header.tsx       # Reusable navigation header
└── .env.local          # Environment variables (not committed)
```

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard:
   - `JW_PLAYER_KEY`
   - `NODE_ENV=production`
4. Deploy!

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t anime-embed-api .
docker run -p 3000:3000 --env-file .env.local anime-embed-api
```

## Development

### Start Development Server

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Features in Detail

### Smart Proxy System

The API includes a smart proxy that:
- Detects and extracts original CDN URLs from neonflix proxies
- Falls back to neonflix if direct CDN fails
- Supports Range requests for seeking
- Handles HLS playlists and segments intelligently

### DevTools Protection

In production mode, the embed player includes:
- Right-click disabled
- F12/DevTools keyboard shortcuts blocked
- Console auto-clearing
- Debugger prevention

### Multi-language Support

Subtitles available in:
- English
- Arabic
- French
- German
- Italian
- Portuguese (Brazil)
- Spanish
- And more...

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.
