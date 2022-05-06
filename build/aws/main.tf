terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.13"
    }
  }

  required_version = ">= 1.1.8"
}

provider "aws" {
  profile = "default"
  region  = "us-east-1"
}

data "aws_ami" "common_ami" {
  most_recent      = true
  owners           = ["self"]

  filter {
    name   = "name"
    values = ["common-ubuntu"]
  }
}

data "aws_key_pair" "budgeting" {
  key_name = "budgeting"
}

resource "aws_instance" "control_plane" {
  ami                         = data.aws_ami.common_ami.id
  associate_public_ip_address = true
  instance_type               = "t4g.small"
  key_name                    = data.aws_key_pair.budgeting.key_name
  user_data                   = <<-EOL
  #!/bin/bash

  kubeadm init --pod-network-cidr=192.168.0.0/16
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

  kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

  kubectl taint nodes --all node-role.kubernetes.io/master-

  echo "Control Plane setup complete"
  EOL
}

resource "aws_security_group" "control_plane" {
  name = "control_plane"

  ingress {
    from_port        = 8080
    to_port          = 8080
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  ingress {
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

output "control_plane_ip" {
  value = aws_instance.control_plane.public_ip
}
