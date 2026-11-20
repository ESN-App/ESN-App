output "ipv4" {
  value = hcloud_primary_ip.v4.ip_address
}

output "ipv6" {
  value = hcloud_server.poc.ipv6_address
}

output "app_domain" {
  value = local.app_domain
}

output "ssh_ci_firewall" {
  description = "Also written to the HCLOUD_FIREWALL variable of the poc environment."
  value       = hcloud_firewall.ssh_ci.name
}

output "server_id" {
  value = hcloud_server.poc.id
}
