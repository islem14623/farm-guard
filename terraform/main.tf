terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

# Managed Postgres database on Render
resource "render_postgres" "farm_guard_db" {
  name    = "farm-guard-db"
  plan    = "free"
  region  = "frankfurt"
  version = "16"
}

# Backend web service, built from Dockerfile in the repo
resource "render_web_service" "farm_guard_backend" {
  name   = var.service_name
  plan   = "free"
  region = "frankfurt"

  runtime_source = {
    docker = {
      repo_url   = var.github_repo_url
      branch     = var.branch
      dockerfile_path = "./Dockerfile"
    }
  }

  env_vars = {
    DATABASE_URL = {
      value = render_postgres.farm_guard_db.connection_info.internal_connection_string
    }
    JWT_SECRET_KEY = {
      value = var.jwt_secret_key
    }
  }
}

output "backend_url" {
  value = render_web_service.farm_guard_backend.url
}