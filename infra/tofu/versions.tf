terraform {
  required_version = ">= 1.8"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.70"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.13"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.4"
    }
  }

  # Encrypted state lives on the `infra-state` branch, checked out into .state/ by CI.
  backend "local" {
    path = "../../.state/terraform.tfstate"
  }

  # The key provider (with the passphrase) comes from the TF_ENCRYPTION env var, because
  # encryption blocks cannot reference variables. See README.md.
  encryption {
    method "aes_gcm" "main" {
      keys = key_provider.pbkdf2.main
    }
    state {
      method   = method.aes_gcm.main
      enforced = true
    }
    plan {
      method   = method.aes_gcm.main
      enforced = true
    }
  }
}

provider "hcloud" {} # token from HCLOUD_TOKEN env

provider "github" {
  owner = var.github_owner # token from GITHUB_TOKEN env
}
