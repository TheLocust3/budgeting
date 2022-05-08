packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.9"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "common-ubuntu"
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

  provisioner "shell" {
    inline = [
      "sudo apt-get update -y",
      "sudo apt-get install -y apt-transport-https ca-certificates curl",

      "sudo swapoff -a",
      "sudo sed -i '/ swap / s/^\\(.*\\)$/#\\1/g' /etc/fstab",

      "echo -e \"br_netfilter\n\" | sudo tee /etc/modules-load.d/k8s.conf",
      "echo -e \"net.bridge.bridge-nf-call-ip6tables = 1\nnet.bridge.bridge-nf-call-iptables = 1\n\" | sudo tee /etc/sysctl.d/k8s.conf",
      "sudo sysctl --system",


      "curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -",
      "sudo apt-add-repository \"deb http://apt.kubernetes.io/ kubernetes-xenial main\"",
      "sudo apt-get update",
      
      "sudo apt-get install -y ebtables ethtool",
      "sudo apt-get install -y docker.io kubelet kubeadm kubectl"
    ]
  }
}
