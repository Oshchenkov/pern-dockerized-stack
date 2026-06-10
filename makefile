
# Variables to avoid repetition
BASE_COMPOSE_FILE=docker-compose.yaml
DEVELOPMENT_COMPOSE_FILE=docker-compose.dev.yaml
TEST_COMPOSE_FILE=docker-compose.test.yaml
PROD_COMPOSE_FILE=docker-compose.prod.yaml

# ---------------------------------------------------------------------------
#  DEV TARGETS
# ---------------------------------------------------------------------------

.PHONY:  build up stop down clean watch

build:
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

