# Forrof Tracker API Documentation

## Overview

Forrof Tracker is a comprehensive HR management system API built with Node.js and Express.js. It provides a complete solution for managing employee leaves, announcements, and user accounts with role-based access control.

## Quick Start

### Base URL

```
Development: http://localhost:5000/api
Production: https://forrof-tracker-backend.vercel.app
```

### Interactive Documentation

Access the Swagger UI at: `http://localhost:5000/api/docs`

## Authentication (Session-Based)

This API uses **session-based authentication** powered by better-auth. Unlike traditional token-based APIs, you don't need to manually include authentication headers.

### How It Works

1. **Login**: User authenticates through better-auth (usually via `/auth/signin`)
2. **Session Created**: Upon successful login, a session cookie is automatically set
3. **Automatic Cookie Sending**: All subsequent requests automatically include the session cookie
4. **API Validates**: The API validates the session from the cookie and processes the request

### No Token Management Required

```bash
# Traditional JWT approach (NOT used here):
# curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/leaves

# Session-based approach (used here):
# Simply ensure you're logged in, then make requests normally
# The cookie is automatically sent by your browser/client
curl http://localhost:5000/api/leaves
```

### Session Cookie Details

- **Cookie Name**: `better-auth.session_token`
- **Type**: httpOnly (secure, not accessible via JavaScript)
- **Security Features**:
  - ✅ httpOnly prevents XSS attacks
  - ✅ Secure flag ensures HTTPS only in production
  - ✅ SameSite attribute prevents CSRF attacks
- **Automatic**: Sent with every request if you're authenticated
- **Expires**: After inactivity period (configurable)

### Usage in Different Clients

#### Browser (Fetch API)

```javascript
// Cookies are automatically sent if credentials are included
const response = await fetch('http://localhost:5000/api/leaves', {
  credentials: 'include', // Important: sends cookies
})
const data = await response.json()
```

#### Browser (Axios)

```javascript
// Configure axios to include cookies
axios.defaults.withCredentials = true

const response = await axios.get('http://localhost:5000/api/leaves')
const data = response.data
```

#### cURL

```bash
# Cookies are stored and automatically sent
curl -c cookies.txt http://localhost:5000/auth/signin \
  -d '{"email": "user@example.com", "password": "password"}'

curl -b cookies.txt http://localhost:5000/api/leaves
```

#### Node.js (with axios)

```javascript
import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

// Login
await client.post('http://localhost:5000/auth/signin', {
  email: 'user@example.com',
  password: 'password',
})

// Now make authenticated requests
const response = await client.get('http://localhost:5000/api/leaves')
```

#### Python (with requests)

```python
import requests

session = requests.Session()

# Login
session.post('http://localhost:5000/auth/signin', json={
    'email': 'user@example.com',
    'password': 'password'
})

# Cookies are automatically managed
response = session.get('http://localhost:5000/api/leaves')
data = response.json()
```

## API Endpoints

### Leave Management

| Method | Endpoint               | Description          | Permission                |
| ------ | ---------------------- | -------------------- | ------------------------- |
| GET    | `/leaves`              | List all leaves      | admin, hr                 |
| POST   | `/leaves`              | Create new leave     | authenticated             |
| GET    | `/leaves/my-leaves`    | Get user's leaves    | authenticated             |
| GET    | `/leaves/stats`        | Get leave statistics | authenticated             |
| GET    | `/leaves/{id}`         | Get leave details    | admin, owner              |
| PUT    | `/leaves/{id}`         | Update leave         | admin, owner (if pending) |
| DELETE | `/leaves/{id}`         | Delete leave         | admin, owner              |
| PATCH  | `/leaves/{id}/approve` | Approve/reject leave | admin                     |

### Announcements

| Method | Endpoint              | Description              | Permission     |
| ------ | --------------------- | ------------------------ | -------------- |
| GET    | `/announcements`      | List announcements       | authenticated  |
| POST   | `/announcements`      | Create announcement      | admin, hr      |
| GET    | `/announcements/{id}` | Get announcement details | authenticated  |
| PUT    | `/announcements/{id}` | Update announcement      | admin, creator |
| DELETE | `/announcements/{id}` | Delete announcement      | admin, creator |

### User

| Method | Endpoint       | Description  | Permission    |
| ------ | -------------- | ------------ | ------------- |
| POST   | `/user/report` | Report issue | authenticated |

## Leave Types

The system supports the following leave types:

- `ANNUAL_LEAVE` - Paid annual leave
- `MATERNITY_LEAVE` - Maternity leave
- `CASUAL_LEAVE` - Casual leave
- `SICK_LEAVE` - Sick leave
- `PERSONAL_LEAVE` - Personal leave
- `UNPAID_LEAVE` - Unpaid leave

## Leave Status

Leave requests can have the following statuses:

- `PENDING` - Awaiting approval
- `APPROVED` - Approved by admin
- `REJECTED` - Rejected by admin
- `CANCELLED` - Cancelled by user

## Request Examples

### Create a Leave Request

```bash
# First, ensure you're logged in (cookies will be stored)
curl -X POST http://localhost:5000/api/leaves \
  -H "Content-Type: application/json" \
  -d '{
    "leaveType": "ANNUAL_LEAVE",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-02-05T00:00:00Z",
    "reason": "Vacation planning"
  }'
```

### Get My Leaves

```bash
curl -X GET "http://localhost:5000/api/leaves/my-leaves?page=1&limit=10&status=PENDING"
```

### Approve a Leave Request

```bash
curl -X PATCH http://localhost:5000/api/leaves/550e8400-e29b-41d4-a716-446655440001/approve \
  -H "Content-Type: application/json" \
  -d '{
    "status": "APPROVED",
    "approvalNotes": "Approved for the requested dates"
  }'
```

### Create an Announcement

```bash
curl -X POST http://localhost:5000/api/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Company Holiday Schedule",
    "description": "Please refer to the updated holiday schedule for 2024",
    "category": "Holiday",
    "department": null
  }'
```

## Response Format

All responses follow a consistent JSON format:

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "leaveType": "ANNUAL_LEAVE",
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-02-05T00:00:00Z",
  "duration": 5,
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Paginated Response

```json
{
  "results": [
    { "id": "1", "title": "Leave 1" },
    { "id": "2", "title": "Leave 2" }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

### Error Response

```json
{
  "code": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "startDate",
      "message": "Start date must be in the future"
    }
  ]
}
```

## HTTP Status Codes

| Code | Meaning      | Scenario                 |
| ---- | ------------ | ------------------------ |
| 200  | OK           | Request successful       |
| 201  | Created      | Resource created         |
| 204  | No Content   | Resource deleted         |
| 400  | Bad Request  | Validation error         |
| 401  | Unauthorized | Missing/invalid token    |
| 403  | Forbidden    | Insufficient permissions |
| 404  | Not Found    | Resource not found       |
| 409  | Conflict     | Resource already exists  |
| 500  | Server Error | Internal error           |

## Pagination

List endpoints support pagination with the following parameters:

```
GET /leaves?page=1&limit=20
```

Parameters:

- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10, max: 100)

Response includes:

- `results` - Array of items
- `page` - Current page
- `limit` - Items per page
- `totalPages` - Total number of pages
- `totalResults` - Total items

## Filtering

Endpoints support filtering with query parameters:

### Leaves Filters

```
GET /leaves?status=PENDING&employeeId=550e8400-e29b-41d4-a716-446655440000
GET /leaves/my-leaves?status=APPROVED
```

Available filters:

- `status` - Leave status (PENDING, APPROVED, REJECTED, CANCELLED)
- `employeeId` - Filter by employee
- `startDate` - Filter by start date
- `endDate` - Filter by end date

### Announcements Filters

```
GET /announcements?category=Holiday&department=Engineering
```

Available filters:

- `category` - Announcement category
- `department` - Target department

## Rate Limiting

API requests are rate-limited to prevent abuse:

- Standard users: 100 requests per 15 minutes
- Admin users: 500 requests per 15 minutes

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1705330200
```

## Date and Time Format

All timestamps use ISO 8601 format with UTC timezone:

```
2024-01-15T10:30:00Z
```

When submitting date parameters, use the same format or standard date format:

```
2024-02-01
```

## Error Handling

### Common Errors

#### 401 Unauthorized

```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

**Solution**: Include a valid JWT token in the Authorization header.

#### 403 Forbidden

```json
{
  "code": 403,
  "message": "Forbidden"
}
```

**Solution**: Ensure your role has permission for this action. Admins can perform most actions, employees are limited to their own resources.

#### 404 Not Found

```json
{
  "code": 404,
  "message": "Leave not found"
}
```

**Solution**: Verify the resource ID is correct.

#### 400 Validation Error

```json
{
  "code": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "endDate",
      "message": "End date must be after start date"
    }
  ]
}
```

**Solution**: Check the validation errors and adjust your request.

## Role-Based Access Control

### Admin Permissions

- ✅ List all leaves
- ✅ Get any leave details
- ✅ Approve/reject leaves
- ✅ Update any leave
- ✅ Delete any leave
- ✅ Create announcements
- ✅ Update/delete own or any announcement

### Employee Permissions

- ✅ Create leave request
- ✅ Get own leaves
- ✅ Update own PENDING leaves
- ✅ Delete own leaves
- ✅ View announcements
- ✅ Get leave statistics

## Best Practices

### 1. Handle Rate Limiting

```javascript
if (response.status === 429) {
  const resetTime = response.headers['x-ratelimit-reset']
  console.log(`Rate limited. Try again after ${resetTime}`)
}
```

### 2. Validate Dates

- End date must be after start date
- Cannot create leaves in the past
- Avoid overlapping leaves

### 3. Error Handling

```javascript
try {
  const response = await fetch('/api/leaves', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json()

  if (!response.ok) {
    console.error(`Error ${data.code}: ${data.message}`)
    data.errors?.forEach(err => console.error(`- ${err.field}: ${err.message}`))
  }
} catch (error) {
  console.error('Network error:', error)
}
```

### 4. Token Management

- Store tokens securely (not in localStorage for sensitive apps)
- Refresh tokens before expiration
- Clear tokens on logout

## SDK and Libraries

### cURL

```bash
curl -X GET http://localhost:5000/api/leaves \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:5000/api/leaves', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
const data = await response.json()
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}
response = requests.get('http://localhost:5000/api/leaves', headers=headers)
data = response.json()
```

## Troubleshooting

### Common Issues

**Q: Getting 401 Unauthorized**

- A: Ensure your token is valid and not expired. Include it in the Authorization header.

**Q: Getting 403 Forbidden**

- A: Check your role permissions. Only admins can approve leaves and perform certain actions.

**Q: Dates are not being accepted**

- A: Use ISO 8601 format: `2024-02-01T00:00:00Z`

**Q: Getting validation errors**

- A: Review the error messages for specific field issues.

## Support

For issues or questions:

- Email: support@forrof.com
- GitHub: [forrof/tracker](https://github.com/forrof/tracker)
- Documentation: [Full API Docs](http://localhost:5000/api/docs)

## Changelog

### v1.0.0 (2024-01-15)

- Initial release
- Leave management system
- Announcement system
- User management
- Role-based access control
