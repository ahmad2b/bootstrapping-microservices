up:
	docker-compose up --build
down:
	docker-compose down

up-prod:
	docker-compose -f docker-compose.prod.yml up --build