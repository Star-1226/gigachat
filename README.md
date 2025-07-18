# gigachat

Development monorepo template for **gigachat**.

## Structure

- `.github`
  - Contains workflows used by GitHub Actions.
- `packages`
  - Contains the individual packages managed in the monorepo.
  - [server](https://github.com/LankyMoose/gigachat/blob/main/packages/server)
  - [client](https://github.com/LankyMoose/gigachat/blob/main/packages/client)
  - [shared](https://github.com/LankyMoose/gigachat/blob/main/packages/shared)
- `sandbox`
  - Contains example applications and random tidbits.

## Tasks

- Use `make build` to recursively run the build script in each package
- Use `make test` to recursively run the test script in each package
