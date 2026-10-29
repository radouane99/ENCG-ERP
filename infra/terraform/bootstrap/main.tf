terraform {
  required_version = ">= 1.6, < 2.0"
}

locals {
  # Portable cloud-init only. No cloud account, server or billable resource is created.
  cloud_config = {
    hostname        = var.hostname
    timezone        = "Africa/Casablanca"
    package_update  = true
    package_upgrade = true
    ssh_pwauth      = false
    disable_root    = true
    packages        = ["ca-certificates", "curl", "ufw", "unattended-upgrades"]
    users = [
      "default",
      {
        name                = "encg"
        groups              = ["sudo"]
        shell               = "/bin/bash"
        sudo                = ["ALL=(ALL) NOPASSWD:ALL"]
        lock_passwd         = true
        ssh_authorized_keys = var.ssh_public_keys
      }
    ]
    runcmd = concat(
      [["ufw", "default", "deny", "incoming"], ["ufw", "default", "allow", "outgoing"]],
      [for cidr in var.administration_cidrs : ["ufw", "allow", "from", cidr, "to", "any", "port", "22", "proto", "tcp"]],
      [["ufw", "allow", "80/tcp"], ["ufw", "allow", "443/tcp"], ["ufw", "--force", "enable"],
      ["install", "-d", "-o", "encg", "-g", "encg", "-m", "0750", "/opt/encg-erp"]]
    )
  }
}

output "cloud_init" {
  description = "Reviewable Ubuntu cloud-init payload; wire into the chosen provider after hosting is selected."
  value       = "#cloud-config\n${yamlencode(local.cloud_config)}"
}
