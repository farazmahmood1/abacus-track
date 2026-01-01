# Session-Based Authentication Guide

## Overview

Forrof Tracker uses **better-auth** for session-based authentication. This guide explains how sessions work and how to interact with the API.

## Key Concepts

### What is Session-Based Authentication?

Instead of receiving a token and including it in headers, session-based authentication works like logging into a website:

1. You log in once
2. The server creates a session
3. A session cookie is stored on your client
4. The cookie is automatically sent with each request
5. The server validates the cookie and processes your request

### Why Not Tokens?

| Aspect         | Sessions                      | Tokens                          |
| -------------- | ----------------------------- | ------------------------------- |
| **Security**   | HttpOnly cookies prevent XSS  | Can be stolen from localStorage |
| **Revocation** | Server can immediately revoke | Token valid until expiration    |
| **Refresh**    | Automatic server-side         | Manual refresh required         |
| **Scope**      | Full server control           | Trust based on token claims     |

## How It Works

```
┌─────────────┐              ┌─────────────────────────────┐
│             │              │                             │
│   Client    │              │      API Server             │
│  (Browser)  │              │     (Forrof Tracker)        │
│             │              │                             │
└─────────────┘              └─────────────────────────────┘
      │                               │
      │  1. POST /auth/signin         │
      │  {email, password}            │
      ├──────────────────────────────>│
      │                               │
      │              2. Validate      │
      │              Create Session   │
      │              │
      │  3. Set-Cookie: session_token│
      │  200 OK                       │
      │<──────────────────────────────┤
      │                               │
      │  (Cookie stored on client)    │
      │                               │
      │  4. GET /api/leaves           │
      │  (Cookie sent automatically)  │
      ├──────────────────────────────>│
      │                               │
      │              5. Validate      │
      │              Cookie/Session   │
      │              │
      │  6. Return leaves data        │
      │  200 OK                       │
      │<──────────────────────────────┤
      │                               │
```

## Cookie Details

### Cookie Name

```
better-auth.session_token
```

### Cookie Attributes

| Attribute    | Value       | Purpose                                          |
| ------------ | ----------- | ------------------------------------------------ |
| **HttpOnly** | true        | Cannot be accessed via JavaScript (prevents XSS) |
| **Secure**   | true (prod) | Only sent over HTTPS in production               |
| **SameSite** | Lax/Strict  | Prevents CSRF attacks                            |
| **Path**     | /           | Available for entire site                        |
| **Domain**   | auto        | Set to your domain                               |

### Setting Cookies with better-auth

```javascript
// When you log in, better-auth automatically sets the cookie
// You don't need to do anything - it's automatic!
```

## Using the API with Sessions

### Browser / Fetch API

```javascript
// Login
const loginResponse = await fetch('http://localhost:5000/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important: sends/receives cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
  }),
})

// Now make API calls - cookies are automatically sent
const leavesResponse = await fetch('http://localhost:5000/api/leaves', {
  credentials: 'include', // Important: sends cookies
})

const leaves = await leavesResponse.json()
```

### Browser / Axios

```javascript
// Configure axios to always send credentials
axios.defaults.withCredentials = true

// Login
await axios.post('http://localhost:5000/auth/signin', {
  email: 'user@example.com',
  password: 'password',
})

// API calls now work automatically
const { data: leaves } = await axios.get('http://localhost:5000/api/leaves')
```

### React with Fetch

```javascript
function useApi(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(url, {
      credentials: 'include', // Essential for session auth
    })
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [url])

  return { data, loading, error }
}

// Usage
function MyLeaves() {
  const { data: leaves, loading } = useApi('http://localhost:5000/api/leaves')
  // ...
}
```

### React Query

```javascript
import { useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey: [url] }) =>
        fetch(url, { credentials: 'include' }).then(r => r.json()),
    },
  },
})

function MyLeaves() {
  const { data: leaves } = useQuery(['leaves'], {
    queryKey: ['leaves'],
  })
  // ...
}
```

### Node.js with Axios

```javascript
import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

// Create cookie jar to store cookies
const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

// Login - cookie is automatically stored
await client.post('http://localhost:5000/auth/signin', {
  email: 'user@example.com',
  password: 'password',
})

// API calls - cookie is automatically sent
const { data: leaves } = await client.get('http://localhost:5000/api/leaves')
```

### Node.js with node-fetch

```javascript
import fetch from 'node-fetch'
import CookieJar from 'tough-cookie-file-store'

const jar = new CookieJar(new FileCookieStore('cookies.json'))

// Login
await fetch('http://localhost:5000/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
  }),
  jar: jar,
})

// API calls
const response = await fetch('http://localhost:5000/api/leaves', {
  jar: jar, // Cookies are automatically sent
})
```

### Python with Requests

```python
import requests

# Create a session to manage cookies
session = requests.Session()

# Login
session.post('http://localhost:5000/auth/signin', json={
    'email': 'user@example.com',
    'password': 'password',
})

# API calls - cookies are automatically managed
response = session.get('http://localhost:5000/api/leaves')
leaves = response.json()
```

### cURL

```bash
# Save cookies to file
curl -c cookies.txt \
  -X POST http://localhost:5000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Use cookies in subsequent requests
curl -b cookies.txt \
  http://localhost:5000/api/leaves

# With pretty JSON output
curl -b cookies.txt \
  http://localhost:5000/api/leaves | jq
```

## Error Handling

### 401 Unauthorized

```json
{
  "code": 401,
  "message": "Unauthorized"
}
```

**Possible causes:**

- Session expired
- Not logged in
- Cookie not being sent

**Solution:**

```javascript
try {
  const response = await fetch('/api/leaves', {
    credentials: 'include',
  })

  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login'
  }
} catch (error) {
  console.error('Error:', error)
}
```

### Session Expiration

Sessions automatically expire after a period of inactivity. Handle this by:

1. Checking for 401 responses
2. Redirecting to login page
3. Optionally implementing automatic token refresh

```javascript
const response = await fetch('/api/leaves', {
  credentials: 'include',
})

if (response.status === 401) {
  // Session expired
  window.location.href = '/login'
}
```

## Security Best Practices

### ✅ DO

- ✅ Always use `credentials: 'include'` (or equivalent) in API calls
- ✅ Store sensitive data on the server, not in cookies
- ✅ Use HTTPS in production (enforced by Secure flag)
- ✅ Implement CSRF protection (better-auth handles this)
- ✅ Set appropriate session timeout
- ✅ Clear cookies on logout

### ❌ DON'T

- ❌ Don't try to access session cookies via JavaScript (they're httpOnly)
- ❌ Don't store sensitive tokens in localStorage
- ❌ Don't skip `credentials: 'include'` in Fetch
- ❌ Don't use HTTP in production
- ❌ Don't ignore 401 responses

## Logout

```javascript
// Logout endpoint (provided by better-auth)
await fetch('http://localhost:5000/auth/signout', {
  method: 'POST',
  credentials: 'include',
})

// Redirect to login
window.location.href = '/login'
```

## CORS Configuration

For cross-origin requests to work with session cookies, ensure CORS is properly configured:

```javascript
// Server-side (already configured in Forrof Tracker)
app.use(
  cors({
    origin: 'http://localhost:3000', // Your frontend URL
    credentials: true, // Important: allows cookies
  })
)
```

## Troubleshooting

### Cookies not being sent

**Problem**: API returns 401 even though you're logged in

**Solution**: Ensure you're using `credentials: 'include'`

```javascript
// Wrong ❌
fetch('/api/leaves')

// Correct ✅
fetch('/api/leaves', {
  credentials: 'include',
})
```

### CORS errors with cookies

**Problem**: "Credentials mode is 'include'" error

**Solution**: Ensure CORS is configured with `credentials: true`

### Session expires too quickly

**Contact support** to adjust session timeout settings.

## Summary

Session-based authentication with better-auth provides:

- 🔒 **More Secure**: HttpOnly cookies prevent XSS attacks
- 🔑 **Simpler**: No token management needed
- ♻️ **Flexible**: Server can revoke sessions anytime
- 🚀 **Efficient**: No token refresh logic needed

The key is remembering to:

1. Use `credentials: 'include'` in your requests
2. Let the server manage sessions automatically
3. Handle 401 errors by redirecting to login
