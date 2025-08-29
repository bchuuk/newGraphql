// README.md

# Apollo GraphQL Server

Full-featured GraphQL server with authentication, real-time subscriptions, and admin panel.

## Features

- 🔐 JWT Authentication with social login (Google, Apple)
- 👥 User management with roles (USER, ADMIN, GOD)
- 📝 Post creation with images and comments
- 💖 Like system and social following
- 🔔 Real-time notifications with push support
- 👮 Admin panel with user management
- 🚨 Report system for content moderation
- 📊 Analytics and system monitoring
- 🎯 GraphQL subscriptions for real-time features

## Quick Start

### 1. Installation

```bash
npm install
# or
pnpm install
```

### 2. Database Setup

```bash
# Setup PostgreSQL database
# Update DATABASE_URL in .env file

# Push database schema
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed database with test data
npm run db:seed
```

### 3. Environment Variables

```bash
cp .env.example .env
# Update the variables with your values
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start at: http://localhost:4000/graphql

## Default Users

After seeding, you can login with:

- **God**: god@example.com / GodPassword123!
- **Admin**: admin@example.com / AdminPassword123!
- **Users**: user1@example.com to user10@example.com / Password123!

## GraphQL Playground

Visit http://localhost:4000/graphql to access GraphQL Playground

Example queries:

```graphql
# Login
mutation Login {
  login(input: { email: "user1@example.com", password: "Password123!" }) {
    success
    token
    user {
      id
      username
      role
    }
  }
}

# Get feed (requires authentication)
query Feed {
  feed(first: 10) {
    nodes {
      id
      content
      author {
        username
      }
      likeCount
      commentCount
    }
  }
}
```

## API Endpoints

- `POST /graphql` - GraphQL API
- `GET /graphql` - GraphQL Playground
- `POST /upload` - File upload
- `GET /health` - Health check

## Project Structure

```
src/
├── main.js              # Server entry point
├── lib/                 # Utilities
│   ├── prisma.js       # Prisma client
│   ├── googleAuth.js   # Google authentication
│   └── appleAuth.js    # Apple authentication
├── middleware/          # GraphQL middleware
│   └── auth.js         # Authentication helpers
├── resolvers/          # GraphQL resolvers
│   ├── admin/          # Admin operations
│   ├── auth/           # Authentication
│   ├── god/            # Super admin operations
│   ├── notification/   # Push notifications
│   ├── post/           # Post management
│   └── user/           # User operations
├── schema/             # GraphQL schema
│   └── typeDefs.js     # Type definitions
scripts/
├── generateSchema.js   # Schema generator
└── seed.js            # Database seeder
prisma/
└── schema.prisma      # Database schema
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database
- `npm run db:reset` - Reset and seed database
- `npm run db:studio` - Open Prisma Studio
- `npm run generate:schema` - Generate GraphQL schema

## Role Permissions

### USER

- Create, update, delete own posts
- Like and comment on posts
- Follow other users
- Receive notifications

### ADMIN

- All USER permissions
- Block/unblock users
- Delete any posts
- Resolve reports
- View admin statistics

### GOD

- All ADMIN permissions
- Create/manage admins
- System maintenance mode
- Database operations
- View system metrics

## Real-time Features

WebSocket subscriptions are available at `ws://localhost:4000/graphql`

Example subscriptions:

```graphql
subscription NewNotification {
  notificationAdded(userId: "user-id") {
    id
    message
    type
    fromUser {
      username
    }
  }
}

subscription PostLiked {
  postLiked(postId: "post-id") {
    user {
      username
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License
