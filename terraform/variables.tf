variable "render_api_key" {
  description = "Render API key"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Render account/owner ID"
  type        = string
}

variable "service_name" {
  description = "Name of the backend web service"
  type        = string
  default     = "farm-guard-backend"
}

variable "github_repo_url" {
  description = "GitHub repo URL for the backend code"
  type        = string
  default     = "https://github.com/islem14623/farm-guard"
}

variable "branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "master"
}

variable "jwt_secret_key" {
  description = "Secret key used to sign JWT tokens"
  type        = string
  sensitive   = true
}