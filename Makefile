build:
	pnpm run -r build

dev:
	pnpm run -r --parallel dev

test:
	NODE_ENV=development pnpm run -r --parallel test
