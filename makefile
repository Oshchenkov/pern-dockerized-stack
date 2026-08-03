
# Variables to avoid repetition
BASE_COMPOSE_FILE=docker-compose.yaml
DEVELOPMENT_COMPOSE_FILE=docker-compose.dev.yaml
TEST_COMPOSE_FILE=docker-compose.test.yaml
PROD_COMPOSE_FILE=docker-compose.prod.yaml

# ---------------------------------------------------------------------------
#  DEV TARGETS
# ---------------------------------------------------------------------------

.PHONY:  build build.clean up stop down clean watch certs trust extract-ca trust-mac trust-linux certs-linux

build:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} build 

build.clean:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} build --no-cache
	
watch:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} up 

up:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} up -d

stop: 
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} stop

down:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} down

clean:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${DEVELOPMENT_COMPOSE_FILE} down --volumes --remove-orphans



trust: extract-ca
	@uname -s | grep -q Darwin && $(MAKE) trust-mac || $(MAKE) trust-linux

extract-ca:
	@mkdir -p ./cert/certs/ca
	$(COMPOSE) run --rm --entrypoint "" certs cat /certs/ca/ca.crt > ./cert/certs/ca/ca.crt
	$(COMPOSE) run --rm --entrypoint "" certs cat /certs/ca/ca.key > ./cert/certs/ca/ca.key
	@echo "CA extracted to ./cert/certs/ca/"

trust-mac:
	@echo "Installing local CA into macOS trust store..."
	sudo security add-trusted-cert -d -r trustRoot \
		-k /Library/Keychains/System.keychain \
		./cert/certs/ca/ca.crt
	@echo "Done. Restart your browser."

trust-linux:
	@echo "Installing local CA into Linux trust store..."
	sudo cp ./cert/certs/ca/ca.crt /usr/local/share/ca-certificates/local-dev-ca.crt
	sudo update-ca-certificates
	@echo "Done. Restart your browser."

# run outside of devcontainer to generate certs
certs-linux:
	curl -sSL -o /tmp/mkcert "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
	chmod +x /tmp/mkcert
	sudo mv /tmp/mkcert /usr/local/bin/mkcert
	mkdir -p cert/tls
	mkcert -cert-file cert/tls/tls.crt -key-file cert/tls/tls.key localhost 127.0.0.1


	

# ---------------------------------------------------------------------------
#  PROD TARGETS
# ---------------------------------------------------------------------------

.PHONY:  build.prod up.prod stop.prod down.prod clean.prod

build.prod:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${PROD_COMPOSE_FILE} build --no-cache

up.prod:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${PROD_COMPOSE_FILE} up -d

stop.prod: 
	docker compose -f ${BASE_COMPOSE_FILE} -f ${PROD_COMPOSE_FILE} stop

down.prod:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${PROD_COMPOSE_FILE} down

clean.prod:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${PROD_COMPOSE_FILE} down --volumes --remove-orphans

# ---------------------------------------------------------------------------
#  TEST TARGETS
# ---------------------------------------------------------------------------
.PHONY:  build.test up.test stop.test down.test clean.test	

build.test:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${TEST_COMPOSE_FILE} build --no-cache	

up.test:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${TEST_COMPOSE_FILE} up -d	

stop.test:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${TEST_COMPOSE_FILE} stop

down.test:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${TEST_COMPOSE_FILE} down

clean.test:
	docker compose -f ${BASE_COMPOSE_FILE} -f ${TEST_COMPOSE_FILE} down --volumes --remove-orphans	

