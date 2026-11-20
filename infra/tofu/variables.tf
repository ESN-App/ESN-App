variable "owner_ssh_key_name" {
  description = "Name of the owner's existing SSH key in the Hetzner project."
  type        = string
}

variable "admin_ssh_cidrs" {
  description = "CIDRs allowed to SSH permanently (CI opens its own temporary rule on the ssh_ci firewall)."
  type        = list(string)
  default     = []

  validation {
    condition     = alltrue([for c in var.admin_ssh_cidrs : can(cidrhost(c, 0))])
    error_message = "Every entry must be a valid CIDR, e.g. 203.0.113.7/32."
  }
}

variable "server_type" {
  description = "Hetzner server type. cpx02 (1 GB) by default; fall back to cpx12 (2 GB) if unavailable."
  type        = string
  default     = "cpx02"
}

variable "github_owner" {
  description = "GitHub organisation or user that owns the repository."
  type        = string
  default     = "ESN-App"
}

variable "github_repository" {
  description = "Repository name that receives the `poc` environment, secrets and variables."
  type        = string
  default     = "ESN-App"
}

variable "poc_reviewer_user_ids" {
  description = "Numeric GitHub user IDs required to approve deployments to `poc` (empty = no reviewers)."
  type        = list(number)
  default     = []
}

variable "seed_admin_email" {
  description = "Email of the seeded admin (variable SEED_ADMIN_EMAIL)."
  type        = string
}

variable "email_from_address" {
  description = "Sender address of outgoing mail; must be the Gmail account (variable EMAIL_FROM_ADDRESS)."
  type        = string
}
