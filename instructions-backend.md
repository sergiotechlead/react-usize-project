# Backend Technical Requirements — NestJS + PostgreSQL

A complete specification for building the REST API that powers this application. Covers database design, all endpoints, authentication strategy, and implementation steps ordered from easiest to hardest.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Environment Variables](#3-environment-variables)
4. [Database Design](#4-database-design)
5. [Key NestJS Concepts](#5-key-nestjs-concepts)
6. [Implementation Levels](#6-implementation-levels)
7. [Complete API Reference](#7-complete-api-reference)
8. [Authentication Strategy](#8-authentication-strategy)
9. [File Upload Handling](#9-file-upload-handling)
10. [Security Checklist](#10-security-checklist)

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | NestJS 10 | HTTP server, dependency injection, modules |
| Language | TypeScript | Type safety |
| ORM | TypeORM | Database abstraction, migrations |
| Database | PostgreSQL 16 | Persistent storage |
| Auth | JWT (jsonwebtoken) | Stateless authentication tokens |
| Validation | class-validator + class-transformer | Request body validation |
| Password hashing | bcrypt | Secure password storage |
| File uploads | Multer | Excel/CSV ingestion |
| API docs | Swagger (@nestjs/swagger) | Auto-generated documentation |
| Config | @nestjs/config | Environment variable management |

**Install commands:**

```bash
npm install -g @nestjs/cli
nest new backend-app

cd backend-app
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/config
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install bcrypt class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install multer @types/multer
npm install @types/bcrypt @types/passport-jwt --save-dev
```

---

## 2. Project Structure

```
src/
├── app.module.ts              ← root module, imports everything
├── main.ts                    ← entry point, Swagger setup, global pipes
│
├── config/
│   └── database.config.ts    ← TypeORM configuration
│
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── pipes/
│   │   └── parse-uuid.pipe.ts
│   └── interceptors/
│       └── response-transform.interceptor.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   └── dto/
│       ├── register.dto.ts
│       └── login.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── update-user.dto.ts
│       └── change-password.dto.ts
│
├── plans/
│   ├── plans.module.ts
│   ├── plans.controller.ts
│   ├── plans.service.ts
│   └── entities/
│       └── plan.entity.ts
│
├── subscriptions/
│   ├── subscriptions.module.ts
│   ├── subscriptions.controller.ts
│   ├── subscriptions.service.ts
│   └── entities/
│       └── subscription.entity.ts
│
├── api-keys/
│   ├── api-keys.module.ts
│   ├── api-keys.controller.ts
│   ├── api-keys.service.ts
│   └── entities/
│       └── api-key.entity.ts
│
├── models/
│   ├── models.module.ts
│   ├── models.controller.ts
│   ├── models.service.ts
│   └── entities/
│       └── model.entity.ts
│
├── training/
│   ├── training.module.ts
│   ├── training.controller.ts
│   ├── training.service.ts
│   └── entities/
│       └── training-session.entity.ts
│
├── predictions/
│   ├── predictions.module.ts
│   ├── predictions.controller.ts
│   ├── predictions.service.ts
│   └── entities/
│       └── prediction.entity.ts
│
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.controller.ts
│   └── analytics.service.ts
│
├── widget/
│   ├── widget.module.ts
│   └── widget.controller.ts    ← public endpoints, no JWT required
│
└── contact/
    ├── contact.module.ts
    ├── contact.controller.ts
    ├── contact.service.ts
    ├── entities/
    │   └── contact-message.entity.ts
    └── dto/
        └── create-contact.dto.ts
```

---

## 3. Environment Variables

Create a `.env` file at the project root. Never commit this file.

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app_db
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=replace_with_a_long_random_string_minimum_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_long_random_string_for_refresh_tokens
JWT_REFRESH_EXPIRES_IN=7d

# CORS — comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000

# File uploads
MAX_FILE_SIZE_MB=5
UPLOAD_DIR=./uploads
```

**Loading config in NestJS:**

```typescript
// src/app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ... other modules
  ],
})
export class AppModule {}
```

**Accessing a variable anywhere:**

```typescript
// Inject ConfigService in any service
constructor(private config: ConfigService) {}

const secret = this.config.get<string>('JWT_SECRET');
```

---

## 4. Database Design

### 4.1 Entity Relationships Overview

```
users ──< subscriptions >── plans
users ──< api_keys
users ──< models ──< training_sessions
api_keys ──< predictions >── models
contact_messages (standalone)
```

### 4.2 Entity Definitions

---

#### `users`

```typescript
// src/users/entities/user.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })  // never returned in queries by default
  password: string;

  @Column({ length: 120, nullable: true })
  brand_name: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ default: false })
  email_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => Subscription, s => s.user)
  subscriptions: Subscription[];

  @OneToMany(() => ApiKey, k => k.user)
  api_keys: ApiKey[];

  @OneToMany(() => Model, m => m.user)
  models: Model[];
}
```

---

#### `plans`

```typescript
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string;  // 'starter' | 'pro' | 'enterprise'

  @Column()
  max_predictions_per_month: number;  // -1 = unlimited

  @Column()
  max_models: number;  // -1 = unlimited

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_monthly: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price_annual: number;

  @Column({ type: 'jsonb', default: [] })
  features: string[];  // list of feature strings shown in UI

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
```

---

#### `subscriptions`

```typescript
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, u => u.subscriptions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column()
  plan_id: number;

  @Column({ default: 'active' })
  status: 'active' | 'cancelled' | 'past_due';

  @Column({ default: 'monthly' })
  billing_cycle: 'monthly' | 'annual';

  @Column({ type: 'timestamp' })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  ends_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

---

#### `api_keys`

```typescript
@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, u => u.api_keys)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  // Full key stored hashed — never stored in plain text
  @Column({ select: false })
  key_hash: string;

  // First 12 chars of the original key — safe to display (like GitHub tokens)
  @Column({ length: 20 })
  key_prefix: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
```

> **Important:** When generating an API key, return the full key to the user **once** and store only its hash. This is identical to how GitHub personal access tokens work.

---

#### `models` (AI model metadata)

```typescript
@Entity('models')
export class Model {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, u => u.models)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ default: 'untrained' })
  status: 'untrained' | 'training' | 'ready' | 'error';

  @Column({ type: 'float', nullable: true })
  accuracy: number;  // 0.0 – 1.0

  @Column({ nullable: true })
  samples_count: number;

  @Column({ type: 'timestamp', nullable: true })
  trained_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TrainingSession, s => s.model)
  training_sessions: TrainingSession[];

  @OneToMany(() => Prediction, p => p.model)
  predictions: Prediction[];
}
```

---

#### `training_sessions`

```typescript
@Entity('training_sessions')
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Model, m => m.training_sessions)
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @Column()
  model_id: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @Column({ nullable: true })
  samples_count: number;

  @Column({ nullable: true })
  epochs: number;

  @Column({ type: 'float', nullable: true })
  final_accuracy: number;

  @Column({ type: 'float', nullable: true })
  final_loss: number;

  @Column({ nullable: true })
  duration_seconds: number;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;

  @CreateDateColumn()
  started_at: Date;
}
```

---

#### `predictions`

```typescript
@Entity('predictions')
export class Prediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ApiKey)
  @JoinColumn({ name: 'api_key_id' })
  api_key: ApiKey;

  @Column()
  api_key_id: string;

  @ManyToOne(() => Model, m => m.predictions)
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @Column()
  model_id: string;

  @Column({ length: 10 })
  size_predicted: string;  // 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'

  @Column({ type: 'float' })
  input_back: number;

  @Column({ type: 'float' })
  input_height: number;

  @Column({ type: 'float' })
  input_weight: number;

  @Column({ type: 'float' })
  input_age: number;

  @Column({ type: 'float', nullable: true })
  confidence: number;  // 0.0 – 1.0

  @CreateDateColumn()
  created_at: Date;
}
```

---

#### `contact_messages`

```typescript
@Entity('contact_messages')
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 120 })
  company: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 120, nullable: true })
  role: string;

  @Column({ length: 120, nullable: true })
  volume: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'new' })
  status: 'new' | 'read' | 'replied';

  @CreateDateColumn()
  created_at: Date;
}
```

---

## 5. Key NestJS Concepts

Understanding these before coding will save hours of confusion.

### Module
A module groups related code (controller, service, entities). Every feature is a module.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],  // registers entity
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],  // allows other modules to use this service
})
export class UsersModule {}
```

### Controller
Handles HTTP requests. Maps routes to service methods.

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)  // all routes in this controller require auth
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
```

### Service
Contains business logic. Talks to the database via repositories.

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }
}
```

### Guard
Protects routes. Returns true (allow) or throws UnauthorizedException (block).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### DTO (Data Transfer Object)
Defines and validates the shape of request bodies.

```typescript
export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Pipe
Transforms or validates incoming data before it reaches the controller. Enable globally in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

`whitelist: true` strips any properties not declared in the DTO.
`transform: true` converts incoming strings to the declared types automatically.

---

## 6. Implementation Levels

Each level builds on the previous one. Complete each fully before moving to the next.

---

### Level 1 — Project Setup & Database Connection

**Goal:** A running NestJS server connected to PostgreSQL.

**Steps:**

1. Create the NestJS project and install dependencies (see Section 1).

2. Create the database in PostgreSQL:
   ```sql
   CREATE DATABASE app_db;
   ```

3. Configure TypeORM in `app.module.ts`:
   ```typescript
   TypeOrmModule.forRootAsync({
     imports: [ConfigModule],
     inject: [ConfigService],
     useFactory: (config: ConfigService) => ({
       type: 'postgres',
       host: config.get('DB_HOST'),
       port: config.get<number>('DB_PORT'),
       database: config.get('DB_NAME'),
       username: config.get('DB_USER'),
       password: config.get('DB_PASSWORD'),
       entities: [__dirname + '/**/*.entity{.ts,.js}'],
       synchronize: true,  // only in development — auto-creates tables
     }),
   }),
   ```

   > In production set `synchronize: false` and use migrations instead.

4. Create the `User` entity and confirm the `users` table appears in the database.

5. Set up global pipes in `main.ts`:
   ```typescript
   async function bootstrap() {
     const app = await NestFactory.create(AppModule);
     app.setGlobalPrefix('api/v1');
     app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
     app.enableCors({ origin: process.env.CORS_ORIGINS?.split(',') });
     await app.listen(process.env.PORT ?? 3001);
   }
   ```

**Verification:** `GET /api/v1` should return a 404 (no route), not a connection error.

---

### Level 2 — User Registration & Login (JWT)

**Goal:** Users can create an account and receive a JWT to access protected routes.

**Steps:**

1. Create `AuthModule`, `AuthController`, `AuthService`.

2. Create `RegisterDto`:
   ```typescript
   export class RegisterDto {
     @IsString() @MinLength(2) name: string;
     @IsEmail() email: string;
     @IsString() @MinLength(8) password: string;
     @IsOptional() @IsString() brand_name?: string;
     @IsOptional() @IsIn(['starter', 'pro']) plan?: string;
   }
   ```

3. In `AuthService.register()`:
   - Check if email already exists → throw `ConflictException`
   - Hash password: `await bcrypt.hash(password, 10)`
   - Save user
   - Return JWT (call `generateTokens()`)

4. In `AuthService.login()`:
   - Find user by email, include password: `findOne({ where: { email }, select: ['id', 'email', 'password', ...] })`
   - Compare password: `await bcrypt.compare(plain, hashed)`
   - If mismatch → throw `UnauthorizedException`
   - Return JWT

5. Generate JWT:
   ```typescript
   generateTokens(userId: string) {
     const payload = { sub: userId };
     return {
       access_token: this.jwtService.sign(payload, {
         secret: this.config.get('JWT_SECRET'),
         expiresIn: this.config.get('JWT_EXPIRES_IN'),
       }),
       refresh_token: this.jwtService.sign(payload, {
         secret: this.config.get('JWT_REFRESH_SECRET'),
         expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
       }),
     };
   }
   ```

6. Create `JwtStrategy`:
   ```typescript
   @Injectable()
   export class JwtStrategy extends PassportStrategy(Strategy) {
     constructor(config: ConfigService, private usersService: UsersService) {
       super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         secretOrKey: config.get('JWT_SECRET'),
       });
     }

     async validate(payload: { sub: string }) {
       const user = await this.usersService.findById(payload.sub);
       if (!user) throw new UnauthorizedException();
       return user;  // attached to request.user
     }
   }
   ```

7. Create `CurrentUser` decorator:
   ```typescript
   export const CurrentUser = createParamDecorator(
     (_data, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
   );
   ```

8. Create `JwtAuthGuard`:
   ```typescript
   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {}
   ```

**Verification:** `POST /api/v1/auth/register` creates a user. `POST /api/v1/auth/login` returns tokens. `GET /api/v1/users/me` with `Authorization: Bearer <token>` returns the user.

---

### Level 3 — User Profile & Password Management

**Goal:** Authenticated users can update their profile and change their password.

**Endpoints implemented in this level:**
- `GET /users/me`
- `PATCH /users/me`
- `PATCH /users/me/password`
- `DELETE /users/me`
- `POST /auth/refresh`

**Notes:**

- `PATCH /users/me/password` receives `{ current_password, new_password }`. Verify current before hashing and saving new.
- `POST /auth/refresh` receives `{ refresh_token }`, verifies it with `JWT_REFRESH_SECRET`, returns new access token.
- `DELETE /users/me` soft-deletes or hard-deletes. Add a `deleted_at` column for soft deletes:
  ```typescript
  @DeleteDateColumn()
  deleted_at: Date;
  ```
  Then call `repository.softDelete(id)`.

---

### Level 4 — Plans & Subscriptions

**Goal:** Seed plans into the database. Users can view plans and their current subscription.

**Steps:**

1. Create a database seed script or use TypeORM's `OnApplicationBootstrap` lifecycle hook to insert the 3 plans if they don't exist yet.

2. `SubscriptionsService.create()`: when a user registers, automatically create a `subscription` record linking them to the Starter plan.

3. Implement `GET /subscriptions/current`: return the user's active subscription with the plan details joined.

4. Implement `PATCH /subscriptions/current`: change the plan (upgrade/downgrade). Update `plan_id` and set `billing_cycle`.

**Verification:** After registration, `GET /api/v1/subscriptions/current` returns `{ plan: { name: 'starter', ... }, status: 'active' }`.

---

### Level 5 — API Key Management

**Goal:** Users can generate, view, and revoke API keys that the widget uses to authenticate.

**Key generation pattern:**

```typescript
import { randomBytes, createHash } from 'crypto';

generateApiKey(): { key: string; hash: string; prefix: string } {
  const raw = 'us_live_' + randomBytes(24).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  const prefix = raw.substring(0, 16);
  return { key: raw, hash, prefix };
}
```

**Create flow:**
1. Generate key + hash + prefix
2. Save `{ key_hash, key_prefix, user_id }` to `api_keys` table
3. Return the full `key` to the user **only this one time** — it cannot be retrieved again

**Validation flow (used by widget endpoints):**
1. Receive raw key from `X-API-Key` header
2. Hash it: `sha256(rawKey)`
3. Find `api_key` where `key_hash = hash AND is_active = true`
4. If found, update `last_used_at = NOW()`
5. Return the linked user/model

---

### Level 6 — AI Model Metadata

**Goal:** Track which AI models a user has trained. Each model has a name, status, and training history.

**Endpoints implemented in this level:**
- `GET /models` — list user's models
- `POST /models` — create a model record (name only, status = 'untrained')
- `GET /models/:id` — get model detail
- `PATCH /models/:id` — update name
- `DELETE /models/:id` — delete model and its training sessions

**Plan enforcement:**
Before creating a model, check that the user hasn't exceeded their plan's `max_models` limit:

```typescript
const count = await this.modelsRepository.count({ where: { user_id } });
if (plan.max_models !== -1 && count >= plan.max_models) {
  throw new ForbiddenException('Plan model limit reached');
}
```

---

### Level 7 — Training Data Upload

**Goal:** Users can upload Excel or CSV files; the backend parses them and stores a training session record.

**Steps:**

1. Add Multer to the training endpoint:
   ```typescript
   @Post(':modelId/train')
   @UseInterceptors(FileInterceptor('file', {
     limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024 },
     fileFilter: (_req, file, cb) => {
       const allowed = /\.(xlsx|xls|csv)$/;
       cb(null, allowed.test(file.originalname));
     },
   }))
   async train(
     @Param('modelId') modelId: string,
     @UploadedFile() file: Express.Multer.File,
     @CurrentUser() user: User,
   ) { ... }
   ```

2. Parse the file in the service (use the `xlsx` library):
   ```typescript
   import * as XLSX from 'xlsx';

   parseFile(buffer: Buffer): { rows: any[]; errors: string[] } {
     const wb = XLSX.read(buffer, { type: 'buffer' });
     const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
     // validate rows, extract valid measurements
     return { rows, errors };
   }
   ```

3. Save a `TrainingSession` with `status: 'completed'`, `samples_count`, `final_accuracy` (sent from the frontend after TF.js training completes).

4. Update the `Model` record: `status = 'ready'`, `accuracy`, `trained_at = NOW()`.

**Flow:**
- Frontend trains the model in-browser with TensorFlow.js
- Frontend sends training result metadata (accuracy, sample count, epochs) to `POST /models/:id/train`
- Backend stores the metadata and updates model status
- The actual model weights remain in the browser's localStorage (client-side)

---

### Level 8 — Predictions Logging & Analytics

**Goal:** The widget logs every prediction to the backend. Users can see stats in the dashboard.

**Widget flow:**

```
Browser widget
  → POST /api/v1/widget/predict  (header: X-API-Key: us_live_...)
  → Backend validates API key
  → Runs prediction (or accepts result from widget)
  → Saves Prediction record
  → Returns { size, confidence }
```

**Analytics queries:**

```typescript
// Predictions this month
const count = await this.predictionsRepository.count({
  where: {
    model: { user_id },
    created_at: MoreThanOrEqual(startOfMonth),
  },
});

// Size distribution
const distribution = await this.predictionsRepository
  .createQueryBuilder('p')
  .select('p.size_predicted', 'size')
  .addSelect('COUNT(*)', 'count')
  .where('p.model_id = :modelId', { modelId })
  .groupBy('p.size_predicted')
  .getRawMany();

// Predictions per day (last 30 days)
const trend = await this.predictionsRepository
  .createQueryBuilder('p')
  .select("DATE_TRUNC('day', p.created_at)", 'day')
  .addSelect('COUNT(*)', 'count')
  .where('p.model_id = :modelId', { modelId })
  .andWhere("p.created_at >= NOW() - INTERVAL '30 days'")
  .groupBy('day')
  .orderBy('day', 'ASC')
  .getRawMany();
```

---

### Level 9 — Swagger Documentation

**Goal:** Auto-generated interactive API docs at `/api/docs`.

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('App API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

Decorate DTOs and controllers:

```typescript
@ApiProperty({ example: 'john@example.com' })
@IsEmail()
email: string;

@ApiOperation({ summary: 'Register a new user' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@Post('register')
register(@Body() dto: RegisterDto) { ... }
```

---

### Level 10 — Production Hardening

**Goal:** The API is safe and performant for real users.

**Migrations (replace `synchronize: true`):**

```bash
npm install ts-node --save-dev

# Generate
npx typeorm migration:generate src/migrations/InitialSchema -d src/data-source.ts

# Run
npx typeorm migration:run -d src/data-source.ts
```

**Rate limiting:**

```bash
npm install @nestjs/throttler
```

```typescript
ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])
// More strict on auth routes:
@Throttle({ default: { ttl: 60000, limit: 5 } })
@Post('login')
```

**Helmet (security headers):**

```bash
npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());
```

**CORS:** Already shown in Level 1 — restrict to your frontend origin only.

**Input sanitization:** `ValidationPipe` with `whitelist: true` already strips unknown fields. Additionally consider `forbidNonWhitelisted: true` to throw errors on unknown fields.

---

## 7. Complete API Reference

All routes prefixed with `/api/v1`.  
Protected routes require `Authorization: Bearer <access_token>` header.  
Public routes are marked with `[PUBLIC]`.

---

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | [PUBLIC] | Create account |
| POST | `/auth/login` | [PUBLIC] | Login, receive tokens |
| POST | `/auth/refresh` | [PUBLIC] | Exchange refresh token for new access token |
| POST | `/auth/logout` | Protected | Invalidate refresh token |
| POST | `/auth/forgot-password` | [PUBLIC] | Send reset email |
| POST | `/auth/reset-password` | [PUBLIC] | Set new password with reset token |

**POST /auth/register**
```json
// Request
{
  "name": "María García",
  "email": "maria@mybrand.com",
  "password": "securePass123",
  "brand_name": "My Brand",
  "plan": "starter"
}

// Response 201
{
  "user": { "id": "uuid", "name": "María García", "email": "maria@mybrand.com" },
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**POST /auth/login**
```json
// Request
{ "email": "maria@mybrand.com", "password": "securePass123" }

// Response 200
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ..."
}
```

**POST /auth/refresh**
```json
// Request
{ "refresh_token": "eyJ..." }

// Response 200
{ "access_token": "eyJ..." }
```

---

### Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Protected | Get current user profile |
| PATCH | `/users/me` | Protected | Update name, brand_name |
| PATCH | `/users/me/password` | Protected | Change password |
| DELETE | `/users/me` | Protected | Delete account |

**GET /users/me — Response 200**
```json
{
  "id": "uuid",
  "name": "María García",
  "email": "maria@mybrand.com",
  "brand_name": "My Brand",
  "email_verified": false,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**PATCH /users/me/password**
```json
// Request
{ "current_password": "securePass123", "new_password": "newPass456" }

// Response 200
{ "message": "Password updated successfully" }
```

---

### Plans

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/plans` | [PUBLIC] | List all active plans |
| GET | `/plans/:id` | [PUBLIC] | Get plan detail |

**GET /plans — Response 200**
```json
[
  {
    "id": 1,
    "name": "starter",
    "max_predictions_per_month": 500,
    "max_models": 1,
    "price_monthly": 0,
    "price_annual": 0,
    "features": ["1 size model", "Standard widget", "Email support"]
  },
  {
    "id": 2,
    "name": "pro",
    "max_predictions_per_month": 10000,
    "max_models": 3,
    "price_monthly": 29,
    "price_annual": 23,
    "features": ["3 size models", "Custom widget", "Priority support", "CSV export", "Webhooks"]
  },
  {
    "id": 3,
    "name": "enterprise",
    "max_predictions_per_month": -1,
    "max_models": -1,
    "price_monthly": 0,
    "price_annual": 0,
    "features": ["Unlimited models", "White-label", "SLA 99.9%", "Dedicated manager"]
  }
]
```

---

### Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions/current` | Protected | Get active subscription |
| PATCH | `/subscriptions/current` | Protected | Change plan or billing cycle |
| DELETE | `/subscriptions/current` | Protected | Cancel subscription (reverts to Starter) |

**PATCH /subscriptions/current**
```json
// Request
{ "plan_id": 2, "billing_cycle": "annual" }

// Response 200
{
  "id": "uuid",
  "plan": { "id": 2, "name": "pro" },
  "status": "active",
  "billing_cycle": "annual"
}
```

---

### API Keys

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api-keys` | Protected | List user's API keys (prefix only, never full key) |
| POST | `/api-keys` | Protected | Generate new API key (returns full key once) |
| DELETE | `/api-keys/:id` | Protected | Revoke key |
| POST | `/api-keys/:id/rotate` | Protected | Revoke old key, generate new one |

**POST /api-keys — Response 201**
```json
{
  "id": "uuid",
  "key": "us_live_a1b2c3d4e5f6...",
  "key_prefix": "us_live_a1b2c3",
  "message": "Save this key now. It will not be shown again."
}
```

**GET /api-keys — Response 200**
```json
[
  {
    "id": "uuid",
    "key_prefix": "us_live_a1b2c3",
    "is_active": true,
    "last_used_at": "2025-03-15T10:22:00Z",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### Models

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/models` | Protected | List user's models |
| POST | `/models` | Protected | Create model (name only) |
| GET | `/models/:id` | Protected | Get model with latest training session |
| PATCH | `/models/:id` | Protected | Rename model |
| DELETE | `/models/:id` | Protected | Delete model and history |

**POST /models**
```json
// Request
{ "name": "Women Summer 2025" }

// Response 201
{
  "id": "uuid",
  "name": "Women Summer 2025",
  "status": "untrained",
  "accuracy": null,
  "samples_count": null,
  "created_at": "2025-01-01T00:00:00Z"
}
```

**GET /models/:id — Response 200**
```json
{
  "id": "uuid",
  "name": "Women Summer 2025",
  "status": "ready",
  "accuracy": 0.942,
  "samples_count": 120,
  "trained_at": "2025-03-10T14:00:00Z",
  "latest_training": {
    "id": "uuid",
    "epochs": 201,
    "final_accuracy": 0.942,
    "duration_seconds": 18,
    "completed_at": "2025-03-10T14:00:18Z"
  }
}
```

---

### Training

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/models/:id/train` | Protected | Upload training data file + receive result |
| GET | `/models/:id/training-sessions` | Protected | Training history |
| GET | `/models/:id/training-sessions/:sid` | Protected | Single session detail |

**POST /models/:id/train**

Request: `multipart/form-data`
```
file: <excel-or-csv-file>
accuracy: 0.942
samples_count: 120
epochs: 201
duration_seconds: 18
```

Response 201:
```json
{
  "session": {
    "id": "uuid",
    "status": "completed",
    "final_accuracy": 0.942,
    "samples_count": 120
  },
  "model": {
    "id": "uuid",
    "status": "ready",
    "accuracy": 0.942
  }
}
```

---

### Predictions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/predictions` | Protected | List user's predictions (paginated) |
| GET | `/predictions/stats` | Protected | Aggregate stats for dashboard |
| GET | `/predictions/distribution` | Protected | Size distribution by model |

**GET /predictions?page=1&limit=20&modelId=uuid — Response 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "size_predicted": "M",
      "confidence": 0.87,
      "input_back": 45,
      "input_height": 168,
      "input_weight": 64,
      "input_age": 31,
      "created_at": "2025-03-15T10:22:00Z"
    }
  ],
  "total": 1247,
  "page": 1,
  "limit": 20
}
```

**GET /predictions/stats — Response 200**
```json
{
  "total_this_month": 1247,
  "total_all_time": 8340,
  "unique_users_this_month": 89,
  "plan_limit": 10000,
  "plan_used_pct": 12.5
}
```

**GET /predictions/distribution?modelId=uuid — Response 200**
```json
[
  { "size": "XS",  "count": 41,  "pct": 5  },
  { "size": "S",   "count": 125, "pct": 15 },
  { "size": "M",   "count": 250, "pct": 30 },
  { "size": "L",   "count": 208, "pct": 25 },
  { "size": "XL",  "count": 142, "pct": 17 },
  { "size": "XXL", "count": 67,  "pct": 8  }
]
```

---

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/overview` | Protected | Dashboard summary card data |
| GET | `/analytics/trend?days=30` | Protected | Predictions per day time series |

**GET /analytics/trend?days=30 — Response 200**
```json
[
  { "day": "2025-03-01", "count": 32 },
  { "day": "2025-03-02", "count": 41 },
  { "day": "2025-03-03", "count": 28 }
]
```

---

### Widget (Public)

These routes are called by the embedded widget in the merchant's store. They use `X-API-Key` header instead of JWT.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/widget/validate` | API Key | Check if key is valid |
| POST | `/widget/predict` | API Key | Log a prediction |

**GET /widget/validate — Headers: `X-API-Key: us_live_...`**
```json
// Response 200
{ "valid": true, "model_status": "ready" }

// Response 401
{ "valid": false, "error": "Invalid or inactive API key" }
```

**POST /widget/predict — Headers: `X-API-Key: us_live_...`**
```json
// Request
{
  "size_predicted": "M",
  "confidence": 0.87,
  "input_back": 45,
  "input_height": 168,
  "input_weight": 64,
  "input_age": 31
}

// Response 201
{ "logged": true, "prediction_id": "uuid" }
```

---

### Contact

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/contact` | [PUBLIC] | Submit contact form |

**POST /contact**
```json
// Request
{
  "name": "Ana Torres",
  "company": "Fashion Co.",
  "email": "ana@fashionco.com",
  "role": "CTO",
  "volume": "10,000 – 100,000 predictions/month",
  "message": "We need a custom integration with our ERP."
}

// Response 201
{ "message": "Your message has been received. We will respond within 24 hours." }
```

---

## 8. Authentication Strategy

### Token Flow

```
1. POST /auth/login
      ↓
   Server validates credentials
      ↓
   Returns: access_token (15m) + refresh_token (7d)

2. Frontend stores:
   - access_token → memory (or sessionStorage)
   - refresh_token → httpOnly cookie (safer) or localStorage

3. Every API request:
   Authorization: Bearer <access_token>

4. When access_token expires (401 response):
   POST /auth/refresh  { refresh_token }
   → get new access_token
   → retry original request

5. On logout:
   POST /auth/logout
   → backend invalidates refresh_token (add to blocklist in DB or cache)
```

### API Key Flow (Widget)

```
1. User generates API key in dashboard
   → full key shown once, hash stored in DB

2. Widget sends key in every request header:
   X-API-Key: us_live_...

3. Server creates ApiKeyGuard:
   - Extracts key from header
   - Hashes it with SHA-256
   - Finds matching active record in api_keys table
   - Attaches user to request
   - Updates last_used_at
```

---

## 9. File Upload Handling

The frontend uploads `.xlsx`, `.xls`, or `.csv` training files. The backend parses them and validates the data before creating a training session.

**Validation rules:**

| Column | Accepted names | Type | Required | Valid range |
|---|---|---|---|---|
| Back width | `espalda_cm`, `espalda` | Number | Yes | 30–80 |
| Height | `altura_cm`, `altura` | Number | Yes | 140–220 |
| Weight | `peso_kg`, `peso` | Number | Yes | 40–200 |
| Age | `edad_años`, `edad` | Number | Yes | 10–100 |
| Size | `talla`, `Talla`, `TALLA` | String | Yes | XS, S, M, L, XL, XXL |

**Size aliases accepted:** `2XL` → `XXL`, `2X` → `XXL`

**Minimum rows:** 20 (return 422 if fewer valid rows found)

**Error response format:**
```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "valid_rows": 8,
  "row_errors": [
    "Row 3: invalid size 'MEDIUM' — valid: XS, S, M, L, XL, XXL",
    "Row 7: missing values"
  ]
}
```

---

## 10. Security Checklist

| Category | Requirement |
|---|---|
| Passwords | Hashed with bcrypt, minimum cost factor 10 |
| API Keys | Stored as SHA-256 hash only, never in plain text |
| JWT | Short-lived access tokens (15 min), longer refresh tokens (7 days) |
| JWT Secret | Minimum 32 random characters, stored in env var |
| CORS | Restricted to known frontend origins |
| Rate Limiting | Strict limits on auth routes (5 req/min), general limits on all routes |
| Input Validation | `ValidationPipe` with `whitelist: true` on all endpoints |
| SQL Injection | Avoided by using TypeORM query builder (parameterized queries) |
| File Uploads | Strict MIME type check, max file size enforced, no direct execution |
| HTTP Headers | Helmet middleware for secure headers |
| Error Messages | Never expose stack traces or internal details in production |
| Logging | Log auth failures, API key usage anomalies |
| Migrations | Use TypeORM migrations in production, never `synchronize: true` |
| Environment | `.env` in `.gitignore`, separate configs per environment |
