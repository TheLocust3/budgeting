packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.9"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

locals {
  date = formatdate("YYYY-MM-DD-hhmm", timestamp())
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "common-ubuntu-${local.date}"
  instance_type = "t4g.small"
  region        = "us-east-1"
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-arm64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"
}

build {
  name = "common"
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "file" {
    source = "tmp/ecr_refresh.sh"
    destination = "/home/ubuntu/ecr_refresh.sh"
  }

  provisioner "shell" {
    inline = [
      "chmod 777 /home/ubuntu/ecr_refresh.sh",

      "sudo apt-get update",
      "sudo apt-get install -y unzip",
      "curl \"https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip\" -o \"awscliv2.zip\"",
      "unzip awscliv2.zip",
      "sudo ./aws/install",

      "curl -sfL https://get.k3s.io > install.sh",

      "(sudo crontab -l 2>/dev/null; echo \"0 * * * *  cd /home/ubuntu/ && ./ecr_refresh.sh\") | sudo crontab -"
    ]
  }
}
