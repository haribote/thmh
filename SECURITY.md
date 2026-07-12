# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately via the "Report a vulnerability" button in the [Security tab](https://github.com/haribote/thmh/security/advisories) of this repository. This uses GitHub Security Advisories to keep the report confidential.

**Do not file security issues as public GitHub issues.** Public issues can alert potential bad actors to vulnerabilities before patches are available.

## Supported Versions

This is a pre-1.0 prototype. Only the latest published version receives security fixes. When we ship a fix, it goes into a new release; we do not backport fixes to older versions.

## Supply Chain

thmh publishes three npm packages: `@thmh/core`, `@thmh/vite`, and `@thmh/cli`. You can verify the following about our supply chain:

**Publishing via GitHub Actions and npm Trusted Publishing**

Each release runs through GitHub Actions without any long-lived npm authentication tokens. We use [npm Trusted Publishing](https://docs.npmjs.com/using-npm/scopes#trusting-a-build-pipeline) with OpenID Connect (OIDC) to exchange GitHub's identity for temporary npm credentials. You can inspect our [publish workflow](https://github.com/haribote/thmh/blob/main/.github/workflows/publish.yml) to confirm this.

**Provenance Attestations**

Each published package includes a cryptographic attestation of where and how it was built. You can verify this:

```bash
npm view @thmh/core --json | jq '.versions | .latest | .dist'
```

The `"attestation"` field, if present, confirms the package was published by our automated workflow.

**No Install-Time Scripts**

None of our three packages runs code during installation. Each `package.json` contains only build-time scripts (`build`, `typecheck`, `test`), and explicitly omits lifecycle scripts like `preinstall`, `install`, or `postinstall`. This means you can safely install our packages with:

```bash
npm install --ignore-scripts
```
