#!make

.PHONY: deploy prepare
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

book: ep2e.css book.toml scripts src
	mdbook build

clean:
	rm -rf book

deploy: book
	npx surge --project book --domain https://eclipsephase-uk.surge.sh

prepare:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	cargo install mdbook

rebuild: clean book