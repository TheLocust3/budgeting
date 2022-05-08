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

resource "aws_instance" "control_plane" {
  ami                         = data.aws_ami.common_ami.id
  associate_public_ip_address = true
  instance_type               = "t4g.small"
  key_name                    = data.aws_key_pair.budgeting.key_name
  security_groups             = ["${aws_security_group.control_plane.name}"]
  user_data                   = <<-EOL
  #!/bin/bash

  kubeadm init --pod-network-cidr=192.168.0.0/16
  mkdir -p /home/ubuntu/.kube
  sudo cp -i /etc/kubernetes/admin.conf /home/ubuntu/.kube/config
  sudo chown ubuntu /home/ubuntu/.kube/config

  export KUBECONFIG=/home/ubuntu/.kube/config

  sleep 60

  kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
  kubectl taint nodes --all node-role.kubernetes.io/control-plane- node-role.kubernetes.io/master-

  echo "Control Plane setup complete"
  EOL
}

output "control_plane_ip" {
  value = aws_instance.control_plane.public_ip
}
