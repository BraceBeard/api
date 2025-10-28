# Static Files Directory

This directory contains static assets served by the API server.

## Structure

```plaintext
src/public/
├── index.html          # Main documentation page
├── css/
│   └── main.css       # Main stylesheet
├── js/
│   └── main.js        # Main JavaScript file
└── images/            # Directory for images
```

## Access

All files in this directory are accessible under the `/assets` route:

- `http://localhost:4242/assets/index.html`
- `http://localhost:4242/assets/css/main.css`
- `http://localhost:4242/assets/js/main.js`

## Adding New Files

1. Place your files in the appropriate subdirectory
2. Reference them in your HTML using the `/assets` prefix
3. The router will automatically serve them with the correct MIME type

## Examples

### HTML
```html
<link rel="stylesheet" href="/assets/css/styles.css">
<script src="/assets/js/app.js"></script>
<img src="/assets/images/logo.png" alt="Logo">
```

### Direct Access
- [Documentation](http://localhost:4242/assets/index.html)
- [Stylesheet](http://localhost:4242/assets/css/main.css)
- [JavaScript](http://localhost:4242/assets/js/main.js)

## Security

The static file server includes:
- ✅ Directory traversal protection
- ✅ Automatic MIME type detection
- ✅ 404 handling for missing files
