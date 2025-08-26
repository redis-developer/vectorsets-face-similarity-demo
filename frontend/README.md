# Face Similarity Search App

A Next.js application that allows users to upload or select photos and find similar faces from a celebrity database using face similarity matching.

## Features

- Upload custom photos for face similarity search
- Choose from predefined sample images
- Real-time face matching with progress indication
- Display of top match and additional results
- Metadata filtering capabilities
- Responsive design

## Technologies

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: SASS/SCSS modules
- **State Management**: React Context API
- **Image Handling**: Next/Image for optimization
- **File Upload**: react-dropzone
- **Icons**: Font Awesome

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd face-similarity-search
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
├── components/             # React components
│   ├── LeftSidePanel/     # Left sidebar components
│   ├── MainPanel/         # Main content components
│   └── shared/            # Shared/reusable components
├── contexts/              # React Context providers
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── styles/                # Global SCSS styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
