locals {
  labels = { app = "esn", env = "poc" }
}

# Generated key pairs: the CI deploy key and the server's SSH host key.
resource "tls_private_key" "deploy" {
  algorithm = "ED25519"
}

resource "tls_private_key" "host" {
  algorithm = "ED25519"
}

data "hcloud_ssh_key" "owner" {
  name = var.owner_ssh_key_name
}

resource "hcloud_ssh_key" "deploy" {
  name       = "esn-poc-deploy"
  public_key = trimspace(tls_private_key.deploy.public_key_openssh)
}

# Stable IP so <ip>.sslip.io survives a server rebuild.
resource "hcloud_primary_ip" "v4" {
  name              = "esn-poc-v4"
  type              = "ipv4"
  location          = "hel1"
  auto_delete       = false
  delete_protection = true
  labels            = local.labels
}

resource "hcloud_firewall" "web" {
  name   = "esn-poc-web"
  labels = local.labels

  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "http"
  }
  rule {
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "https"
  }
  rule {
    direction   = "in"
    protocol    = "icmp"
    source_ips  = ["0.0.0.0/0", "::/0"]
    description = "ping"
  }
  dynamic "rule" {
    for_each = length(var.admin_ssh_cidrs) > 0 ? [1] : []
    content {
      direction   = "in"
      protocol    = "tcp"
      port        = "22"
      source_ips  = var.admin_ssh_cidrs
      description = "admin ssh"
    }
  }
}

# Mutated by poc-deploy.yml (temporary SSH rule for the runner); tofu must not fight it.
resource "hcloud_firewall" "ssh_ci" {
  name   = "esn-poc-ssh-ci"
  labels = local.labels

  lifecycle {
    ignore_changes = [rule]
  }
}

resource "hcloud_server" "poc" {
  name        = "esn-poc"
  server_type = var.server_type
  location    = "hel1"
  image       = "ubuntu-24.04"
  backups     = true
  labels      = local.labels

  user_data = templatefile("${path.module}/cloud-init.yaml.tftpl", {
    deploy_ssh_public_key = trimspace(tls_private_key.deploy.public_key_openssh)
    owner_ssh_public_key  = trimspace(data.hcloud_ssh_key.owner.public_key)
    host_private_key      = trimspace(tls_private_key.host.private_key_openssh)
    host_public_key       = trimspace(tls_private_key.host.public_key_openssh)
  })
  ssh_keys     = [data.hcloud_ssh_key.owner.id, hcloud_ssh_key.deploy.id]
  firewall_ids = [hcloud_firewall.web.id, hcloud_firewall.ssh_ci.id]

  public_net {
    ipv4_enabled = true
    ipv4         = hcloud_primary_ip.v4.id
    ipv6_enabled = true
  }

  # server_type change = resize that keeps the disk, so it stays reversible.
  keep_disk          = true
  delete_protection  = true
  rebuild_protection = true

  # Changing cloud-init/image/keys must be an explicit rebuild, not a silent in-place change.
  lifecycle {
    ignore_changes = [user_data, image, ssh_keys]
  }
}
