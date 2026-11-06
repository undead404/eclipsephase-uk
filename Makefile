#!make

.PHONY: prepare serve clean rebuild
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

book: ep2e.css book.toml scripts src
	mdbook build

serve:
	mdbook serve --open

clean:
	rm -rf book

prepare:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
	cargo install mdbook --version 0.4.52 --locked

rebuild: clean book
