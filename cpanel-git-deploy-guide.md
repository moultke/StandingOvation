# cPanel Git Deployment Setup Guide

A step-by-step guide for deploying a website from a local machine to cPanel (GreenGeeks) via Git, with direct push deployment.

---

## Overview

```
Local Machine → git push → GitHub (origin)
             → git push → cPanel (cpanel) → auto-deploys via .cpanel.yml
```

Two remotes are configured so you can push to both GitHub and cPanel. Pushing to the cPanel remote triggers automatic deployment — no need to log into the cPanel UI.

---

## Prerequisites

- A cPanel hosting account (e.g., GreenGeeks)
- A GitHub account
- Git installed locally
- A local project ready to deploy

---

## Step 1: Create the GitHub Repository

If the repo doesn't exist yet on GitHub:

```bash
gh repo create your-username/your-repo-name --private --source=. --push
```

Or if the repo already exists, add it as a remote:

```bash
git remote add origin https://github.com/your-username/your-repo-name.git
```

### Make the repo public (required for cPanel cloning)

cPanel's Git Version Control cannot authenticate with private GitHub repos (it blocks tokens in the clone URL). The simplest fix is making the repo public:

```bash
gh repo edit your-username/your-repo-name --visibility public --accept-visibility-change-consequences
```

If the repo must stay private, you'll need to use the SSH push method only (skip the cPanel clone-from-GitHub step).

---

## Step 2: Create the .cpanel.yml Deploy File

Create `.cpanel.yml` in your project root. This tells cPanel what to do after receiving a push.

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/your-cpanel-user/public_html/
    - /bin/cp -R *.html $DEPLOYPATH/
    - /bin/cp -R css/ $DEPLOYPATH/css/
    - /bin/cp -R js/ $DEPLOYPATH/js/
    - /bin/cp -R img/ $DEPLOYPATH/img/
    - /bin/cp favicon.ico $DEPLOYPATH/
    - /bin/cp robots.txt $DEPLOYPATH/
    - /bin/cp sitemap.xml $DEPLOYPATH/
```

Adjust the file list and `DEPLOYPATH` to match your site structure.

---

## Step 3: Push to GitHub

```bash
git add -A
git commit -m "Initial commit"
git push -u origin main
```

If the remote already has commits and your local repo has a different history:

```bash
git pull origin main --allow-unrelated-histories --no-rebase --no-edit
# Resolve any merge conflicts, then:
git add -A
git commit -m "Merge remote history"
git push origin main
```

---

## Step 4: Create the Repository in cPanel

1. Log into cPanel
2. Go to **Git Version Control** (under Files section)
3. Click **Create Repository**
4. Fill in:
   - **Clone URL toggle:** Enable (clone from remote)
   - **Clone URL:** `https://github.com/your-username/your-repo-name.git`
   - **Repository Path:** `public_html/your-site` (or wherever your site lives)
   - **Repository Name:** `your-repo-name`
5. Click **Create**

### If you get an authentication error:

```
fatal: could not read Username for 'https://github.com': No such device or address
```

This means the repo is private. Make it public (Step 1) and try again.

### Verify it worked:

In cPanel Git Version Control, you should see your repo listed with the latest commit from GitHub.

---

## Step 5: Set Up SSH Access for Direct Push

This is the key step that eliminates the need to manually deploy from the cPanel UI.

### 5a: Find your cPanel server details

In cPanel, look at **General Information** (right sidebar) or **Server Information**:
- **Username:** your cPanel username (e.g., `mahonet`)
- **Server IP:** the server IP address (e.g., `184.154.118.6`)
- **Hostname:** the server hostname (e.g., `chir204.websitehostserver.net`)

Note: The cPanel username and the WHM/reseller username may be different. Use the cPanel username.

### 5b: Generate an SSH key in cPanel

1. In cPanel → **SSH Access** → **Generate a New Key**
2. Fill in:
   - **Key Name:** `id_rsa`
   - **Key Password:** leave blank
   - **Key Type:** RSA
   - **Key Size:** 2048
3. Click **Generate Key**

### 5c: Authorize the public key

1. Go to **Manage SSH Keys**
2. Under **Public Keys**, find `id_rsa` → click **Manage** → click **Authorize**

### 5d: Download the private key

1. Under **Private Keys**, find `id_rsa` → click **View/Download**
2. Download the key file (don't copy/paste — it can corrupt the key format)
3. Save it to your local machine

### 5e: Install the private key locally

```bash
# Move the downloaded key to your .ssh directory
cp ~/Downloads/id_rsa ~/.ssh/cpanel_rsa

# Set correct permissions (required — SSH will reject keys with wrong permissions)
chmod 600 ~/.ssh/cpanel_rsa
```

### 5f: Configure SSH

Add an entry to `~/.ssh/config` (create the file if it doesn't exist):

```
Host your-domain.com
    HostName YOUR_SERVER_IP
    User YOUR_CPANEL_USERNAME
    IdentityFile ~/.ssh/cpanel_rsa
    StrictHostKeyChecking accept-new
```

Example:
```
Host mahonetconsulting.com
    HostName 184.154.118.6
    User mahonet
    IdentityFile ~/.ssh/cpanel_rsa
    StrictHostKeyChecking accept-new
```

Set permissions on the config file:
```bash
chmod 600 ~/.ssh/config
```

### 5g: Test the SSH connection

```bash
ssh -i ~/.ssh/cpanel_rsa your-cpanel-user@your-domain.com "echo connected"
```

You should see `connected` in the output (ignore locale warnings).

---

## Step 6: Add cPanel as a Git Remote

The Clone URL for your cPanel repo can be found in:
cPanel → Git Version Control → Manage → **Basic Information** → **Clone URL**

It looks like:
```
ssh://username@domain.com/home/username/repositories/RepoName
```

Add it as a remote:

```bash
git remote add cpanel ssh://your-cpanel-user@your-domain.com/home/your-cpanel-user/repositories/your-repo-name
```

### Test the push:

```bash
git push cpanel main
```

You should see `Everything up-to-date` or a successful push message.

---

## Step 7: Verify Deployment

Check your live site to confirm the changes are deployed.

In cPanel → Git Version Control → Manage → **Pull or Deploy**, the "Last Deployment Information" should show your latest commit.

---

## Daily Workflow

After making changes locally:

```bash
git add <files>
git commit -m "description of changes"
git push origin main && git push cpanel main
```

That's it — both GitHub and cPanel are updated, and the site is deployed automatically.

---

## .gitignore Recommendations

```
.DS_Store
.idea/
.env
CLAUDE.md
```

---

## Troubleshooting

### "Host key verification failed"
The server's host key isn't trusted yet. Add `StrictHostKeyChecking accept-new` to your SSH config, or run:
```bash
ssh-keyscan YOUR_SERVER_IP >> ~/.ssh/known_hosts
```

### "Load key: invalid format"
The private key got corrupted during copy/paste. Download the key file directly from cPanel instead of copying the text.

### "Permission denied (publickey)"
- Verify the public key is **authorized** in cPanel SSH Access
- Verify the private key file has `chmod 600` permissions
- Verify the SSH config points to the correct key file and username
- Make sure you're using the cPanel username, not the WHM/reseller username

### "Could not resolve hostname"
Your domain's DNS may not point to the server. Use the server IP address directly in your SSH config's `HostName` field instead of the domain name.

### Push rejected (histories differ)
```bash
git pull origin main --allow-unrelated-histories --no-rebase --no-edit
# Resolve conflicts, commit, then push
```

### cPanel shows old commit after push
If pushing to `cpanel` remote succeeds but cPanel UI shows an old commit, go to cPanel → Git Version Control → Manage → **Update from Remote** → **Deploy HEAD Commit** once. Subsequent pushes should auto-deploy.

---

## Quick Reference

| Item | Value |
|---|---|
| GitHub remote | `origin` |
| cPanel remote | `cpanel` |
| SSH key (local) | `~/.ssh/cpanel_rsa` |
| SSH config | `~/.ssh/config` |
| Deploy config | `.cpanel.yml` (in project root) |
| cPanel repo path | `/home/USERNAME/repositories/REPONAME` |
| Production path | `/home/USERNAME/public_html/` |
