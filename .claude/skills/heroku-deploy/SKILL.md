---
name: heroku-deploy
description: Handles Heroku deployment configuration and troubleshooting for the dashboard. Use when setting up deployment, fixing build issues, or configuring environment.
---

## Heroku Setup for React + Python

### React-only deployment
- Use `heroku/nodejs` buildpack
- Add `"heroku-postbuild": "npm run build"` to package.json
- Serve with `serve` package or static buildpack

### Required Files

**Procfile** (React only with serve):
```
web: npx serve -s build -l $PORT
```

**Procfile** (With Python backend):
```
web: gunicorn app:app
```

### With Python Backend (Multi-buildpack)
```bash
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 heroku/python
```

### Environment Configuration
```bash
# Set Node version
heroku config:set NODE_VERSION=18.x

# Increase memory for builds if needed
heroku config:set NODE_OPTIONS="--max_old_space_size=2560"

# Set Python version via runtime.txt
echo "python-3.11.0" > runtime.txt
```

### package.json Requirements
```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  },
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

### Common Issues

**Build fails with memory error**:
- Set NODE_OPTIONS as shown above
- Consider build caching

**Static files not found**:
- Ensure build output goes to `build/` directory
- Check Procfile serves correct directory

**Python dependencies not installing**:
- Ensure `requirements.txt` is in root
- Check `runtime.txt` Python version is supported

### Deployment Commands
```bash
# Initial setup
heroku create your-app-name
git push heroku main

# View logs
heroku logs --tail

# Restart dynos
heroku restart

# Run one-off command
heroku run bash
```
