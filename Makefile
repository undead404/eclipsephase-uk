#!make
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

build:
	echo $(GA_ID)
	mdbook build
deploy:
	npx surge --project book --domain https://eclipsephase-uk.surge.sh
prepare:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	cargo install mdbook