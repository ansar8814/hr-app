# NexaEdge Site (Praxia-Inspired Style)

This project contains a modern corporate website frontend with a simple Node.js/Express backend.

## Features
- Responsive single-page corporate layout
- Sections: hero, services, industries, about, contact
- Contact form connected to backend API
- Backend validation + JSON file persistence

## Run locally
```bash
npm install
npm start
```

Open: `http://localhost:3000`

## API
### `POST /api/contact`
Body:
```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "company": "Company Inc",
  "message": "We need help with cloud modernization."
}
```

### `GET /api/contact`
Returns all submitted contact requests from `data/messages.json`.
