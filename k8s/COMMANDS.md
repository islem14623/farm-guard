# Kubernetes commands cheat sheet

## Rebuild and redeploy backend after code changes
eval $(minikube docker-env)
docker build -t farm-guard-backend:latest .
kubectl rollout restart deployment farm-guard-backend

## Check status
kubectl get pods
kubectl get nodes
kubectl logs <pod-name>

## Get live URL
minikube service farm-guard-backend-service --url
