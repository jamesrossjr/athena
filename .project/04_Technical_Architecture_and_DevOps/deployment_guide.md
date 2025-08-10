# Deployment Guide - Athena PKM System

## Overview

This guide provides comprehensive instructions for deploying the Athena Personal Knowledge Management system across different environments, from local development to production cloud infrastructure.

## Prerequisites

### Development Environment
- **Node.js**: Version 18.x or higher
- **Docker**: Version 20.x or higher with Docker Compose
- **Git**: Version 2.30 or higher
- **VS Code**: Recommended IDE with extensions

### Production Environment
- **Kubernetes Cluster**: Version 1.24 or higher
- **Helm**: Version 3.8 or higher
- **Container Registry**: Docker Hub, AWS ECR, or similar
- **Domain Name**: With SSL certificate
- **Cloud Storage**: AWS S3, Google Cloud Storage, or MinIO

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/athena-pkm.git
cd athena-pkm
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration
nano .env.local
```

#### Environment Variables
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/athena_dev"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
SESSION_SECRET="your-session-secret-here"

# File Storage
STORAGE_TYPE="local" # or "s3", "gcs", "minio"
STORAGE_PATH="./uploads"

# External Services
ELASTICSEARCH_URL="http://localhost:9200"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# Application Settings
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Docker Compose Setup
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: athena_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Cache
  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Search
  elasticsearch:
    image: elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  # File Storage (MinIO)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  minio_data:
```

### 4. Start Development Services
```bash
# Start infrastructure services
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

### 5. Verify Installation
```bash
# Check service health
curl http://localhost:3000/health

# Check database connection
npm run db:status

# Access development server
open http://localhost:3000
```

## Staging Environment

### 1. AWS ECS Deployment

#### Task Definition
```json
{
  "family": "athena-staging",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "athena-backend",
      "image": "your-registry/athena-backend:staging",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "staging"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:athena/staging/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/athena-staging",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Service Configuration
```json
{
  "serviceName": "athena-staging",
  "cluster": "athena-cluster",
  "taskDefinition": "athena-staging",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-12345", "subnet-67890"],
      "securityGroups": ["sg-athena-staging"],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/athena-staging",
      "containerName": "athena-backend",
      "containerPort": 3000
    }
  ]
}
```

### 2. Deploy to Staging
```bash
# Build and push image
docker build -t athena-backend:staging .
docker tag athena-backend:staging your-registry/athena-backend:staging
docker push your-registry/athena-backend:staging

# Update ECS service
aws ecs update-service \
  --cluster athena-cluster \
  --service athena-staging \
  --task-definition athena-staging:latest

# Run database migrations
aws ecs run-task \
  --cluster athena-cluster \
  --task-definition athena-migration:latest \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-athena-staging],assignPublicIp=ENABLED}"
```

## Production Deployment

### 1. Kubernetes Production Setup

#### Namespace Configuration
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: athena-production
  labels:
    name: athena-production
    environment: production
```

#### ConfigMap
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: athena-config
  namespace: athena-production
data:
  NODE_ENV: "production"
  PORT: "3000"
  CORS_ORIGIN: "https://app.athena.com"
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
```

#### Secrets
```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: athena-secrets
  namespace: athena-production
type: Opaque
stringData:
  database-url: "postgresql://user:pass@host:5432/athena_prod"
  redis-url: "redis://redis-host:6379"
  jwt-secret: "your-production-jwt-secret"
  smtp-password: "your-smtp-password"
```

#### Deployment
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: athena-backend
  namespace: athena-production
  labels:
    app: athena-backend
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: athena-backend
  template:
    metadata:
      labels:
        app: athena-backend
        version: v1.0.0
    spec:
      containers:
      - name: backend
        image: your-registry/athena-backend:v1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: athena-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: athena-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
```

#### Service
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: athena-backend-service
  namespace: athena-production
  labels:
    app: athena-backend
spec:
  selector:
    app: athena-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
    name: http
  type: ClusterIP
```

#### Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: athena-ingress
  namespace: athena-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - app.athena.com
    - api.athena.com
    secretName: athena-tls
  rules:
  - host: app.athena.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: athena-frontend-service
            port:
              number: 80
  - host: api.athena.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: athena-backend-service
            port:
              number: 80
```

### 2. Helm Chart Deployment

#### Chart Structure
```
charts/athena/
├── Chart.yaml
├── values.yaml
├── values-production.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── hpa.yaml
│   └── pdb.yaml
```

#### Deploy with Helm
```bash
# Add Helm repository (if using external chart)
helm repo add athena https://charts.athena.com
helm repo update

# Deploy to production
helm upgrade --install athena-prod ./charts/athena \
  --namespace athena-production \
  --values charts/athena/values-production.yaml \
  --set image.tag=v1.0.0 \
  --set ingress.hosts[0].host=app.athena.com \
  --timeout 10m \
  --wait

# Verify deployment
kubectl get pods -n athena-production
kubectl get services -n athena-production
kubectl get ingress -n athena-production
```

### 3. Database Migration in Production
```bash
# Create migration job
kubectl create job --from=cronjob/athena-migration athena-migration-$(date +%s) -n athena-production

# Monitor migration
kubectl logs -f job/athena-migration-$(date +%s) -n athena-production

# Verify migration status
kubectl exec -it deployment/athena-backend -n athena-production -- npm run db:status
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: athena-pkm

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Run E2E tests
      run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ github.repository }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'latest'
    
    - name: Set up Helm
      uses: azure/setup-helm@v3
      with:
        version: 'latest'
    
    - name: Configure Kubeconfig
      run: |
        echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig
    
    - name: Deploy to Production
      run: |
        helm upgrade --install athena-prod ./charts/athena \
          --namespace athena-production \
          --values charts/athena/values-production.yaml \
          --set image.tag=${{ github.ref_name }} \
          --timeout 10m \
          --wait
```

## Monitoring and Health Checks

### Health Check Endpoint
```javascript
// health.js
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    checks: {}
  }

  try {
    // Database check
    health.checks.database = await checkDatabase()
    
    // Redis check
    health.checks.redis = await checkRedis()
    
    // Storage check
    health.checks.storage = await checkStorage()
    
    // External services check
    health.checks.elasticsearch = await checkElasticsearch()

    const isHealthy = Object.values(health.checks)
      .every(check => check.status === 'healthy')
    
    health.status = isHealthy ? 'healthy' : 'unhealthy'
    
    res.status(isHealthy ? 200 : 503).json(health)
  } catch (error) {
    health.status = 'unhealthy'
    health.error = error.message
    res.status(503).json(health)
  }
})
```

### Prometheus Monitoring
```yaml
# monitoring.yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: athena-backend
  namespace: athena-production
spec:
  selector:
    matchLabels:
      app: athena-backend
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

## Scaling and Performance

### Horizontal Pod Autoscaler
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: athena-backend-hpa
  namespace: athena-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: athena-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Pod Disruption Budget
```yaml
# pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: athena-backend-pdb
  namespace: athena-production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: athena-backend
```

## Backup and Disaster Recovery

### Database Backup
```bash
# Automated daily backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="athena_backup_$DATE"

# Create backup
pg_dump $DATABASE_URL > "$BACKUP_NAME.sql"

# Compress backup
gzip "$BACKUP_NAME.sql"

# Upload to S3
aws s3 cp "$BACKUP_NAME.sql.gz" s3://athena-backups/database/

# Clean up local file
rm "$BACKUP_NAME.sql.gz"

# Keep only last 30 days of backups
aws s3 ls s3://athena-backups/database/ | grep ".sql.gz" | \
  sort -k1,2 | head -n -30 | awk '{print $4}' | \
  xargs -I {} aws s3 rm s3://athena-backups/database/{}
```

### File Storage Backup
```bash
# Sync files to backup location
aws s3 sync s3://athena-storage s3://athena-storage-backup --delete
```

## Troubleshooting

### Common Issues

#### Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n athena-production

# Check logs
kubectl logs <pod-name> -n athena-production --previous

# Check events
kubectl get events -n athena-production --sort-by=.metadata.creationTimestamp
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/athena-backend -n athena-production -- \
  node -e "console.log(require('./src/database').test())"

# Check database pod logs
kubectl logs deployment/postgres -n athena-production
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n athena-production

# Check HPA status
kubectl get hpa -n athena-production

# Check metrics
curl http://api.athena.com/metrics
```

### Rollback Procedures
```bash
# Rollback Helm deployment
helm rollback athena-prod -n athena-production

# Rollback Kubernetes deployment
kubectl rollout undo deployment/athena-backend -n athena-production

# Check rollback status
kubectl rollout status deployment/athena-backend -n athena-production
```

---

**Document Owner**: DevOps Team  
**Last Updated**: [Date]  
**Version**: 1.0  
**Next Review**: [Date]