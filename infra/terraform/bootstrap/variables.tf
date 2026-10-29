variable "hostname" {
  type        = string
  description = "Hostname for the future ERP server."
  default     = "encg-erp"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,62}$", var.hostname))
    error_message = "Use a valid lowercase hostname."
  }
}

variable "ssh_public_keys" {
  type        = list(string)
  description = "Public SSH keys for the encg administrator; never private keys."
  validation {
    condition     = length(var.ssh_public_keys) > 0 && alltrue([for key in var.ssh_public_keys : can(regex("^ssh-(ed25519|rsa) [A-Za-z0-9+/]{40,}={0,3}( .*)?$", key))])
    error_message = "Supply at least one public SSH key."
  }
}

variable "administration_cidrs" {
  type        = list(string)
  description = "Administrator IP ranges permitted to SSH; no unrestricted SSH."
  validation {
    condition     = length(var.administration_cidrs) > 0 && alltrue([for cidr in var.administration_cidrs : can(cidrhost(cidr, 0)) && try(tonumber(split("/", cidr)[1]) > 0, false)])
    error_message = "Supply valid restricted administrator CIDRs."
  }
}
