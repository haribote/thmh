# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately via the "Report a vulnerability" button in the [Security tab](https://github.com/haribote/thmh/security/advisories) of this repository. This uses GitHub Security Advisories to keep the report confidential.

**Do not file security issues as public GitHub issues.** A public issue discloses the vulnerability before a fix is available.

## Supported Versions

This is a pre-1.0 prototype. Only the latest published version receives security fixes. When we ship a fix, it goes into a new release; we do not backport fixes to older versions.

## Supply Chain

thmh publishes three npm packages: `@thmh/core`, `@thmh/vite`, and `@thmh/cli`. The following facts about how they reach npm are verifiable from this repository and from the registry.

**Trusted Publishing**

Releases are published from GitHub Actions using [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers), which exchanges the workflow's OpenID Connect (OIDC) identity for a short-lived npm credential. No long-lived npm token exists, either on a maintainer's machine or in GitHub Secrets. You can inspect the [publish workflow](https://github.com/haribote/thmh/blob/main/.github/workflows/publish.yml) to confirm this.

**Provenance attestations**

Releases published through that workflow carry a provenance attestation linking the package on npm back to the commit and workflow run that built it. Check any version with:

```bash
npm view @thmh/core@<version> --json | jq '.dist.attestations'
```

**No install-time scripts**

None of the three packages declares an install-time lifecycle script (`preinstall`, `install`, or `postinstall`), so none of them runs code on your machine at install time. They install correctly under `npm install --ignore-scripts`.
