# Repository side: the `poc` environment with everything poc-deploy.yml reads.
# Not managed here (so they never enter state): HCLOUD_TOKEN, TOFU_STATE_PASSPHRASE,
# TOFU_GITHUB_TOKEN, SMTP_USERNAME, SMTP_PASSWORD.

locals {
  app_domain = "${replace(hcloud_primary_ip.v4.ip_address, ".", "-")}.sslip.io"

  poc_secret_names = ["POC_SSH_PRIVATE_KEY", "POC_SSH_KNOWN_HOSTS", "POSTGRES_PASSWORD", "JWT_KEY", "SEED_ADMIN_PASSWORD"]
  poc_secrets = {
    POC_SSH_PRIVATE_KEY = tls_private_key.deploy.private_key_openssh
    POC_SSH_KNOWN_HOSTS = "${hcloud_primary_ip.v4.ip_address} ${trimspace(tls_private_key.host.public_key_openssh)}"
    POSTGRES_PASSWORD   = random_password.postgres.result
    JWT_KEY             = random_password.jwt.result
    SEED_ADMIN_PASSWORD = random_password.seed_admin.result
  }

  poc_variables = {
    POC_HOST           = hcloud_primary_ip.v4.ip_address
    APP_DOMAIN         = local.app_domain
    HCLOUD_FIREWALL    = hcloud_firewall.ssh_ci.name
    SEED_ADMIN_EMAIL   = var.seed_admin_email
    EMAIL_FROM_ADDRESS = var.email_from_address
  }
}

# Alphanumeric only: values end up in a .env file and in shell, no escaping surprises.
resource "random_password" "postgres" {
  length  = 32
  special = false
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "random_password" "seed_admin" {
  length      = 24
  special     = false
  min_upper   = 2
  min_lower   = 2
  min_numeric = 2
}

resource "github_repository_environment" "poc" {
  repository  = var.github_repository
  environment = "poc"

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }

  dynamic "reviewers" {
    for_each = length(var.poc_reviewer_user_ids) > 0 ? [1] : []
    content {
      users = var.poc_reviewer_user_ids
    }
  }
}

resource "github_repository_environment_deployment_policy" "hetzner" {
  repository     = var.github_repository
  environment    = github_repository_environment.poc.environment
  branch_pattern = "hetzner"
}

resource "github_actions_environment_secret" "poc" {
  for_each        = toset(local.poc_secret_names)
  repository      = var.github_repository
  environment     = github_repository_environment.poc.environment
  secret_name     = each.key
  plaintext_value = local.poc_secrets[each.key]
}

resource "github_actions_environment_variable" "poc" {
  for_each      = local.poc_variables
  repository    = var.github_repository
  environment   = github_repository_environment.poc.environment
  variable_name = each.key
  value         = each.value
}
