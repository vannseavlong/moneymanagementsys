# MMMS - Monthly Money Management System

A modern, full-stack web application for personal budget tracking with multi-currency support (USD & KHR) and Google Workspace integration for data storage.

## 🚀 Features

### Frontend (React + Vite + TypeScript)
- **Modern UI**: Built with React, Vite, and shadcn/ui components
- **Mobile-Responsive**: Tailwind CSS for mobile-first design
- **Multi-Currency Support**: USD and Cambodian Riel (KHR) with real-time conversion
- **Google OAuth**: Secure authentication using Google accounts
- **Real-time Calculations**: Instant budget calculations and remaining money display
- **Telegram Integration**: Send budget summaries directly to Telegram

### Backend (Node.js + Express + TypeScript)
- **RESTful API**: Clean API design with proper error handling
- **Google Workspace Integration**: Uses Google Sheets API for data storage
- **Rate Limiting**: Protection against API abuse
- **Currency Conversion**: Built-in USD/KHR conversion utilities
- **Telegram Bot Integration**: Send formatted budget summaries

### Database (User-Owned Google Workspace)
- **Privacy-First**: Data stays in user's Google account
- **No External Database**: Zero database costs for developers
- **Automatic Backup**: Google Sheets provides built-in backup and sync
- **Shareable**: Users can share their budget sheets using Google's native sharing

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for component library
- **React Hook Form** with Zod validation
- **Axios** for API communication
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Google APIs** (Sheets, Drive, OAuth2)
- **Zod** for request validation
- **Helmet** for security
- **CORS** for cross-origin requests
- **Rate limiting** for API protection

### DevTools
- **Turborepo** for monorepo management
- **ESLint** for code linting
- **TypeScript** for type checking

## 📱 Key Features

### Multi-Currency Budget Management
- Support for USD ($) and Cambodian Riel (៛)
- Real-time currency conversion
- Mixed currency spending items
- Automatic total calculations in base currency

### Google Workspace Integration
- Secure OAuth2 authentication
- Automatic Google Sheets creation
- Real-time data synchronization
- User owns all data

### Telegram Integration
- Send formatted budget summaries
- Include spending breakdown
- Visual warnings for budget overruns
- Monthly tracking

### Mobile-First Design
- Responsive layout for all screen sizes
- Touch-friendly interface
- Fast loading on mobile networks
- Progressive Web App ready

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+
- Google Cloud Platform account
- Telegram Bot Token (optional)

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Set up environment variables**

Backend (`apps/backend/.env`):
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here  
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

3. **Google Cloud Setup**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Sheets API and Google Drive API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback` (development)
     - Your production callback URL

4. **Telegram Bot Setup (Optional)**
   - Message @BotFather on Telegram
   - Create a new bot with `/newbot`
   - Copy the provided token

### Development

```bash
# Start both frontend and backend
npm run dev

# Start individual services
npm run dev --filter=frontend
npm run dev --filter=backend
```

### Production Build

```bash
npm run build
```

## 📊 API Endpoints

### Authentication
- `GET /api/auth/google/url` - Get Google OAuth URL
- `POST /api/auth/google/callback` - Handle OAuth callback
- `POST /api/auth/refresh` - Refresh access token

### Budget Management
- `POST /api/budget/spreadsheet/create` - Create new budget spreadsheet
- `POST /api/budget/entry` - Save budget entry
- `GET /api/budget/entries/:spreadsheetId` - Get budget entries
- `DELETE /api/budget/entry/:spreadsheetId/:rowIndex` - Delete entry

### Currency
- `GET /api/currency/rates` - Get exchange rates
- `POST /api/currency/convert` - Convert currencies
- `GET /api/currency/supported` - Get supported currencies

### Telegram
- `POST /api/telegram/send` - Send message to Telegram
- `POST /api/telegram/send-budget-summary` - Send formatted budget summary

## 🔒 Security Features

- **OAuth2 Authentication**: Secure Google login
- **Rate Limiting**: API abuse protection
- **CORS Configuration**: Cross-origin request security
- **Helmet**: Security headers
- **Input Validation**: Zod schema validation
- **Environment Variables**: Secure credential storage

## 🌍 Multi-Currency Support

The application supports:
- **USD (United States Dollar)**: Primary international currency
- **KHR (Cambodian Riel)**: Local Cambodian currency

Features:
- Real-time conversion between currencies
- Mixed currency transactions
- Automatic total calculations
- Rate updates (currently static, can be extended to use live rates)

## 📱 Mobile Optimization

- **Responsive Design**: Works on all screen sizes
- **Touch Interfaces**: Mobile-friendly interactions
- **Fast Loading**: Optimized for mobile networks
- **App-like Experience**: Progressive Web App ready

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For support, please create an issue in the repository or contact the development team.

## 🚀 Future Enhancements

- [ ] Live currency exchange rates
- [ ] More currencies support
- [ ] Advanced reporting and analytics
- [ ] Budget categories and tags
- [ ] Recurring expense tracking
- [ ] Multi-month comparison
- [ ] Export to PDF/Excel
- [ ] Dark mode support
- [ ] Offline capability
- [ ] Push notifications

---

**MMMS** - Making money management simple and secure with privacy-first approach! 💰📊