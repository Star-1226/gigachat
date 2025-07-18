build:
	pnpm run -r build

test:
	NODE_ENV=development pnpm run -r --parallel test
