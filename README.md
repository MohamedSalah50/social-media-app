# 📱 Social Media Platform API

A full-featured **Social Media Platform** REST API built with **Express.js** and **TypeScript**, featuring real-time chat, GraphQL, JWT authentication, AWS S3 media storage, 2FA, friend system, and role-based access control.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Express.js (TypeScript) |
| Database | MongoDB + Mongoose |
| Authentication | JWT (Access + Refresh Tokens) |
| Real-Time | Socket.IO |
| API Styles | REST + GraphQL |
| Cloud Storage | AWS S3 |
| Email | Nodemailer + Event Emitter |
| OAuth | Google OAuth2 |
| Encryption | bcrypt + AES |
| Containerization | Docker + Docker Compose |

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_S3-FF9900?style=flat&logo=amazons3&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

---

## 📁 Project Structure

```
src/
├── db/              # Mongoose models + generic repository pattern
├── middleware/      # Auth, validation, error handling
├── modules/
│   ├── auth/        # Authentication
│   ├── user/        # User profile & social features
│   ├── post/        # Posts & likes
│   ├── comment/     # Comments & replies
│   ├── chat/        # Real-time chat (REST + Socket.IO)
│   └── gateway/     # Socket.IO gateway
└── utils/           # Security, email, multer, S3 helpers
```

---

## 🔐 Authentication APIs `POST|PATCH /auth`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register with email & password | Public |
| POST | `/auth/signup-with-gmail` | Register via Google OAuth2 | Public |
| POST | `/auth/login-with-gmail` | Login via Google OAuth2 | Public |
| POST | `/auth/login` | Login (supports 2FA flow) | Public |
| POST | `/auth/confirmation-login` | Confirm 2FA OTP to complete login | Public |
| POST | `/auth/confirmEmail` | Confirm email via OTP | Public |
| PATCH | `/auth/send-forgot-password` | Send forgot password OTP | Public |
| PATCH | `/auth/verify-forgot-password` | Verify forgot password OTP | Public |
| PATCH | `/auth/reset-forgot-password` | Reset password via OTP | Public |

**Security features:**
- bcrypt password hashing
- AES phone number encryption
- OTP-based email confirmation
- `changeCredentialsTime` invalidates all old tokens on password/email change
- 2FA via email OTP — login sends OTP, `/confirmation-login` completes it

---

## 👤 User APIs `/user`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/user` | Get own profile + groups | 🔒 |
| GET | `/user/dashboard` | Admin dashboard (all users & posts) | 🔒 Admin |
| PATCH | `/user/:userId/role` | Change user role | 🔒 Admin |
| PATCH | `/user/update-basic-info` | Update name, gender, phone | 🔒 |
| PATCH | `/user/update-password` | Change password | 🔒 |
| PATCH | `/user/update-email` | Request email update (sends OTPs to old & new email) | 🔒 |
| PATCH | `/user/confirm-email-update` | Confirm email update with both OTPs | 🔒 |
| PATCH | `/user/profile-image` | Upload profile image (S3 signed URL) | 🔒 |
| PATCH | `/user/profile-cover-image` | Upload cover images to S3 | 🔒 |
| POST | `/user/refresh-token` | Refresh access token | 🔒 Refresh Token |
| POST | `/user/logout` | Logout (single session or all devices) | 🔒 |
| DELETE | `/user/:userId/freeze-account` | Freeze account | 🔒 |
| PATCH | `/user/:userId/restore-account` | Restore frozen account | 🔒 Admin |
| DELETE | `/user/:userId/hard-delete` | Permanently delete account | 🔒 Admin |
| POST | `/user/2fa-enaple-request` | Request 2FA enable OTP | 🔒 |
| POST | `/user/2fa-enaple-verify` | Confirm and enable 2FA | 🔒 |

### Friend System

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/user/:userId/friend-request` | Send friend request | 🔒 |
| PATCH | `/user/accept-friend-request/:requestId` | Accept friend request | 🔒 |
| PATCH | `/user/delete-friend-request/:requestId` | Delete/cancel friend request | 🔒 |
| PATCH | `/user/block-user/:userId` | Block a user | 🔒 |
| DELETE | `/user/unfirend-user/:userId` | Unfriend a user | 🔒 |

---

## 📝 Post APIs `/post`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/post` | Get posts feed (public + friends + tagged) with pagination | 🔒 |
| GET | `/post/:postId` | Get post by ID | 🔒 |
| POST | `/post/create-post` | Create post with images (S3, max 2) | 🔒 |
| PATCH | `/post/:postId` | Update post content/attachments/tags | 🔒 Owner |
| PATCH | `/post/:postId/like` | Like or unlike a post | 🔒 |
| DELETE | `/post/:postId/freeze` | Freeze post | 🔒 Owner |
| DELETE | `/post/:postId/hard-delete` | Permanently delete (must be frozen first) | 🔒 Owner |

**Post availability:** `public` / `friends` / `onlyMe` — feed filters accordingly.

**Like notification:** real-time Socket.IO event sent to post owner on like.

---

## 💬 Comment APIs `/post/:postId/comment`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/:commentId` | Get comment by ID | 🔒 |
| GET | `/:commentId/comment-with-reply` | Get comment + its replies | 🔒 |
| POST | `/` | Create comment with images (S3, max 2) | 🔒 |
| PATCH | `/:commentId/update` | Update comment content/attachments/tags | 🔒 Owner |
| POST | `/:commentId/create-reply-on-comment` | Reply to a comment | 🔒 |
| DELETE | `/:commentId/freeze` | Freeze comment | 🔒 Owner |
| DELETE | `/:commentId/hard-delete` | Permanently delete (must be frozen first) | 🔒 Owner |

---

## 💬 Chat APIs

### REST `/user/:userId/chat`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get private chat history with a user (paginated) | 🔒 |
| GET | `/group/:groupId` | Get group chat history (paginated) | 🔒 |
| POST | `/group` | Create a chat group (friends only, with optional image) | 🔒 |

### Socket.IO Events (Real-Time)

Connect: `ws://localhost:3000`
Auth: pass token via `handshake.auth` or `handshake.headers.authorization`

#### Events to Emit (Client → Server)

| Event | Payload | Description |
|---|---|---|
| `sendMessage` | `{ sendTo: string, content: string }` | Send private message to a friend |
| `sendGroupMessage` | `{ groupId: string, content: string }` | Send message to a group |
| `join_room` | `{ roomId: string }` | Join a group chat room |
| `typing` | `{ sendTo: string }` | Notify friend that you're typing |
| `sayHi` | `string` | Basic ping event |

#### Events to Listen (Server → Client)

| Event | Description |
|---|---|
| `newMessage` | Incoming private or group message |
| `successMessage` | Confirmation that your message was sent |
| `userTyping` | Someone is typing to you |
| `likePost` | Real-time notification when your post is liked |
| `custom_error` | Error event from server |

**Business Rules:**
- Private messages: only between **friends**
- Group messages: only if you are a **participant** of the group
- Groups can only include friends as participants
- `join_room` required before sending/receiving group messages
- All connected devices receive messages simultaneously via `connectedSocket` Map

---

## 🔮 GraphQL `/graphql`

| Operation | Type | Description |
|-----------|------|-------------|
| `allPosts` | Query | Get paginated posts feed |
| `likePost` | Mutation | Like or unlike a post |
| `allUsers` | Query | Get all users filtered by gender |
| `welcome` | Query | Hello world |

---

## 🗑️ Freeze / Restore / Hard Delete Pattern

Users, Posts, and Comments follow a 3-state lifecycle:

```
Active → freeze() → Frozen → restore() → Active
                  → hard-delete() → Permanently Deleted
```

Hard delete only allowed when document is already frozen.

---

## 🔒 Roles & Permissions

| Role | Description |
|------|-------------|
| `user` | Regular user |
| `admin` | Can ban/freeze users, change roles |
| `superAdmin` | Highest level, cannot be demoted |

---

## ⚙️ Environment Variables

```env
PORT=3000
MONGO_URI=mongodb://...
ACCESS_SECRET=
REFRESH_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
WEB_CLIENT_IDS=
EMAIL_USER=
EMAIL_PASS=
ENCRYPTION_KEY=
```

---

## 🏃 Running the App

```bash
# Clone the repository
git clone https://github.com/MohamedSalah50/social-media-app.git
cd social-media-app

npm install
npm run dev    # Development
npm run build
npm start      # Production

```
### 🐳 Docker

```bash
# Development
docker-compose -f docker-compose-dev.yaml up

# Production
docker-compose -f docker-compose-prod.yaml up -d
```

---

## 📌 Notes

- All paginated endpoints support `?page=1&size=10`
- Images stored on **AWS S3** — old images deleted automatically on update
- Phone numbers AES-encrypted at rest, decrypted on read
- Logout supports single session (revoke token) or all devices (`changeCredentialsTime`)
- Generic `DatabaseRepository<T>` base class used across all repositories


## 📬 Postman Collection

> Test all endpoints with the published collection:

[![Postman](https://img.shields.io/badge/Postman-Collection-FF6C37?style=flat&logo=postman&logoColor=white)](https://documenter.getpostman.com/view/42944447/2sB3BKGUPs)
