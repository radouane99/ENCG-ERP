variables {
  ssh_public_keys      = ["ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITestOnlyPublicKeyForValidation"]
  administration_cidrs = ["203.0.113.10/32"]
}

run "portable_bootstrap" {
  command = plan
  assert {
    condition     = startswith(output.cloud_init, "#cloud-config\n") && strcontains(output.cloud_init, "ssh_pwauth")
    error_message = "The output must be a cloud-init document."
  }
  assert {
    condition     = !strcontains(output.cloud_init, "5432") && !strcontains(output.cloud_init, "6379")
    error_message = "Database and Redis ports must not be opened."
  }
}

run "reject_unrestricted_ssh" {
  command = plan
  variables {
    administration_cidrs = ["0.0.0.0/0"]
  }
  expect_failures = [var.administration_cidrs]
}

run "reject_invalid_ssh_key" {
  command = plan
  variables {
    ssh_public_keys = ["not-a-public-key"]
  }
  expect_failures = [var.ssh_public_keys]
}

run "reject_world_range_with_host_bits" {
  command = plan
  variables {
    administration_cidrs = ["203.0.113.10/0"]
  }
  expect_failures = [var.administration_cidrs]
}
