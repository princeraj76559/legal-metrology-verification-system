# API contract

Base URL: `/api/v1`

Roles: `APPLICANT`, `ADMIN`, `OFFICER`

Application statuses: `SUBMITTED`, `ASSIGNED`, `VERIFIED`, `REJECTED`, `EXPIRED`

Every success response:

```json
{ "success": true, "message": "string", "data": {} }
```

Every failed response:

```json
{ "success": false, "message": "string", "errors": {} }
```

Authentication uses `Authorization: Bearer <token>`.

## Fixed endpoints

```text
POST /auth/register
POST /auth/login
GET, POST /instruments
GET /applications
GET /applications/my
GET /applications/:applicationId
POST /applications
PATCH /applications/:applicationId/assign
GET /officers
GET /officer/jobs
POST /applications/:applicationId/inspection
GET /certificates/my
GET /certificates/:certificateNumber
GET /public/verify/:qrToken
```

