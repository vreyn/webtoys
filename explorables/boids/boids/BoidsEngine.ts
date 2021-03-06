﻿/// <reference path="References.ts" />
namespace Boids {
    
    export class BoidsEngine {

        width: number;
        height: number;
        boids: Array<Agent>;
        obstacles: Array<Agent>;
        separationRadius: number;
        separationForceIntensity: number;
        alignmentRadius: number;
        alignmentForceIntensity: number;
        cohesionRadius: number;
        cohesionForceIntensity: number;
        obstacleRadius: number;
        obstacleForceIntensity: number;
        context: CanvasRenderingContext2D;
        frameUpdateDeltaTime: number;
        specialBoid: number;
        showOverlay: boolean;
        bounds: Vector2D;

        constructor(context: CanvasRenderingContext2D, params) {
            this.context = context;
            this.frameUpdateDeltaTime = 1 / 60;
            this.width = params.width;
            this.height = params.height;
            this.bounds = new Vector2D(this.width, this.height));

            this.separationRadius = params.separationRadius;
            this.separationForceIntensity = params.separationForceIntensity;
            this.alignmentRadius = params.alignmentRadius;
            this.alignmentForceIntensity = params.alignmentForceIntensity;
            this.cohesionRadius = params.cohesionRadius;
            this.cohesionForceIntensity = params.cohesionForceIntensity;
            this.obstacleRadius = params.obstacleRadius;
            this.obstacleForceIntensity = params.obstacleForceIntensity;

            this.boids = new Array<Agent>();
            var i: number;
            for (i = 0; i < params.numberOfBoids; i++) {
                var position = new Vector2D(0.1 * this.width + Math.random() * this.width * 0.8, 0.1 * this.height + Math.random() * this.height * 0.8);
                var speed = new Vector2D(2 * Math.random() - 1, 2 * Math.random() - 1);
                var fov = Math.PI / 2;
                this.boids.push(new Agent(position, speed, fov, 8, 10, '#ffb266'));
            }
            this.obstacles = new Array<Agent>();
            for (i = 0; i < params.numberOfObstacles; i++) {
                this.addObstacle(Math.random() * this.width, Math.random() * this.height);
            };

            this.specialBoid = params.numberOfBoids / 2;
            this.showOverlay = true;

        }

        draw() {
            this.context.fillStyle = '#222';
            this.context.strokeStyle = 'white';
            this.context.fillRect(0, 0, this.width, this.height);
            this.context.strokeRect(0, 0, this.width, this.height);
            var i: number;
            for (i = 0; i < this.obstacles.length; i++) {
                this.drawObstacle(this.obstacles[i]);
            }
            for (i = 0; i < this.boids.length; i++) {
                this.drawBoid(this.boids[i]);

                var separationForce = this.getSeparationForce(this.boids[i], this.boids, this.separationRadius);
                separationForce = separationForce.multiply(this.separationForceIntensity);
                var alignmentForce = this.getAlignmentForce(this.boids[i], this.boids, this.alignmentRadius);
                alignmentForce = alignmentForce.multiply(this.alignmentForceIntensity);
                var cohesionForce = this.getCohesionForce(this.boids[i], this.boids, this.cohesionRadius);
                cohesionForce = cohesionForce.multiply(this.cohesionForceIntensity);
                var obstacleForce = this.getSeparationForce(this.boids[i], this.obstacles, this.obstacleRadius);
                obstacleForce = obstacleForce.multiply(this.obstacleForceIntensity);

                this.boids[i].force = (separationForce.add(alignmentForce).add(cohesionForce).add(obstacleForce));
                this.boids[i].update(this.frameUpdateDeltaTime);

                if (this.boids[i].position.x < 0)
                    this.boids[i].position.x = this.width;
                if (this.boids[i].position.x > this.width)
                    this.boids[i].position.x = 0;
                if (this.boids[i].position.y < 0)
                    this.boids[i].position.y = this.height;
                if (this.boids[i].position.y > this.height)
                    this.boids[i].position.y = 0;

               

                if (i === this.specialBoid && this.showOverlay) {
                    var forces = [separationForce, alignmentForce, cohesionForce, obstacleForce];
                    var radiuses = [this.separationRadius, this.alignmentRadius, this.cohesionRadius, this.obstacleRadius];
                    this.drawBoidOverlay(this.boids[i], forces, radiuses);
                }
            }
            
        }

        drawBoid(boid: Agent) {
            this.context.fillStyle = boid.color;
            this.context.strokeStyle = "black";
            var normalizedSpeed = boid.speed.normalized();
            var perpSpeed = new Vector2D(-normalizedSpeed.y, normalizedSpeed.x);
            var point1 = boid.position.add(perpSpeed.multiply(boid.width / 2));
            var point2 = boid.position.add(normalizedSpeed.multiply(boid.height));
            var point3 = boid.position.substract(perpSpeed.multiply(boid.width / 2));
            this.context.beginPath();
            this.context.moveTo(point1.x, point1.y);
            this.context.lineTo(point2.x, point2.y);
            this.context.lineTo(point3.x, point3.y);
            this.context.lineWidth = 1;
            this.context.fill();
            this.context.stroke();
        }

        drawObstacle(obstacle: Agent) {
            this.context.fillStyle = obstacle.color;
            this.context.strokeStyle = "black";
            this.context.lineWidth = 1;
            this.context.fillRect(obstacle.position.x, obstacle.position.y, obstacle.width, obstacle.height);
            this.context.strokeRect(obstacle.position.x, obstacle.position.y, obstacle.width, obstacle.height);
        }

        drawBoidOverlay(boid: Agent, forces: Array<Vector2D>, radiuses: Array<number>) {
            var colors = ["#88FF88", "#FF8888", "#FF88FF", "#88FFFF"];
            for (var i = 0; i < radiuses.length; i++) {
                this.context.beginPath();
                this.context.arc(boid.position.x, boid.position.y, radiuses[i], 0, 2 * Math.PI, false);
                this.context.lineWidth = 2;
                this.context.strokeStyle = colors[i];
                this.context.stroke();

                var forcePoint = boid.position.add(forces[i].multiply(10));
                this.context.beginPath();
                this.context.moveTo(boid.position.x, boid.position.y);
                this.context.lineTo(forcePoint.x, forcePoint.y);
                this.context.stroke();

            };
        }

        addObstacle(x, y) {
            var position = new Vector2D(x, y);
            var speed = new Vector2D(0, 0);
            var obstacle = new Agent(position, speed, 0, 25, 25, "#99ccff");
            this.obstacles.push(obstacle);
        }

        getSeparationForce(agent: Agent, agents: Array<Agent>, radius: number) {
            var accumulatedSeparation = new Vector2D(0, 0);
            for (var i = 0; i < agents.length; i++) {
                if (agents[i] !== agent && agent.modularIsNeighbour(agents[i], radius, this.bounds)) {
                    accumulatedSeparation = accumulatedSeparation.add(agent.position.substract(agents[i].position));
                }
            }
            return accumulatedSeparation.normalized();
        }

        getAlignmentForce(agent: Agent, agents: Array<Agent>, radius: number) {
            var averageAlignment = new Vector2D(0, 0);
            var numberOfNeighbours = 0;
            for (var i = 0; i < agents.length; i++) {
                if (agents[i] !== agent && agent.modularIsNeighbour(agents[i], radius, this.bounds)) {
                    averageAlignment = averageAlignment.add(agents[i].speed);
                    numberOfNeighbours += 1;
                }
            }
            if (numberOfNeighbours > 0)
                averageAlignment = averageAlignment.multiply(1 / numberOfNeighbours);

            return averageAlignment.substract(agent.speed).normalized();
        }

        getCohesionForce(agent: Agent, agents: Array<Agent>, radius: number) {
            var averagePosition = new Vector2D(0, 0);
            var numberOfNeighbours = 0;
            for (var i = 0; i < agents.length; i++) {
                if (agents[i] !== agent && agent.modularIsNeighbour(agents[i], radius, this.bounds)) {
                    averagePosition = averagePosition.add(agents[i].position);
                    numberOfNeighbours += 1;
                }
            }
            if (numberOfNeighbours > 0)
                averagePosition = averagePosition.multiply(1 / numberOfNeighbours);

            return averagePosition.substract(agent.position).normalized();
        }


    }
}